/*
 * Cuts each product photograph down to the handful of widths the site actually
 * draws it at, and records which widths exist so the markup can offer them.
 *
 * The masters are 1100–1400px wide and were being sent whole to a card that
 * draws them 252px across — four to five times the pixels in each direction,
 * twenty times the area. A `sizes` attribute was already on the img, but
 * `sizes` without `srcset` tells the browser nothing, so it always took the
 * full file.
 *
 * Sources come from art-source/ when the original PNG is there, and from the
 * shipped webp when it is not, so this runs with or without the originals.
 * Widths above a photograph's own are skipped rather than upscaled — hence the
 * manifest, since which widths exist differs per picture.
 *
 *   npm run photos
 */
import { readdir, writeFile, stat, readFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const productsDir = join(root, 'public', 'products')
const artSourceDir = join(root, 'art-source')

/*
 * Measured off the real slots rather than picked as round numbers, because a
 * ladder with gaps in it makes the browser round up and pay for the gap:
 *
 *   160px variant thumbnail  → 400 at either density
 *   252px catalogue card     → 400 plain, 640 retina
 *   432px collection card    → 640 plain, 900 retina
 *   730px product frame      → 900 plain, master retina
 */
const WIDTHS = [400, 640, 900, 1400]

/* A generated variant, so a rerun does not treat its own output as a master. */
const IS_VARIANT = /-(\d{3,4})\.webp$/

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else yield full
  }
}

/*
 * Only what the catalogue names. There are loose crops sitting in public/ that
 * nothing renders any more, and cutting variants of those would be making four
 * files out of one nobody asks for.
 */
const catalogue = await readFile(join(root, 'src', 'data', 'catalog.ts'), 'utf8')
const referenced = new Set(catalogue.match(/\/products\/[a-z0-9/-]+\.webp/g) ?? [])

const manifest = {}
const seen = new Set()
let written = 0
let savedBytes = 0

for await (const file of walk(productsDir)) {
  if (!file.endsWith('.webp') || IS_VARIANT.test(file)) continue

  const rel = relative(productsDir, file).replace(/\\/g, '/')
  if (!referenced.has('/products/' + rel)) continue
  seen.add('/products/' + rel)
  const png = join(artSourceDir, rel.replace(/\.webp$/, '.png'))
  const source = existsSync(png) ? png : file

  /*
   * Two widths, and they are not always the same number. The cuts can only go
   * as wide as the source allows, but the descriptor on the master has to be
   * the master's own width — an art-source PNG is sometimes a different crop
   * from the webp that was made from it, and a srcset that misreports a width
   * makes the browser choose against itself.
   */
  const sourceWidth = (await sharp(source).metadata()).width
  const masterWidth = (await sharp(file).metadata()).width
  const master = (await stat(file)).size

  const made = []
  for (const target of WIDTHS) {
    if (target >= sourceWidth || target >= masterWidth) continue
    const out = file.replace(/\.webp$/, `-${target}.webp`)
    await sharp(source)
      .resize({ width: target, withoutEnlargement: true })
      .webp({ quality: 78, effort: 5 })
      .toFile(out)
    made.push(target)
    written++
  }

  if (made.length > 0) {
    /*
     * The master goes in at its own width alongside the cuts. Without it the
     * widest entry offered might be 800 while the product page draws the
     * picture at 1460 device pixels, and the browser would take the 800 and
     * be right to — srcset is a complete account of what exists, not a list
     * of extras.
     */
    manifest['/products/' + rel] = { master: masterWidth, widths: made }
    const smallest = (await stat(file.replace(/\.webp$/, `-${made[0]}.webp`))).size
    savedBytes += master - smallest
  }
}

await writeFile(join(root, 'src', 'data', 'photos.json'), JSON.stringify(manifest, null, 2) + '\n')

console.log(`${written} variants for ${Object.keys(manifest).length} photographs`)
console.log(
  `a card now costs ${(savedBytes / Object.keys(manifest).length / 1024).toFixed(0)} kB less, on average`,
)

/*
 * A path the catalogue names but public/ does not hold ships as a broken
 * image, and it is invisible in development because the dev server and the
 * build both simply pass the URL through. It has happened once already.
 */
const missing = [...referenced].filter((path) => !seen.has(path))
if (missing.length > 0) {
  console.error('\nthe catalogue names photographs that are not here:')
  missing.forEach((path) => console.error('  ' + path))
  process.exitCode = 1
}

/*
 * Cuts left over from an earlier run — a width dropped from the ladder, or a
 * photograph the catalogue no longer names. Only ever this script's own
 * output: masters and hand-made files are never in this list, whatever state
 * they are in. Pass --prune to clear them.
 */
const prune = process.argv.includes('--prune')
const stale = []
for await (const file of walk(productsDir)) {
  if (!IS_VARIANT.test(file)) continue
  const rel = '/products/' + relative(productsDir, file).replace(/\\/g, '/')
  const master = rel.replace(IS_VARIANT, '.webp')
  const width = Number(rel.match(IS_VARIANT)[1])
  if (!manifest[master]?.widths.includes(width)) stale.push(file)
}

if (stale.length > 0 && prune) {
  await Promise.all(stale.map((file) => rm(file)))
  console.log(`\npruned ${stale.length} variants nothing renders`)
} else if (stale.length > 0) {
  console.log(
    `\n${stale.length} variants nothing renders — 'npm run photos -- --prune' clears them`,
  )
}
