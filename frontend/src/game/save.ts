/*
 * Keeping a half-built puzzle across a reload. One save per design, piece count
 * and seed — the three things a share link carries — so following a link twice
 * picks up where it was left rather than starting over.
 */

import type { GameSnapshot } from './state'

const KEY = 'woodtrick.play.save'

export interface SavedGame {
  key: string
  elapsed: number
  snapshot: GameSnapshot
}

export function saveKey(slug: string, pieces: number, seed: number): string {
  return `${slug}:${pieces}:${seed}`
}

export function loadGame(key: string): SavedGame | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const saved = JSON.parse(raw) as SavedGame
    return saved.key === key ? saved : null
  } catch {
    return null
  }
}

export function storeGame(saved: SavedGame) {
  try {
    localStorage.setItem(KEY, JSON.stringify(saved))
  } catch {
    /* private browsing, a full quota — the game is still playable, just not resumable */
  }
}

export function clearGame(key: string) {
  const current = loadGame(key)
  if (current) localStorage.removeItem(KEY)
}
