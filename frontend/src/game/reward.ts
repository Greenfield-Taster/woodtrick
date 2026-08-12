/*
 * What finishing a puzzle is worth.
 *
 * The code is derived from the puzzle rather than drawn from a list, so the same
 * function can be run on a server later to check a code someone types at
 * checkout without any of them having to be stored in the meantime. Nothing here
 * touches the DOM or the cart for that reason.
 */

import { PIECE_COUNTS } from './cut'

export interface Reward {
  code: string
  percent: number
}

/* A bigger cut is a longer sitting, so it is worth more off. */
const TIERS: Record<number, number> = {
  24: 5,
  54: 8,
  100: 12,
  300: 18,
}

/* Words that name the format rather than the design, and so never identify it. */
const GENERIC = new Set([
  'wooden',
  'puzzle',
  'travel',
  'case',
  'edition',
  'mandala',
  'quezzle',
  'of',
  'the',
  'a',
])

export function codeName(slug: string): string {
  const words = slug.split('-').filter((word) => word && !GENERIC.has(word))
  const pick = words[words.length - 1] ?? slug
  return pick.slice(0, 9).toUpperCase()
}

export function rewardFor(slug: string, pieces: number): Reward {
  const percent = TIERS[pieces] ?? TIERS[PIECE_COUNTS[0]]
  return { code: `PLAY-${codeName(slug)}-${percent}`, percent }
}

/*
 * Whether a code is one this function could have produced. The server-side check
 * this stands in for would also want proof the game was actually played; today
 * the code is only handed out on the win screen, which is as far as a static site
 * can honestly go.
 */
export function isRewardCode(code: string, slug: string, pieces: number): boolean {
  return code.trim().toUpperCase() === rewardFor(slug, pieces).code
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/* One best time per design and piece count, kept in the browser that set it. */
const BEST_KEY = 'woodtrick.play.best'

type BestTimes = Record<string, number>

function readBest(): BestTimes {
  try {
    const raw = localStorage.getItem(BEST_KEY)
    return raw ? (JSON.parse(raw) as BestTimes) : {}
  } catch {
    return {}
  }
}

export function bestTime(slug: string, pieces: number): number | null {
  return readBest()[`${slug}:${pieces}`] ?? null
}

/* Returns the previous best, so the win screen can say whether it was beaten. */
export function recordTime(slug: string, pieces: number, ms: number): number | null {
  const all = readBest()
  const key = `${slug}:${pieces}`
  const previous = all[key] ?? null

  if (previous === null || ms < previous) {
    all[key] = ms
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify(all))
    } catch {
      /* a full or blocked store costs a leaderboard entry, not the game */
    }
  }

  return previous
}
