/**
 * Static catalogue for the design demo. No network, no CMS.
 *
 * Artwork is described, not stored: every product carries a recipe that the
 * canvas renderer in `src/art` turns into the picture on the puzzle face. That
 * keeps the repo free of image assets and lets a product look identical on a
 * card, on the product page and inside the 3D scene.
 */

export type SizeKey = 's' | 'm' | 'l' | 'king'

export interface PuzzleSize {
  key: SizeKey
  label: string
  pieces: number
  /** Finished dimensions in centimetres, width × height. */
  cm: [number, number]
  /** Typical assembly time, in hours. */
  hours: [number, number]
  priceUsd: number
}

export type Artwork =
  | { kind: 'mandala'; seed: number; symmetry: number; rings: number; palette: string[] }
  | { kind: 'marquetry'; figure: MarquetryFigure; palette: string[] }
  | { kind: 'strata'; seed: number; bands: number; palette: string[] }

export type MarquetryFigure = 'owl' | 'deer' | 'whale' | 'butterfly' | 'fox' | 'dragon' | 'ram'

export interface Product {
  id: string
  slug: string
  name: string
  collection: CollectionId
  /** One line for cards. */
  tagline: string
  /** Two or three sentences for the product page. */
  story: string
  artwork: Artwork
  sizes: PuzzleSize[]
  /** Marks the six items on the home page rail. */
  bestseller?: boolean
  isNew?: boolean
}

export type CollectionId = 'animals' | 'mandalas' | 'nature' | 'classic' | 'geometry' | 'gifts'

export interface Collection {
  id: CollectionId
  name: string
  /** Shown under the collection name. */
  note: string
  accent: string
}

export const COLLECTIONS: Collection[] = [
  { id: 'animals', name: 'Animals', note: 'Creatures cut from a single sheet', accent: '#C39A63' },
  { id: 'mandalas', name: 'Mandalas', note: 'Symmetry that resolves under your hands', accent: '#D8602C' },
  { id: 'nature', name: 'Nature', note: 'Landscapes in layered grain', accent: '#5A6B4C' },
  { id: 'classic', name: 'Classic', note: 'The shapes that started it', accent: '#7A4E28' },
  { id: 'geometry', name: 'Geometry', note: 'Order, then the pleasure of breaking it', accent: '#E0C398' },
  { id: 'gifts', name: 'Gifts', note: 'Arrives ready to hand over', accent: '#EA7A49' },
]

/** Size tiers are shared across the catalogue; only the price scales per product. */
function sizes(base: number): PuzzleSize[] {
  const round = (n: number) => Math.round(n) - 0.01
  return [
    { key: 's', label: 'Size S', pieces: 100, cm: [20, 15], hours: [1, 2], priceUsd: round(base) },
    { key: 'm', label: 'Size M', pieces: 200, cm: [30, 22], hours: [2, 3], priceUsd: round(base * 1.55) },
    { key: 'l', label: 'Size L', pieces: 350, cm: [43, 31], hours: [4, 5], priceUsd: round(base * 2.35) },
    { key: 'king', label: 'King Size', pieces: 700, cm: [60, 43], hours: [6, 8], priceUsd: round(base * 3.4) },
  ]
}

/** Palettes are always [main, secondary, shadow, ground]. */
const EMBER = ['#D8602C', '#E0C398', '#7A4E28', '#241812']
const MOSS = ['#5A6B4C', '#C39A63', '#2F3A28', '#1C231A']
const NIGHT = ['#3A4A6B', '#C39A63', '#1B2438', '#121826']
const CLAY = ['#B4552F', '#E0C398', '#5E3320', '#241812']
const SAGE = ['#7E9484', '#E7DCCD', '#3D5347', '#1B231F']

