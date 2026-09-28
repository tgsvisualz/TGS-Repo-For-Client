/**
 * `?view=art`: every placeholder on one dark sheet. It doubles as the client's visual swap
 * manifest: each slot shows its asset ID, where it is used and what photograph replaces it.
 */
import type { CSSProperties } from 'react'
import { ASSETS } from '../data/catalog'
import type { ArtSpec, AssetEntry, BagShape, Fabric, Light } from '../data/types'
import { Art } from './Art'
import styles from './ArtSheet.module.css'

interface Slot {
  entry: AssetEntry
  ratio: number
  ratioLabel: string
  backdrop: boolean
}

/** The frame each slot is rendered in on the site, from its usage. */
function frameFor(id: string): { ratio: number; label: string; backdrop: boolean } {
  if (id.startsWith('HERO-FIG-')) return { ratio: 2 / 5, label: '2:5 cut-out', backdrop: false }
  if (id.startsWith('NAV-DROP-')) return { ratio: 4 / 5, label: '4:5', backdrop: true }
  if (id.startsWith('NAV-')) return { ratio: 5 / 4, label: '5:4', backdrop: true }
  if (id === 'PIECE-NOTTE') return { ratio: 3 / 4, label: '3:4', backdrop: true }
  if (id.startsWith('PIECE-')) return { ratio: 4 / 5, label: '4:5', backdrop: true }
  if (id.startsWith('IDX-')) return { ratio: 3 / 4, label: '3:4', backdrop: true }
  return { ratio: 4 / 5, label: '4:5', backdrop: true }
}

const GROUPS: readonly { prefix: string; title: string }[] = [
  { prefix: 'NAV-DROP-', title: 'Navigation · The Drop cards' },
  { prefix: 'NAV-BAGS-', title: 'Navigation · Bags previews' },
  { prefix: 'NAV-PURSES-', title: 'Navigation · Purses previews' },
  { prefix: 'NAV-TOPS-', title: 'Navigation · Tops previews' },
  { prefix: 'NAV-PANTS-', title: 'Navigation · Pants previews' },
  { prefix: 'NAV-DRESSES-', title: 'Navigation · Dresses previews' },
  { prefix: 'PIECE-', title: 'Pieces · Drop 014 teaser and This week' },
  { prefix: 'IDX-', title: 'The Index · hover previews' },
]

const FABRIC_NAME: Record<Fabric, string> = {
  noir: 'noir',
  bone: 'bone',
  garnet: 'garnet',
  smoke: 'smoke',
  ash: 'ash',
  champagne: 'champagne',
  oxblood: 'oxblood',
}

function describe(spec: ArtSpec): string {
  if (spec.kind === 'trio') return 'Trio · A, B, C backlit'
  if (spec.kind === 'product') return `Still life · ${spec.shape} · ${FABRIC_NAME[spec.fabric]} · light ${spec.light ?? 'left'}`
  const o = spec.outfit
  const look = o.kind === 'dress' ? `${o.fabric} ${o.cut} dress` : `${o.topFabric} ${o.top} · ${o.trouserFabric} ${o.trouser}`
  const carry = spec.carry ? ` · ${spec.carry.fabric} ${spec.carry.shape}` : ''
  return `Model ${spec.model} · ${spec.veil} veil · ${look}${carry} · ${spec.crop} · light ${spec.light ?? 'left'}`
}

function Frame({ spec, ratio, backdrop = true, id }: { spec: ArtSpec; ratio: number; backdrop?: boolean; id?: string }) {
  const style = { aspectRatio: String(ratio) } as CSSProperties
  return (
    <div className={styles.frame} style={style} data-art-id={id}>
      <Art spec={spec} ratio={ratio} backdrop={backdrop} />
    </div>
  )
}

function SlotCard({ slot }: { slot: Slot }) {
  const { entry } = slot
  return (
    <figure className={styles.card}>
      <Frame spec={entry.art} ratio={slot.ratio} backdrop={slot.backdrop} id={entry.id} />
      <figcaption className={styles.caption}>
        <span className={styles.id}>
          {entry.id}
          <span className={styles.ratio}>{slot.ratioLabel}</span>
        </span>
        <p className={styles.usage}>{entry.usage}</p>
        <p className={styles.brief}>{entry.brief}</p>
        <p className={styles.spec}>{describe(entry.art)}</p>
      </figcaption>
    </figure>
  )
}

const MODELS: readonly { id: string; name: string; note: string; spec: ArtSpec }[] = [
  { id: 'MODEL-A', name: 'Model A', note: 'Deep skin, close-coiled high bun, ivory veil', spec: { ...ASSETS['HERO-FIG-A'].art } },
  { id: 'MODEL-B', name: 'Model B', note: 'Warm golden skin, sleek low bun, black tulle veil', spec: { ...ASSETS['HERO-FIG-B'].art } },
  { id: 'MODEL-C', name: 'Model C', note: 'Light skin, soft wavy chignon, smoke veil', spec: { ...ASSETS['HERO-FIG-C'].art } },
  { id: 'TRIO', name: 'The trio', note: 'Veiled until Thursday: backlit, pieces unreadable', spec: { kind: 'trio', light: 'top' } },
]

