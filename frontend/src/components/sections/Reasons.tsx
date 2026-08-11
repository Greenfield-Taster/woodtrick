import { useReveal } from '../../lib/useReveal'

const REASONS = [
  {
    number: '01',
    title: 'No two pieces repeat',
    body: 'Every outline is cut from its own file. Sorting by shape stops working about ten minutes in, which is the point.',
  },
  {
    number: '02',
    title: 'Figures hidden in the picture',
    body: 'Animals, plants and small scenes are cut as whole pieces inside the design. You find them one at a time, in your hand, before you find them in the picture.',
  },
  {
    number: '03',
    title: 'Board, not cardboard',
    body: 'Laser-cut HDF, hand-finished. Pieces click rather than bend, and they will outlast the box.',
  },
]

export function Reasons() {
  const ref = useReveal<HTMLDivElement>()

  return (
    <section className="border-t border-ink-line py-24 md:py-36">
      <div className="container-page">
        <div ref={ref} className="reveal grid gap-y-14 md:grid-cols-12 md:gap-x-10">
          <div className="md:col-span-4">
            <p className="eyebrow">Why these</p>
            <h2 className="mt-5 text-4xl md:text-5xl">
              Three things a
              <br />
              cardboard puzzle
              <br />
              cannot do.
            </h2>
          </div>

          <div className="md:col-span-7 md:col-start-6">
            <ul className="divide-y divide-ink-line">
              {REASONS.map((reason) => (
                <li key={reason.number} className="flex gap-6 py-8 first:pt-0 md:gap-10">
                  <span className="font-display text-sm text-ember">{reason.number}</span>
                  <div>
                    <h3 className="text-2xl md:text-3xl">{reason.title}</h3>
                    <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-paper/55">
                      {reason.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
