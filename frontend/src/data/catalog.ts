/*
 * Catalogue data restated from unidragon.us. Sizes, piece counts and prices are
 * the shop's own figures; the wording around them is ours.
 *
 * There is no fixed size ladder any more. An animal is cut in four tiers, a
 * mandala in three, a Quezzle sells as parts of a set — so each product carries
 * the variants it is actually sold in.
 */

export type VariantKey = string

export interface Variant {
  key: VariantKey
  label: string
  priceUsd: number
  /* Struck-through list price where the shop is running a discount. */
  wasUsd?: number
  pieces?: number
  /* Finished size in inches, as the US store lists it. Per board where a pack holds several. */
  inches?: [number, number]
  /*
   * How many separate boards come in the pack. A Quezzle is sold in parts — one
   * board to start, three more to finish — so the count is what tells the packs
   * apart, and `inches` measures one of them rather than the finished wall.
   */
  boards?: number
  /* Path under public/ for a pack that is photographed on its own, as the Quezzle parts are. */
  photo?: string
  soldOut?: boolean
}

export interface Product {
  id: string
  slug: string
  name: string
  /* Absent for the custom puzzle, which is an offering rather than a catalogue entry. */
  collection?: CollectionId
  /* Path under public/, e.g. /products/animals/mysterious-lion.png */
  photo?: string
  tagline: string
  story: string
  variants: Variant[]
  bestseller?: boolean
}

export type CollectionId = 'animals' | 'mandalas' | 'quezzle' | 'new'

export interface Collection {
  id: CollectionId
  name: string
  note: string
  accent: string
}

export const COLLECTIONS: Collection[] = [
  {
    id: 'new',
    name: 'New',
    note: 'Latest off the cutting bed',
    accent: '#E0C398',
  },
  {
    id: 'animals',
    name: 'Animals',
    note: 'Creatures cut from a single sheet',
    accent: '#C39A63',
  },
  {
    id: 'mandalas',
    name: 'Mandalas',
    note: 'Symmetry that resolves under your hands',
    accent: '#D8602C',
  },
  {
    id: 'quezzle',
    name: 'Quezzle',
    note: 'A puzzle and a board game in one box',
    accent: '#5A6B4C',
  },
]

/* The animal ladder: four tiers, but every design is cut to its own dimensions. */
function animalSizes(
  rows: [pieces: number, w: number, h: number, price: number, was: number, soldOut?: boolean][],
): Variant[] {
  const keys = ['s', 'm', 'king', 'royal']
  const labels = ['Size S', 'Size M', 'King Size', 'Royal Size']
  return rows.map(([pieces, w, h, priceUsd, wasUsd, soldOut], i) => ({
    key: keys[i],
    label: labels[i],
    pieces,
    inches: [w, h] as [number, number],
    priceUsd,
    wasUsd,
    ...(soldOut ? { soldOut } : {}),
  }))
}

/*
 * The shop runs sales on part of the range, not all of it. Everything below is
 * written at its sale price with the list price alongside; this puts a product
 * back on full price by promoting the list price and dropping the discount, so
 * the two prices never have to be kept in step by hand.
 */
function atListPrice(variants: Variant[]): Variant[] {
  return variants.map(({ wasUsd, ...rest }) => ({
    ...rest,
    priceUsd: wasUsd ?? rest.priceUsd,
  }))
}

/* Every mandala is square and shares one ladder of three. */
const MANDALA_SIZES: Variant[] = [
  {
    key: 'm',
    label: 'Size M',
    pieces: 200,
    inches: [9.8, 9.8],
    priceUsd: 35.99,
    wasUsd: 49.99,
  },
  {
    key: 'king',
    label: 'King Size',
    pieces: 350,
    inches: [13, 13],
    priceUsd: 49.99,
    wasUsd: 69.99,
  },
  {
    key: 'royal',
    label: 'Royal Size',
    pieces: 700,
    inches: [17.7, 17.7],
    priceUsd: 70.99,
    wasUsd: 99.99,
  },
]

/*
 * The travel cases are the same board in a different city — one size, 500
 * pieces, and a list price they all share. Only the sale price differs.
 */
function travelCase(priceUsd: number): Variant[] {
  return [
    {
      key: 'one',
      label: 'One Size',
      pieces: 500,
      inches: [16.1, 16.5],
      priceUsd,
      wasUsd: 79.99,
    },
  ]
}

