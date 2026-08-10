import { useState } from 'react'
import { PRODUCTS } from '../../data/catalog'
import { formatPrice, useCart } from '../../store/cart'
import { useReveal } from '../../lib/useReveal'

const TIERS = PRODUCTS[0].sizes

const NOTES: Record<string, string> = {
  s: 'An evening. Fits on a lap tray.',
  m: 'A long evening, or two short ones.',
  l: 'A weekend. Needs a table you can leave set up.',
  king: 'A project. People frame this one.',
}

export function Sizes() {
  const [active, setActive] = useState(TIERS.length - 2)
  const currency = useCart((s) => s.currency)
  const ref = useReveal<HTMLDivElement>()

  const tier = TIERS[active]
  const maxW = TIERS[TIERS.length - 1].cm[0]
  const maxH = TIERS[TIERS.length - 1].cm[1]

  const mugCm = 8.5

  return (
    <section id="sizes" className="border-t border-ink-line py-24 md:py-32">
      <div className="container-page">
        <div ref={ref} className="reveal grid gap-14 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-4">
            <p className="eyebrow">Pick a size</p>
            <h2 className="mt-5 text-4xl md:text-5xl">
              Same picture.
              <br />
              Four commitments.
            </h2>
            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-paper/55">
              Sizes are not crops — each tier is recut so the artwork fills it. The mug is drawn to
              scale.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {TIERS.map((size, index) => (
                <button
                  key={size.key}
                  type="button"
                  onClick={() => setActive(index)}
                  aria-pressed={index === active}
                  className={[
                    'rounded-full border px-4 py-2 text-sm transition-colors',
                    index === active
                      ? 'border-ember bg-ember text-ink'
                      : 'border-ink-line text-paper/60 hover:border-paper/40 hover:text-paper',
                  ].join(' ')}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-7 md:col-start-6">
            <div className="relative rounded-sm border border-ink-line bg-ink-soft p-6 md:p-10">
              <svg
                viewBox={`0 0 ${maxW + 14} ${maxH + 6}`}
                className="w-full"
                role="img"
                aria-label={`${tier.label}: ${tier.cm[0]} by ${tier.cm[1]} centimetres`}
              >
                <rect
                  x={0}
                  y={maxH - maxH}
                  width={maxW}
                  height={maxH}
                  fill="none"
                  stroke="#33291f"
                  strokeDasharray="1.5 1.5"
                  strokeWidth={0.35}
                />

                <rect
                  x={0}
                  y={maxH - tier.cm[1]}
                  width={tier.cm[0]}
                  height={tier.cm[1]}
                  rx={0.8}
                  fill="#c39a63"
                  style={{ transition: 'all 700ms cubic-bezier(0.16,1,0.3,1)' }}
                />

                <g style={{ transition: 'all 700ms cubic-bezier(0.16,1,0.3,1)' }}>
                  <rect
                    x={maxW + 3}
                    y={maxH - mugCm}
                    width={mugCm * 0.8}
                    height={mugCm}
                    rx={0.6}
                    fill="#5a6b4c"
                  />
                  <path
                    d={`M ${maxW + 3 + mugCm * 0.8} ${maxH - mugCm * 0.75}
                        a 2 2 0 0 1 0 ${mugCm * 0.45}`}
                    fill="none"
                    stroke="#5a6b4c"
                    strokeWidth={0.8}
                  />
                </g>
              </svg>

              <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-ink-line pt-6 sm:grid-cols-4">
                <div>
                  <dt className="eyebrow">Pieces</dt>
                  <dd className="mt-2 font-display text-2xl">{tier.pieces}</dd>
                </div>
                <div>
                  <dt className="eyebrow">Finished</dt>
                  <dd className="mt-2 font-display text-2xl">
                    {tier.cm[0]}×{tier.cm[1]}
                    <span className="ml-1 text-sm text-paper/40">cm</span>
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow">Build time</dt>
                  <dd className="mt-2 font-display text-2xl">
                    {tier.hours[0]}–{tier.hours[1]}
                    <span className="ml-1 text-sm text-paper/40">h</span>
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow">From</dt>
                  <dd className="mt-2 font-display text-2xl text-ember">
                    {formatPrice(tier.priceUsd, currency)}
                  </dd>
                </div>
              </dl>

              <p className="mt-5 text-sm text-paper/50">{NOTES[tier.key]}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
