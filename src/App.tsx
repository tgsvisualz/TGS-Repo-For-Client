import { AssetOverlay, Grain, SkipLink } from './components'
import { CustomCursor } from './cursor/CustomCursor'
import { SiteHeader } from './nav/SiteHeader'
import { CategoryIndex } from './sections/CategoryIndex'
import { DropTeaser } from './sections/DropTeaser'
import { Manifesto } from './sections/Manifesto'
import { Rotation } from './sections/Rotation'
import { SiteFooter } from './sections/SiteFooter'
import { Hero } from './sections/hero/Hero'

export function App() {
  return (
    <>
      <SkipLink />
      <CustomCursor />
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        <Hero />
        <Manifesto />
        <DropTeaser />
        <Rotation />
        <CategoryIndex />
      </main>
      <SiteFooter />
      <Grain />
      <AssetOverlay />
    </>
  )
}