export const PRODUCTS: Product[] = [
  {
    id: 'mysterious-lion',
    slug: 'mysterious-lion',
    name: 'Mysterious Lion',
    collection: 'animals',
    photo: '/products/animals/mysterious-lion.webp',
    tagline: 'A mane with a whole savannah inside it',
    story:
      'The lion sits at the centre of the circle, and the circle is drawn in the mane: antelopes and rhinos, hyenas and flamingos, meerkats and crocodiles, all worked into the curls. Finding them is most of the build.',
    variants: atListPrice(
      animalSizes([
        [106, 7.5, 9.5, 28.99, 39.99],
        [192, 9.7, 12.5, 35.99, 49.99],
        [327, 12.2, 15.7, 49.99, 69.99],
        [700, 17, 22, 70.99, 99.99],
      ]),
    ),
    bestseller: true,
  },
  {
    id: 'guarding-dragon',
    slug: 'guarding-dragon',
    name: 'Guarding Dragon',
    collection: 'animals',
    photo: '/products/animals/guarding-dragon.webp',
    tagline: 'Treasure hidden in the scales, as dragons prefer it',
    story:
      'Shields, coins and tongues of fire are cut into the dragon rather than drawn beside it, so the hoard only shows itself once the scales start going down in the right order.',
    variants: atListPrice(
      animalSizes([
        [97, 6.2, 10.3, 24.99, 39.99],
        [183, 8.3, 13, 30.99, 49.99],
        [330, 10.6, 17.3, 42.99, 69.99],
        [700, 14.8, 24.2, 60.99, 99.99, true],
      ]),
    ),
    bestseller: true,
  },
  {
    id: 'charming-owl',
    slug: 'charming-owl',
    name: 'Charming Owl',
    collection: 'animals',
    photo: '/products/animals/charming-owl.webp',
    tagline: 'The forest comes to the owl for advice',
    story:
      'A deer waiting on an answer, a hedgehog underfoot, a hare watching the treeline — and the wolves and foxes it is watching for, tucked among leaves and acorns.',
    variants: atListPrice(
      animalSizes([
        [101, 5.9, 10.2, 24.99, 39.99],
        [186, 8.3, 13.8, 30.99, 49.99],
        [366, 9.9, 17.1, 42.99, 69.99],
        [650, 13.9, 24, 60.99, 99.99, true],
      ]),
    ),
    bestseller: true,
  },
  {
    id: 'iridescent-chameleon',
    slug: 'iridescent-chameleon',
    name: 'Iridescent Chameleon',
    collection: 'animals',
    photo: '/products/animals/chameleon-jigsaw.webp',
    tagline: 'Colour that shifts as the lizard does',
    story:
      'Reptiles, tropical birds and smaller crawling things hide in the pattern, all of them glowing in the colours the chameleon happens to be wearing. Start at the head — the eye is the piece that orients everything else.',
    variants: animalSizes([
      [107, 7.5, 9.5, 24.99, 39.99],
      [202, 10.2, 13, 30.99, 49.99],
      [314, 12.2, 16.1, 42.99, 69.99],
      [700, 17.9, 26.5, 60.99, 99.99],
    ]),
    bestseller: true,
  },
  {
    id: 'lovely-tiger',
    slug: 'lovely-tiger',
    name: 'Lovely Tiger',
    collection: 'animals',
    photo: '/products/animals/lovely-tiger.webp',
    tagline: 'Strength and tenderness in the same stripes',
    story:
      'One of the most recognisable predators alive, drawn as the force it stands for rather than as a portrait. The eyes are worth saving for last.',
    variants: atListPrice(
      animalSizes([
        [104, 7.4, 9.3, 28.99, 39.99],
        [181, 9.8, 12.3, 35.99, 49.99],
        [273, 11.7, 14.7, 49.99, 69.99],
        [700, 16.4, 20.6, 70.99, 99.99, true],
      ]),
    ),
    bestseller: true,
  },
  {
    id: 'impressive-cat',
    slug: 'impressive-cat',
    name: 'Impressive Cat',
    collection: 'animals',
    photo: '/products/animals/impressive-cat.webp',
    tagline: 'Cats inside a cat, most of them famous',
    story:
      'Sitting, stretching, playing, sleeping, leaping — the illustration is packed with cats, and a fair number of them are ones you will recognise.',
    variants: atListPrice(
      animalSizes([
        [100, 7.5, 8.3, 32.99, 39.99],
        [200, 9.5, 10.6, 40.99, 49.99],
        [300, 12.2, 13.4, 56.99, 69.99],
        [700, 18.1, 20.5, 80.99, 99.99],
      ]),
    ),
  },

  {
    id: 'mandala-tree-of-life',
    slug: 'mandala-tree-of-life',
    name: 'Mandala Tree of Life',
    collection: 'mandalas',
    photo: '/products/mandalas/mandala-tree-of-life.webp',
    tagline: 'Branches and roots closing the same circle',
    story:
      'Butterflies and stars, birds and flowers, animals and planets turn up as you build. Two kinds of piece are mixed on purpose — rigid and geometric against soft and flowing — and the lacquered pieces catch the light where the sap would run.',
    variants: MANDALA_SIZES,
    bestseller: true,
  },
  {
    id: 'mandala-conscious-love',
    slug: 'mandala-conscious-love',
    name: 'Mandala Conscious Love',
    collection: 'mandalas',
    photo: '/products/mandalas/mandala-conscious-love.webp',
    tagline: 'Doves, butterflies and a romance told in rings',
    story:
      'The story runs outward from the centre, and the larger the tier the further it gets: a beginning at Size M, something a good deal longer-lived by Royal Size.',
    variants: atListPrice(MANDALA_SIZES),
    bestseller: true,
  },
  {
    id: 'mandala-overarching-opposites',
    slug: 'mandala-overarching-opposites',
    name: 'Mandala Overarching Opposites',
    collection: 'mandalas',
    photo: '/products/mandalas/mandala-overarching-opposites.webp',
    tagline: 'A yin and yang cut two different ways',
    story:
      'The dark half is cut into angular pieces that look like parts of a mechanism; the light half into smooth, flowering shapes. Each side can be built on its own before the two are closed together.',
    variants: MANDALA_SIZES,
  },
  {
    id: 'mandala-space-dreams',
    slug: 'mandala-space-dreams',
    name: 'Mandala Space Dreams',
    collection: 'mandalas',
    photo: '/products/mandalas/mandala-space-dreams.webp',
    tagline: 'For the ambitions that need a bigger room',
    story:
      'A mandala about going past the edge of the known — dedicated to discovery, and to the argument that anyone who has left the planet can manage most other things.',
    variants: MANDALA_SIZES,
  },

  {
    id: 'quezzle-amazing-cappadocia',
    slug: 'quezzle-amazing-cappadocia',
    name: 'Quezzle Amazing Cappadocia',
    collection: 'quezzle',
    photo: '/products/quezzle/quezzle-amazing-cappadocia.webp',
    tagline: 'A quest across the fairy chimneys, sold in parts',
    story:
      'Balloons drift over the rock valleys while the board hides secrets, interactive bits and a storyline that unfolds as the picture does. It comes on four boards of 250 pieces each: Part 1 opens the story on its own, the extension adds the remaining three, and the full set runs the twelve-step quest across all four.',
    variants: [
      {
        key: 'part-1',
        label: 'Part 1',
        pieces: 250,
        inches: [14.1, 9.9],
        boards: 1,
        photo: '/products/quezzle/quezzle-1.webp',
        priceUsd: 42.99,
        wasUsd: 59.99,
      },
      {
        key: 'parts-2-4',
        label: 'Extension Pack (Parts 2–4)',
        pieces: 750,
        inches: [14.1, 9.9],
        boards: 3,
        photo: '/products/quezzle/quezzle-2.webp',
        priceUsd: 85.99,
        wasUsd: 122.69,
      },
      {
        key: 'full',
        label: 'Full Pack (Parts 1–4)',
        pieces: 1000,
        inches: [14.1, 9.9],
        boards: 4,
        photo: '/products/quezzle/quezzle-3.webp',
        priceUsd: 91.99,
        wasUsd: 129.99,
      },
    ],
  },
  {
    id: 'quezzle-space-adventures',
    slug: 'quezzle-space-adventures',
    name: 'Quezzle Space Adventures',
    collection: 'quezzle',
    photo: '/products/quezzle/quezzle-space-adventures.webp',
    tagline: 'A thousand pieces and a board game in one box',
    story:
      'Prince Unidragon goes after the villain who took the princess, and the chase runs off into deep space. Inside the box: the puzzle, a quest played on the finished board, 3D spaceships and a set of arcade games.',
    variants: atListPrice([
      {
        key: 'one',
        label: 'One Size',
        pieces: 1000,
        inches: [27.9, 19.6],
        priceUsd: 133.99,
        wasUsd: 189.99,
      },
    ]),
  },
  {
    id: 'starry-night',
    slug: 'starry-night',
    name: 'Starry Night',
    collection: 'quezzle',
    photo: '/products/quezzle/starry-night.webp',
    tagline: 'Van Gogh, cut so the brushwork stands up',
    story:
      'The finish is raised to imitate the strokes themselves. More than twenty-five miniature pieces are hidden in it — a self-portrait, the sunflowers, the chair and other things from a life that was not easy.',
    variants: atListPrice([
      {
        key: 'one',
        label: 'One Size',
        pieces: 1000,
        inches: [17.4, 22],
        priceUsd: 143.99,
        wasUsd: 159.99,
      },
    ]),
    bestseller: true,
  },

  {
    id: 'paris-travel-case',
    slug: 'paris-wooden-puzzle-travel-case-edition',
    name: 'Paris — Travel Case Edition',
    collection: 'new',
    photo: '/products/new/paris-wooden-puzzle-travel-case-edition.webp',
    tagline: 'A whole city folded into a suitcase',
    story:
      'The Eiffel Tower at golden hour, café terraces in the Marais, the Seine running past the bridges — all of it packed into an open travel case. Dozens of the pieces are cut as French things in their own right: the tower, a croissant, a Vespa, the Arc de Triomphe. The case is the box it arrives in, so the puzzle has somewhere to live afterwards.',
    variants: travelCase(56.99),
  },
  {
    id: 'italy-travel-case',
    slug: 'italy-wooden-puzzle-travel-case-edition',
    name: 'Italy — Travel Case Edition',
    collection: 'new',
    photo: '/products/new/italy-wooden-puzzle-travel-case-edition.webp',
    tagline: 'Tuscan hills and terracotta, packed for the trip',
    story:
      'Sunlit piazzas, rooftops going orange in the evening and a stretch of Mediterranean coast, built inside an open case. Gondolas, scooters, arches of the Colosseum and a wine shop or two turn up among the pieces.',
    variants: travelCase(56.99),
  },
  {
    id: 'new-york-travel-case',
    slug: 'new-york-wooden-puzzle-travel-case-edition',
    name: 'New York — Travel Case Edition',
    collection: 'new',
    photo: '/products/new/new-york-wooden-puzzle-travel-case-edition.webp',
    tagline: 'Cabs, bridges and neon in a traveller’s case',
    story:
      'Yellow cabs down a crowded avenue, the Statue of Liberty holding its corner, Broadway lit up and the Brooklyn Bridge reaching over the East River. The letters N and Y are in there as pieces, along with an aeroplane, a streetlamp and a slice of pizza.',
    variants: travelCase(72.99),
  },
]

