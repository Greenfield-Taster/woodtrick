import { useEffect, useRef } from 'react'
import type { PeerCursor } from '../../game/net'
import type { Session } from '../../game/session'

interface PeerCursorsProps {
  session: Session | null
  cursors(): PeerCursor[]
}

function hueOf(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h % 360
}

/*
 * The other players' pointers, drawn over the canvas rather than in it. They
 * move every frame and nothing about them belongs to the game state, so the
 * nodes are placed by hand — a React render per peer per frame would be a lot
 * of work to say the same thing.
 */
export function PeerCursors({ session, cursors }: PeerCursorsProps) {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = host.current
    if (!root || !session) return

    const nodes = new Map<string, HTMLDivElement>()
    let frame = 0

    const tick = () => {
      frame = requestAnimationFrame(tick)
      const live = cursors()
      const present = new Set<string>()

      for (const peer of live) {
        present.add(peer.id)

        let node = nodes.get(peer.id)
        if (!node) {
          node = document.createElement('div')
          node.className = 'pointer-events-none absolute -translate-y-1 will-change-transform'
          node.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 1.6 15 8.2l-5.6 1.3L7 15 2 1.6Z" fill="hsl(${hueOf(peer.id)} 80% 62%)" stroke="rgba(0,0,0,0.45)" stroke-width="1"/></svg>`
          root.append(node)
          nodes.set(peer.id, node)
        }

        const at = session.scene.toClient(peer.x, peer.y)
        const box = root.getBoundingClientRect()
        node.style.transform = `translate(${at.x - box.left}px, ${at.y - box.top}px)`
      }

      for (const [id, node] of nodes) {
        if (present.has(id)) continue
        node.remove()
        nodes.delete(id)
      }
    }

    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      for (const node of nodes.values()) node.remove()
      nodes.clear()
    }
  }, [session, cursors])

  return <div ref={host} className="pointer-events-none absolute inset-0 overflow-hidden" />
}