export const PRODUCTS: Product[] = [
  {
    id: 'p-owl',
    slug: 'night-watch-owl',
    name: 'Night Watch',
    collection: 'animals',
    tagline: 'An owl assembled from forty kinds of feather',
    story:
      'Every feather is its own piece, and no two are cut the same. The eyes are the last two pieces you place, which is why people tend to save them.',
    artwork: { kind: 'marquetry', figure: 'owl', palette: NIGHT },
    sizes: sizes(28),
    bestseller: true,
  },
  {
    id: 'p-dragon',
    slug: 'coiled-dragon',
    name: 'Coiled Dragon',
    collection: 'animals',
    tagline: 'The piece the workshop is named after',
    story:
      'A spiral that reads as a single line until you look closer and find it is two hundred separate scales. The reverse side carries the same dragon in negative.',
    artwork: { kind: 'marquetry', figure: 'dragon', palette: EMBER },
    sizes: sizes(34),
    bestseller: true,
  },
  {
    id: 'p-whale',
    slug: 'deep-water-whale',
    name: 'Deep Water',
    collection: 'animals',
    tagline: 'A whale that keeps getting larger as you build it',
    story:
      'Built outward from the eye. The plywood grain runs with the body, so the finished panel catches light the way water does.',
    artwork: { kind: 'marquetry', figure: 'whale', palette: SAGE },
    sizes: sizes(30),
    bestseller: true,
  },
  {
    id: 'p-deer',
    slug: 'antler-season',
    name: 'Antler Season',
    collection: 'animals',
    tagline: 'Antlers branch into the pieces that cut them',
    story:
      'The antlers are the reason this one takes longer than its piece count suggests. They are also the reason people frame it.',
    artwork: { kind: 'marquetry', figure: 'deer', palette: CLAY },
    sizes: sizes(29),
  },
  {
    id: 'p-fox',
    slug: 'first-frost-fox',
    name: 'First Frost',
    collection: 'animals',
    tagline: 'Warm wood against a cold field',
    story:
      'The lightest plywood we cut sits against our darkest stain. It is the highest-contrast puzzle in the catalogue and the easiest to finish in one evening.',
    artwork: { kind: 'marquetry', figure: 'fox', palette: CLAY },
    sizes: sizes(26),
    isNew: true,
  },
  {
    id: 'p-butterfly',
    slug: 'paper-wing',
    name: 'Paper Wing',
    collection: 'animals',
    tagline: 'Mirror-cut, so each half tests the other',
    story:
      'The two wings are cut as mirrors of one another. Halfway through you stop reading the picture and start reading the symmetry.',
    artwork: { kind: 'marquetry', figure: 'butterfly', palette: EMBER },
    sizes: sizes(25),
  },
  {
    id: 'p-ram',
    slug: 'high-pasture-ram',
    name: 'High Pasture',
    collection: 'animals',
    tagline: 'Horns that spiral into their own puzzle',
    story:
      'Two spirals, cut against the grain so they hold the light differently from the rest of the panel.',
    artwork: { kind: 'marquetry', figure: 'ram', palette: MOSS },
    sizes: sizes(27),
  },

  {
    id: 'm-tree',
    slug: 'mandala-rooted',
    name: 'Rooted',
    collection: 'mandalas',
    tagline: 'A tree of life folded into twelve-fold symmetry',
    story:
      'Twelve identical sectors, none of which contains an identical piece. Solving it is a lesson in why symmetry and repetition are not the same thing.',
    artwork: { kind: 'mandala', seed: 12, symmetry: 12, rings: 6, palette: MOSS },
    sizes: sizes(35),
    bestseller: true,
  },
  {
    id: 'm-sun',
    slug: 'mandala-slow-sun',
    name: 'Slow Sun',
    collection: 'mandalas',
    tagline: 'Sixteen rays, six rings, one centre piece',
    story:
      'The centre is a single circular piece. Everyone finds it first and nobody places it first.',
    artwork: { kind: 'mandala', seed: 7, symmetry: 16, rings: 5, palette: EMBER },
    sizes: sizes(35),
    bestseller: true,
  },
  {
    id: 'm-tide',
    slug: 'mandala-tide-lock',
    name: 'Tide Lock',
    collection: 'mandalas',
    tagline: 'Two rotations that never quite meet',
    story:
      'Built on an eight-fold frame with a nine-fold overlay. The mismatch is deliberate and it is what makes the pattern hold your eye.',
    artwork: { kind: 'mandala', seed: 23, symmetry: 8, rings: 7, palette: NIGHT },
    sizes: sizes(33),
  },
  {
    id: 'm-bloom',
    slug: 'mandala-late-bloom',
    name: 'Late Bloom',
    collection: 'mandalas',
    tagline: 'Botanical geometry, cut in three plywood tones',
    story:
      'Three plywood tones in one panel. The pieces sort themselves by colour long before they sort themselves by shape.',
    artwork: { kind: 'mandala', seed: 41, symmetry: 10, rings: 6, palette: SAGE },
    sizes: sizes(36),
    isNew: true,
  },

  {
    id: 'n-ridge',
    slug: 'nine-ridges',
    name: 'Nine Ridges',
    collection: 'nature',
    tagline: 'A mountain range in nine layers of grain',
    story:
      'Each ridge is a separate depth of stain, so the finished panel has real distance in it. Best puzzle in the catalogue for hanging above a desk.',
    artwork: { kind: 'strata', seed: 3, bands: 9, palette: MOSS },
    sizes: sizes(31),
  },
  {
    id: 'n-dunes',
    slug: 'long-dunes',
    name: 'Long Dunes',
    collection: 'nature',
    tagline: 'Sand, drawn as contour lines',
    story:
      'No hard edges anywhere in the image, which means every piece has to be found by shape alone. It is the quiet difficult one.',
    artwork: { kind: 'strata', seed: 11, bands: 12, palette: CLAY },
    sizes: sizes(30),
  },
  {
    id: 'n-fjord',
    slug: 'cold-fjord',
    name: 'Cold Fjord',
    collection: 'nature',
    tagline: 'Water and rock cut from the same sheet',
    story:
      'The waterline runs straight across the panel, so you can build the top and bottom halves independently and meet in the middle.',
    artwork: { kind: 'strata', seed: 19, bands: 10, palette: NIGHT },
    sizes: sizes(32),
    isNew: true,
  },
  {
    id: 'n-canopy',
    slug: 'under-canopy',
    name: 'Under Canopy',
    collection: 'nature',
    tagline: 'Light through leaves, in seven greens',
    story:
      'Seven greens that read as one colour from across the room and as seven from arm’s length.',
    artwork: { kind: 'strata', seed: 27, bands: 7, palette: SAGE },
    sizes: sizes(29),
  },

  {
    id: 'g-lattice',
    slug: 'broken-lattice',
    name: 'Broken Lattice',
    collection: 'geometry',
    tagline: 'A perfect grid, then one deliberate fault',
    story:
      'A regular lattice with a single fracture running through it. Your eye finds the fault immediately; your hands take considerably longer.',
    artwork: { kind: 'mandala', seed: 55, symmetry: 4, rings: 8, palette: EMBER },
    sizes: sizes(27),
  },
  {
    id: 'g-orbit',
    slug: 'orbit-study',
    name: 'Orbit Study',
    collection: 'geometry',
    tagline: 'Concentric rings that refuse to be concentric',
    story:
      'Every ring is offset from the last by a fixed angle. The result looks like motion and behaves like a puzzle that will not let you work outside-in.',
    artwork: { kind: 'mandala', seed: 63, symmetry: 6, rings: 9, palette: NIGHT },
    sizes: sizes(28),
  },

  {
    id: 'c-compass',
    slug: 'compass-rose',
    name: 'Compass Rose',
    collection: 'classic',
    tagline: 'The first pattern the workshop ever cut',
    story:
      'Still cut on the original file, still the one we send to people who have never built a wooden puzzle before.',
    artwork: { kind: 'mandala', seed: 2, symmetry: 8, rings: 4, palette: CLAY },
    sizes: sizes(24),
  },
  {
    id: 'c-tidechart',
    slug: 'harbour-chart',
    name: 'Harbour Chart',
    collection: 'classic',
    tagline: 'Depth soundings, cut as contour',
    story:
      'Reads as an old sea chart. The deepest water is the darkest plywood, which makes the bottom third of the panel the hardest part.',
    artwork: { kind: 'strata', seed: 33, bands: 11, palette: NIGHT },
    sizes: sizes(26),
  },

  {
    id: 'gift-evergreen',
    slug: 'evergreen',
    name: 'Evergreen',
    collection: 'gifts',
    tagline: 'The one we send when nobody knows what to send',
    story:
      'Twelve-fold and green, with no occasion attached to it. It is the design that goes out most often with a note rather than a name on it.',
    artwork: { kind: 'mandala', seed: 88, symmetry: 12, rings: 5, palette: MOSS },
    sizes: sizes(32),
    bestseller: true,
  },
  {
    id: 'gift-hearth',
    slug: 'hearth',
    name: 'Hearth',
    collection: 'gifts',
    tagline: 'Warm enough to hand over in December',
    story:
      'Low light over a long horizon, cut in the reddest ply we stock. Arrives in the gift box with the sleeve already on it.',
    artwork: { kind: 'strata', seed: 61, bands: 8, palette: CLAY },
    sizes: sizes(30),
  },
  {
    id: 'gift-two-wings',
    slug: 'two-wings',
    name: 'Two Wings',
    collection: 'gifts',
    tagline: 'A second edition of Paper Wing, cut in sage',
    story:
      'The same mirror-cut wings in a quieter palette. People who already own one tend to buy this as the pair to it.',
    artwork: { kind: 'marquetry', figure: 'butterfly', palette: SAGE },
    sizes: sizes(27),
    isNew: true,
  },
  {
    id: 'gift-first-light',
    slug: 'first-light',
    name: 'First Light',
    collection: 'gifts',
    tagline: 'For new homes and new starts',
    story:
      'A sunrise pattern on a ten-fold frame. The centre is a single amber piece, which is the one people hand to whoever they are giving it to.',
    artwork: { kind: 'mandala', seed: 104, symmetry: 10, rings: 6, palette: EMBER },
    sizes: sizes(33),
  },
]

export const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', rate: 1, locale: 'en-US', freeShippingFrom: 49 },
  EUR: { code: 'EUR', symbol: '€', rate: 0.92, locale: 'de-DE', freeShippingFrom: 45 },
} as const

export type CurrencyCode = keyof typeof CURRENCIES

export function productBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug)
}

export function productsIn(collection: CollectionId): Product[] {
  return PRODUCTS.filter((p) => p.collection === collection)
}

export function priceFrom(product: Product): number {
  return Math.min(...product.sizes.map((s) => s.priceUsd))
}
