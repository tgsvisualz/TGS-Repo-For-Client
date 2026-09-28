/**
 * Turns the single-file artifact build (dist-artifact/index.html) into a page fragment for the
 * private claude.ai preview link. The artifact host wraps pages in its own doctype/html/head/body
 * skeleton, so this keeps only: <title> first, then the inlined <style> blocks, the body markup
 * and the inlined module script(s).
 */
import { readFileSync, writeFileSync } from 'node:fs'

const input = 'dist-artifact/index.html'
const output = 'dist-artifact/velato.html'

const html = readFileSync(input, 'utf8')
const head = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? ''
const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? ''
const title = head.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || 'Velato'

const pick = (source, tag) => [...source.matchAll(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi'))].map((m) => m[0])

const styles = [...pick(head, 'style'), ...pick(body, 'style')]
const scripts = [...pick(head, 'script'), ...pick(body, 'script')]
const markup = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').trim()

if (!scripts.length) throw new Error('No inlined script found; did the single-file build run?')
for (const s of scripts) {
  const inner = s.replace(/^<script\b[^>]*>/i, '').replace(/<\/script>$/i, '')
  if (/<\/script/i.test(inner)) throw new Error('Inlined script contains a closing </script> sequence')
  if (/\bsrc=/.test(s.match(/^<script\b[^>]*>/i)[0])) throw new Error('External script left in artifact build: ' + s.slice(0, 120))
}

const fragment = [`<title>${title}</title>`, ...styles, markup, ...scripts].join('\n')
writeFileSync(output, fragment)
console.log(`artifact fragment → ${output} (${(Buffer.byteLength(fragment) / 1024 / 1024).toFixed(2)} MB)`)
