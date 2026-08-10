import { useMemo, useState } from 'react'
import { CUSTOM_ID_PREFIX, CUSTOM_PUZZLE, type SizeKey } from '../data/catalog'
import { blankSheetCanvas, photoBackCanvas, photoCanvas, type LoadedPhoto } from '../art/photo'
import { PuzzleView } from '../three/product/PuzzleView'
import { previewGrid } from '../three/product/assemble'
import { PhotoDrop } from '../components/custom/PhotoDrop'
import { formatPrice, useCart } from '../store/cart'

/** Texture width for the puzzle face; the height follows the cut. */
const FACE_WIDTH = 1400

const GOOD = [
  'A photograph at the size it came off the camera or phone',
  'A subject that fills the frame — faces, a building, a dense landscape',
  'Colour and texture spread across the picture, not pooled in one corner',
  'Even light, so the shadows still hold detail',
]

const BAD = [
  'Screenshots, or anything saved from a social feed',
  'Wide empty stretches of sky, snow, water or wall',
  'A picture already cropped down to a sliver',
  'Long panoramas — the cut is close to square and will lose the ends',
]

const STEPS = [
  ['Bring a picture', 'Drop it in. It stays in this browser — nothing is uploaded.'],
  ['Pick a size', 'The bigger the tier, the finer the cut and the longer the build.'],
  ['We cut it', 'Printed onto 3 mm birch ply and cut on the same machines as the catalogue.'],
  ['It ships in seven days', 'Every custom puzzle is made to order, so it leaves later than a stock design.'],
]

