import { useId, useRef, useState } from 'react'
import { loadPhoto, type LoadedPhoto } from '../../art/photo'

interface PhotoDropProps {
  label: string
  hint: string
  photo: LoadedPhoto | null
  onPhoto(photo: LoadedPhoto | null): void
  optional?: boolean
}

export function PhotoDrop({ label, hint, photo, onPhoto, optional = false }: PhotoDropProps) {
  const inputId = useId()
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const take = async (file: File | undefined) => {
    if (!file) return
    const result = await loadPhoto(file)
    if ('error' in result) {
      setError(result.error)
      return
    }
    setError(null)
    onPhoto(result)
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="eyebrow">{label}</h2>
        {optional && <span className="text-xs text-paper/35">Optional</span>}
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault()
          setOver(false)
          void take(event.dataTransfer.files[0])
        }}
        className={[
          'mt-4 rounded-sm border border-dashed transition-colors',
          over ? 'border-ember bg-ember/5' : 'border-ink-line',
        ].join(' ')}
      >
        <input
          ref={input}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(event) => {
            void take(event.target.files?.[0])
            event.target.value = ''
          }}
        />

        {photo ? (
          <div className="flex items-center gap-4 p-4">
            <img
              src={photo.preview}
              alt=""
              className="h-16 w-16 shrink-0 rounded-sm object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-paper/80">{photo.name}</p>
              <p className="mt-0.5 text-xs text-paper/40">
                {photo.image.naturalWidth} × {photo.image.naturalHeight}
              </p>
            </div>
            <div className="flex shrink-0 gap-3 text-xs">
              <button
                type="button"
                onClick={() => input.current?.click()}
                className="text-paper/55 underline-offset-4 transition-colors hover:text-paper hover:underline"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  onPhoto(null)
                }}
                className="text-paper/40 underline-offset-4 transition-colors hover:text-paper/70 hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <label
            htmlFor={inputId}
            className="flex cursor-pointer flex-col items-start gap-1 p-5 focus-within:outline-none"
          >
            <span className="text-sm text-paper/80">Drop a picture here, or choose a file</span>
            <span className="text-xs text-paper/40">{hint}</span>
          </label>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-ember">{error}</p>}
      {photo?.soft && !error && (
        <p className="mt-2 text-xs text-paper/45">
          This one is small. It will cut fine at Size S, but expect it to look soft at King Size.
        </p>
      )}
    </div>
  )
}