export const CUSTOM_PUZZLE: Product = {
  id: 'custom',
  slug: 'custom',
  name: 'Custom puzzle',
  tagline: 'Cut from a picture you bring',
  story:
    'The same board, the same cut, the same box. The only difference is that the picture on it is yours.',
  variants: [
    {
      key: 's',
      label: 'Size S',
      pieces: 100,
      inches: [7.9, 5.9],
      priceUsd: 43.99,
    },
    {
      key: 'm',
      label: 'Size M',
      pieces: 200,
      inches: [11.8, 8.7],
      priceUsd: 67.99,
    },
    {
      key: 'king',
      label: 'King Size',
      pieces: 350,
      inches: [16.9, 12.2],
      priceUsd: 103.99,
    },
    {
      key: 'royal',
      label: 'Royal Size',
      pieces: 700,
      inches: [23.6, 16.9],
      priceUsd: 149.99,
    },
  ],
}

export const CUSTOM_ID_PREFIX = 'custom-'

export const CURRENCIES = {
  USD: {
    code: 'USD',
    symbol: '$',
    rate: 1,
    locale: 'en-US',
    freeShippingFrom: 49,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    rate: 0.92,
    locale: 'de-DE',
    freeShippingFrom: 45,
  },
} as const

export type CurrencyCode = keyof typeof CURRENCIES

export function productBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug)
}

export function productsIn(collection: CollectionId): Product[] {
  return PRODUCTS.filter((p) => p.collection === collection)
}

export function priceFrom(product: Product): number {
  return Math.min(...product.variants.map((v) => v.priceUsd))
}

/* Largest piece count a product is cut to — what the catalogue filter sorts on. */
export function maxPieces(product: Product): number {
  const counts = product.variants.map((v) => v.pieces ?? 0)
  return Math.max(0, ...counts)
}

export function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54 * 10) / 10
}