export function CustomPuzzle() {
  const [front, setFront] = useState<LoadedPhoto | null>(null)
  const [back, setBack] = useState<LoadedPhoto | null>(null)
  const [sizeKey, setSizeKey] = useState<SizeKey>('l')
  const [flipped, setFlipped] = useState(false)
  const [owned, setOwned] = useState(false)

  const currency = useCart((s) => s.currency)
  const add = useCart((s) => s.add)

  const size = CUSTOM_PUZZLE.sizes.find((s) => s.key === sizeKey) ?? CUSTOM_PUZZLE.sizes[2]
  const { rows, cols } = previewGrid(size.pieces)
  const faceHeight = Math.round((FACE_WIDTH * rows) / cols)

  // The picture is painted at the proportion of the finished panel, so what the
  // preview crops is what the cut crops.
  const faces = useMemo(() => {
    if (!front) return null
    return {
      front: photoCanvas(front.image, FACE_WIDTH, faceHeight),
      back: back
        ? photoCanvas(back.image, FACE_WIDTH, faceHeight)
        : photoBackCanvas(front.image, FACE_WIDTH, faceHeight),
    }
  }, [front, back, faceHeight])

  const sheet = useMemo(
    () => blankSheetCanvas(900, Math.round((900 * rows) / cols), rows, cols).toDataURL(),
    [rows, cols],
  )

  const addToCart = () => {
    if (!front || !owned) return
    add(`${CUSTOM_ID_PREFIX}${Date.now().toString(36)}`, size.key, 1, front.preview)
  }

  return (
    <>
      <div className="container-page pt-28 pb-20 md:pt-36">
        <header className="max-w-3xl">
          <p className="eyebrow">Custom</p>
          <h1 className="mt-5 text-5xl leading-[0.95] md:text-7xl">
            Bring the picture.
            <br />
            We bring the wood.
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-paper/55">
            The same birch, the same cut, the same box as everything in the shop — with your
            photograph on it instead of ours. Drop one in below and you will see it in pieces before
            you decide anything.
          </p>
        </header>

        <div className="rule-line my-12" />

        <div className="grid gap-12 md:grid-cols-12 md:gap-10">
          {/* min-w-0 so the 3D canvas cannot hold the column open. */}
          <div className="min-w-0 md:col-span-7">
            <div className="relative aspect-square overflow-hidden rounded-sm bg-gradient-to-b from-ink-soft to-ink">
              {faces ? (
                <>
                  <PuzzleView
                    front={faces.front}
                    back={faces.back}
                    pieces={size.pieces}
                    flipped={flipped}
                  />

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between p-5">
                    <span className="text-xs text-paper/35">Drag to turn</span>
                    <button
                      type="button"
                      onClick={() => setFlipped((v) => !v)}
                      className="pointer-events-auto rounded-full border border-ink-line bg-ink/70 px-4 py-2 text-xs text-paper backdrop-blur transition-colors hover:border-ember"
                    >
                      {flipped ? 'Show the front' : 'Show the back'}
                    </button>
                  </div>
                </>
              ) : (
                // The empty state is the material: a bare sheet with this tier's
                // cut marked on it, which changes as the size does.
                <div className="flex h-full w-full flex-col items-center justify-center gap-6 p-8">
                  <img
                    src={sheet}
                    alt=""
                    className="w-full max-w-md rounded-sm opacity-90 shadow-2xl shadow-black/40"
                  />
                  <p className="text-center text-sm text-paper/45">
                    {size.pieces} pieces, cut {rows} by {cols} in the preview.
                    <br />
                    Nothing printed on it yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-4 md:col-start-9">
            <PhotoDrop
              label="Your picture"
              hint="JPEG, PNG, WebP or GIF, up to 25 MB"
              photo={front}
              onPhoto={setFront}
            />

            <div className="mt-8">
              <PhotoDrop
                label="The other side"
                hint="Leave it empty and we tone your picture into the wood instead"
                photo={back}
                onPhoto={setBack}
                optional
              />
            </div>

            <div className="mt-10">
              <div className="flex items-baseline justify-between">
                <h2 className="eyebrow">Size</h2>
                <span className="text-xs text-paper/40">
                  {size.cm[0]}×{size.cm[1]} cm · {size.hours[0]}–{size.hours[1]} h
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {CUSTOM_PUZZLE.sizes.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSizeKey(option.key)}
                    aria-pressed={option.key === sizeKey}
                    className={[
                      'rounded-sm border px-4 py-3 text-left transition-colors',
                      option.key === sizeKey
                        ? 'border-ember bg-ember/10'
                        : 'border-ink-line hover:border-paper/30',
                    ].join(' ')}
                  >
                    <span className="block text-sm">{option.label}</span>
                    <span className="mt-0.5 block text-xs text-paper/45">
                      {option.pieces} pieces
                    </span>
                    <span className="mt-1.5 block text-sm text-ember">
                      {formatPrice(option.priceUsd, currency)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <label className="mt-8 flex cursor-pointer items-start gap-3 text-sm leading-snug text-paper/55">
              <input
                type="checkbox"
                checked={owned}
                onChange={(event) => setOwned(event.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[#D8602C]"
              />
              The picture is mine to print, or I have permission from whoever took it.
            </label>

            <button
              type="button"
              onClick={addToCart}
              disabled={!front || !owned}
              className="mt-6 w-full rounded-full bg-ember py-4 text-sm font-medium text-ink transition-transform duration-300 hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-30"
            >
              Add to cart — {formatPrice(size.priceUsd, currency)}
            </button>
            {!front && (
              <p className="mt-3 text-center text-xs text-paper/35">
                Add a picture first — there is nothing to cut yet.
              </p>
            )}

            <dl className="mt-8 divide-y divide-ink-line border-t border-ink-line text-sm">
              {[
                ['Material', '3 mm birch ply, laser-cut'],
                ['Both sides finished', 'Yes — your second picture, or yours toned into the ply'],
                ['Made to order', 'Cut and shipped within 7 days'],
                ['Returns', 'Custom cuts are final sale'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-6 py-3.5">
                  <dt className="shrink-0 text-paper/45">{label}</dt>
                  <dd className="text-right text-paper/80">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <section className="border-t border-ink-line py-20 md:py-28">
        <div className="container-page grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="eyebrow">Before you upload</p>
            <h2 className="mt-5 text-4xl md:text-5xl">
              What the
              <br />
              cut likes
            </h2>
            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-paper/55">
              A puzzle is only as good as the places your eye can grab onto. Detail is what makes a
              piece findable — an empty sky is where a build stops being fun.
            </p>
          </div>

          <div className="md:col-span-4 md:col-start-6">
            <h3 className="text-sm text-paper/80">Cuts well</h3>
            <ul className="mt-4 space-y-3 border-t border-ink-line pt-4">
              {GOOD.map((item) => (
                <li key={item} className="text-sm leading-snug text-paper/55">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h3 className="text-sm text-paper/80">Fights the cut</h3>
            <ul className="mt-4 space-y-3 border-t border-ink-line pt-4">
              {BAD.map((item) => (
                <li key={item} className="text-sm leading-snug text-paper/40">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-ink-line py-20 md:py-28">
        <div className="container-page">
          <h2 className="text-4xl md:text-5xl">From your camera roll to a box</h2>
          <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([title, body], index) => (
              <li key={title}>
                <span className="font-display text-sm text-ember">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 font-display text-2xl leading-tight">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-paper/50">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  )
}
