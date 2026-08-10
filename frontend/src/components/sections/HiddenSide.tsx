import { useRef } from 'react'
import { productBySlug } from '../../data/catalog'
import { FlipPiece } from '../../three/piece/FlipPiece'
import { useScrollProgress } from '../../lib/useReveal'

export function HiddenSide() {
  const progress = useRef(0)
  const sectionRef = useScrollProgress<HTMLDivElement>((value) => {
    // The turn happens across the middle of the section, not its full travel.
    progress.current = Math.max(0, Math.min(1, (value - 0.32) / 0.36))
  })

  const front = productBySlug('coiled-dragon')?.artwork
  const back = productBySlug('mandala-slow-sun')?.artwork
  if (!front || !back) return null

  return (
    <section id="hidden" className="border-t border-ink-line py-24 md:py-32">
      <div ref={sectionRef} className="container-page">
        <div className="grid items-center gap-12 md:grid-cols-12">
          <div className="order-2 md:order-1 md:col-span-5">
            <p className="eyebrow">The part nobody photographs</p>
            <h2 className="mt-5 text-4xl md:text-5xl">
              Turn a piece over
              <br />
              and the picture
              <br />
              changes.
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-paper/55">
              Both faces are printed and finished. Most people discover it halfway through their
              first build, flip the whole thing over, and start again.
            </p>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-paper/55">
              It also means one puzzle is two pictures — and the one you hang is your call.
            </p>
          </div>

          <div className="order-1 md:order-2 md:col-span-6 md:col-start-7">
            <div className="aspect-square w-full rounded-sm bg-gradient-to-b from-ink-soft to-ink">
              <FlipPiece front={front} back={back} progress={progress} />
            </div>
            <p className="mt-4 text-center text-xs text-paper/35">Scroll to turn the piece</p>
          </div>
        </div>
      </div>
    </section>
  )
}