const PRODUCTS: readonly { shape: BagShape; fabric: Fabric; light: Light; name: string }[] = [
  { shape: 'top-handle', fabric: 'noir', light: 'left', name: 'Top handle' },
  { shape: 'shoulder', fabric: 'oxblood', light: 'right', name: 'Shoulder' },
  { shape: 'tote', fabric: 'bone', light: 'top', name: 'Tote' },
  { shape: 'crossbody', fabric: 'noir', light: 'left', name: 'Crossbody' },
  { shape: 'clutch', fabric: 'garnet', light: 'top', name: 'Clutch' },
  { shape: 'mini', fabric: 'champagne', light: 'right', name: 'Mini' },
  { shape: 'evening', fabric: 'noir', light: 'left', name: 'Evening' },
  { shape: 'pouch', fabric: 'smoke', light: 'left', name: 'Pouch' },
]

export function ArtSheet() {
  const entries = Object.values(ASSETS)
  const slots: Slot[] = entries.map((entry) => {
    const f = frameFor(entry.id)
    return { entry, ratio: f.ratio, ratioLabel: f.label, backdrop: f.backdrop }
  })
  const hero = slots.filter((s) => s.entry.id.startsWith('HERO-FIG-'))
  const swapped = entries.filter((e) => e.src).length

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <header>
          <p className={styles.eyebrow}>Velato · placeholder art</p>
          <h1 className={styles.title}>The veiled sheet</h1>
          <p className={styles.lede}>
            Every image slot on the site draws this art until the photography arrives. To swap one, find its ID below and set{' '}
            <code>src</code> on that entry in <code>src/data/catalog.ts</code> (see <code>ASSETS.md</code>).
          </p>
          <ul className={styles.stats}>
            <li>
              <b>{entries.length}</b>slots
            </li>
            <li>
              <b>3</b>veiled models
            </li>
            <li>
              <b>8</b>bag shapes
            </li>
            <li>
              <b>{swapped}</b>swapped for photography
            </li>
          </ul>
        </header>

        <section className={styles.section} aria-labelledby="art-models">
          <div className={styles.sectionHead}>
            <h2 id="art-models" className={styles.h2}>
              Models
            </h2>
            <p className={styles.note}>Faces are never drawn. The models differ only by skin tone at the hands and neck and the hair beneath the veil.</p>
          </div>
          <div className={styles.models}>
            {MODELS.map((m) => (
              <figure key={m.id} className={styles.card}>
                <Frame spec={m.spec} ratio={m.id === 'TRIO' ? 4 / 5 : 1 / 2} id={m.id} />
                <figcaption className={styles.label}>
                  {m.name}
                  <span>{m.note}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="art-products">
          <div className={styles.sectionHead}>
            <h2 id="art-products" className={styles.h2}>
              Products
            </h2>
            <p className={styles.note}>Still life on a low plinth under one spotlight. Eight shapes, any fabric, key light left, right or top.</p>
          </div>
          <div className={styles.grid}>
            {PRODUCTS.map((b) => (
              <figure key={b.shape} className={styles.card}>
                <Frame spec={{ kind: 'product', shape: b.shape, fabric: b.fabric, light: b.light }} ratio={4 / 5} id={`BAG-${b.shape}`} />
                <figcaption className={styles.label}>
                  {b.name}
                  <span>
                    {b.fabric} · light {b.light}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="art-slots">
          <div className={styles.sectionHead}>
            <h2 id="art-slots" className={styles.h2}>
              Slots
            </h2>
            <p className={styles.note}>Each slot at the ratio it is used at on the page. The ID is what the client's photograph replaces.</p>
          </div>

          <div className={styles.group}>
            <h3 className={styles.h3}>Hero still stage · cut-outs over the stage</h3>
            <div className={styles.panel}>
              {hero.map((s) => (
                <SlotCard key={s.entry.id} slot={s} />
              ))}
            </div>
          </div>

          {GROUPS.map((g) => {
            const list = slots.filter((s) => s.entry.id.startsWith(g.prefix))
            if (!list.length) return null
            const wide = list.every((s) => s.ratio > 1)
            return (
              <div key={g.prefix} className={styles.group}>
                <h3 className={styles.h3}>{g.title}</h3>
                <div className={wide ? `${styles.grid} ${styles.gridWide}` : styles.grid}>
                  {list.map((s) => (
                    <SlotCard key={s.entry.id} slot={s} />
                  ))}
                </div>
              </div>
            )
          })}
        </section>
      </div>
    </main>
  )
}
