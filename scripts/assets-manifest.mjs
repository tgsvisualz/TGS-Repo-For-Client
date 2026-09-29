/**
 * Regenerates the slot table in ASSETS.md from the asset registry in src/data/catalog.ts,
 * so the swap manifest never drifts from the code. Run: npm run assets
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'vite'

const START = '<!-- slots:start -->'
const END = '<!-- slots:end -->'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const { ASSETS } = await server.ssrLoadModule('/src/data/catalog.ts')
  const entries = Object.values(ASSETS)

  const describe = (art) => {
    if (art.kind === 'trio') return 'The three veiled models together, backlit'
    if (art.kind === 'product') return `Still life: ${art.fabric} ${art.shape} bag on a plinth`
    const outfit =
      art.outfit.kind === 'dress'
        ? `${art.outfit.fabric} ${art.outfit.cut} dress`
        : `${art.outfit.topFabric} ${art.outfit.top} top, ${art.outfit.trouserFabric} ${art.outfit.trouser} trousers`
    const carry = art.carry ? `, carrying ${/^[aeiou]/i.test(art.carry.fabric) ? 'an' : 'a'} ${art.carry.fabric} ${art.carry.shape} bag` : ''
    return `Model ${art.model}, ${art.veil} veil, ${outfit}${carry} (${art.crop} crop)`
  }
  const cell = (s) => String(s).replace(/\|/g, '\\|')

  const groups = [
    ['Hero cast (photographs)', (e) => e.id.startsWith('HERO-')],
    ['Navigation: The Drop cards', (e) => e.id.startsWith('NAV-DROP-')],
    ['Navigation: category previews', (e) => e.id.startsWith('NAV-') && !e.id.startsWith('NAV-DROP-')],
    ['Pieces: Drop 014 teaser and This week', (e) => e.id.startsWith('PIECE-')],
    ['The Index', (e) => e.id.startsWith('IDX-')],
  ]

  let table = ''
  for (const [title, match] of groups) {
    const rows = entries.filter(match)
    if (!rows.length) continue
    table += `\n### ${title}\n\n| ID | Where | Placeholder now | Replace with | Status |\n|---|---|---|---|---|\n`
    for (const e of rows) {
      table += `| \`${e.id}\` | ${cell(e.usage)} | ${cell(describe(e.art))} | ${cell(e.brief)} | ${e.src ? 'Swapped' : 'Placeholder'} |\n`
    }
  }

  const md = readFileSync('ASSETS.md', 'utf8')
  const a = md.indexOf(START)
  const b = md.indexOf(END)
  if (a === -1 || b === -1) throw new Error(`ASSETS.md needs ${START} and ${END} markers`)
  const next = md.slice(0, a + START.length) + `\n_${entries.length} slots, generated from \`src/data/catalog.ts\` by \`npm run assets\`._\n` + table + '\n' + md.slice(b)
  writeFileSync('ASSETS.md', next)
  console.log(`ASSETS.md: ${entries.length} slots written`)
} finally {
  await server.close()
}
