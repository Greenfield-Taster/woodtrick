/*
 * Playing the same puzzle as somebody else, with no server of ours anywhere.
 *
 * Trystero does the introductions over public Nostr relays and then gets out of
 * the way — once two browsers have found each other the pieces travel directly
 * between them, encrypted, touching nothing we run. That is what makes co-op
 * possible on a site that deploys as a folder of static files.
 *
 * Only actions cross the wire, never geometry: the cut is a pure function of the
 * seed in the URL, so both sides already agree on the shape of every piece.
 */

import { joinRoom, selfId, type Room } from 'trystero'
import type { Action } from './session'
import type { GameSnapshot } from './state'

const APP_ID = 'woodtrick-jigsaw'

/*
 * Named rather than left to the library's defaults, two of which were dead when
 * this was written and filled the console with failed sockets on every join.
 * These are long-running public Nostr relays; peers only need to meet on one of
 * them, and the puzzle itself never travels over any.
 */
const RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://nostr.mom',
  'wss://relay.primal.net',
  'wss://relay.nostr.band',
]

export interface PeerCursor {
  id: string
  x: number
  y: number
}

export interface NetRoom {
  selfId: string
  send(action: Action): void
  sendCursor(x: number, y: number): void
  cursors(): PeerCursor[]
  leave(): void
}

export interface NetOptions {
  roomId: string
  /* Something another player did. */
  onAction(action: Action): void
  /* The pieces every other player is currently holding. */
  onClaims(pieces: number[]): void
  onPeerCount(count: number): void
  /* Asked for when somebody joins, so they can be caught up. */
  snapshot(): GameSnapshot
}

export function joinPuzzleRoom(options: NetOptions): NetRoom {
  const room: Room = joinRoom(
    { appId: APP_ID, relayConfig: { urls: RELAYS, redundancy: 3 } },
    options.roomId,
  )

  /*
   * Actions travel as JSON text. Trystero's payload type wants a plain index
   * signature all the way down, which our tagged union is not; encoding here
   * keeps the wire format ours rather than bending the game's types to fit a
   * transport.
   */
  const action = room.makeAction<string>('piece')
  const cursor = room.makeAction<[number, number]>('cursor')

  /* One held group per peer, named by the piece they took hold of. */
  const claims = new Map<string, number>()
  const seen = new Map<string, PeerCursor>()

  const publishClaims = () => options.onClaims([...claims.values()])

  action.onMessage = (text, { peerId }) => {
    let incoming: Action
    try {
      incoming = JSON.parse(text) as Action
    } catch {
      return // a peer on a different version of the format; ignore rather than crash
    }

    if (incoming.t === 'claim') claims.set(peerId, incoming.piece)
    if (incoming.t === 'drop') claims.delete(peerId)
    if (incoming.t === 'claim' || incoming.t === 'drop') publishClaims()
    options.onAction(incoming)
  }

  cursor.onMessage = ([x, y], { peerId }) => {
    seen.set(peerId, { id: peerId, x, y })
  }

  room.onPeerJoin = (peerId) => {
    options.onPeerCount(Object.keys(room.getPeers()).length)

    /*
     * Everyone present could catch the newcomer up, and everyone doing it at
     * once would be a small storm for no gain. The peer with the lowest id
     * answers — a rule both sides can apply without agreeing on anything.
     */
    const present = [selfId, ...Object.keys(room.getPeers()).filter((id) => id !== peerId)]
    if (present.sort()[0] === selfId) {
      void action.send(JSON.stringify({ t: 'sync', snap: options.snapshot() } satisfies Action))
    }
  }

  room.onPeerLeave = (peerId) => {
    claims.delete(peerId)
    seen.delete(peerId)
    publishClaims()
    options.onPeerCount(Object.keys(room.getPeers()).length)
  }

  return {
    selfId,
    send: (outgoing) => void action.send(JSON.stringify(outgoing)),
    sendCursor: (x, y) => void cursor.send([x, y]),
    cursors: () => [...seen.values()],
    leave: () => void room.leave(),
  }
}
