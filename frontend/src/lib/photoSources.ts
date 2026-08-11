import PHOTOS from '../data/photos.json'

/*
 * Written by `npm run photos`: for each photograph, the widths that were cut
 * from it and the width of the master itself.
 */
const SOURCES: Record<string, { master: number; widths: number[] }> = PHOTOS

/*
 * Every width that exists for a picture, master included. A `sizes` attribute
 * without this is inert — the browser has nothing to choose between and takes
 * the full file, which is how a 252px card came to cost 400 kB.
 */
export function srcSetFor(src: string): string | undefined {
  const entry = SOURCES[src]
  if (!entry) return undefined

  return [
    ...entry.widths.map((w) => `${src.replace(/\.webp$/, `-${w}.webp`)} ${w}w`),
    `${src} ${entry.master}w`,
  ].join(', ')
}

/* The narrowest cut that still covers the given width of device pixels, for
 * callers that are not an `img` and so cannot let the browser decide. */
export function photoAtWidth(src: string, devicePixels: number): string {
  const entry = SOURCES[src]
  if (!entry) return src

  const fit = entry.widths.find((w) => w >= devicePixels)
  return fit ? src.replace(/\.webp$/, `-${fit}.webp`) : src
}
