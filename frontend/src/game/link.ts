/*
 * What a shared link carries. The cut is a pure function of the seed, so a link
 * needs to name the design, the piece count and the seed and nothing else —
 * whoever opens it cuts the identical puzzle without a byte of geometry crossing
 * the wire.
 */

import { PIECE_COUNTS, isPieceCount, type PieceCount } from './cut'

export interface PuzzleLink {
  pieces: PieceCount
  seed: number
  room: string | null
}

export function newSeed(): number {
  return 1 + Math.floor(Math.random() * 999_998)
}

export function newRoom(): string {
  return Math.random().toString(36).slice(2, 8)
}

export function readLink(search: string, hash: string): PuzzleLink {
  const params = new URLSearchParams(search)

  const wanted = Number(params.get('p'))
  const pieces: PieceCount = isPieceCount(wanted) ? wanted : PIECE_COUNTS[1]

  const seed = Number(params.get('s'))

  const room = /(?:^#|&)room=([a-z0-9]{4,12})/i.exec(hash)?.[1] ?? null

  return {
    pieces,
    seed: Number.isFinite(seed) && seed > 0 ? Math.floor(seed) : newSeed(),
    room,
  }
}

export function puzzlePath(slug: string, pieces: number, seed: number, room?: string | null) {
  return `/play/${slug}?p=${pieces}&s=${seed}${room ? `#room=${room}` : ''}`
}

export function shareUrl(slug: string, pieces: number, seed: number, room?: string | null) {
  return `${window.location.origin}${puzzlePath(slug, pieces, seed, room)}`
}
