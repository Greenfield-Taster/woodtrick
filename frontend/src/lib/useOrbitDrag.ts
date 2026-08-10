import { useCallback, useEffect, useRef, useState } from 'react'

interface OrbitDragOptions {
  /** Radians of turn per pixel of pointer travel. */
  speed?: number
  /** How far the object may be tipped away from level, in radians. */
  pitchLimit?: number
}

/**
 * Lets a pointer turn a 3D object by hand.
 *
 * The turn is handed back as an *offset* rather than an absolute rotation, so
 * whatever already drives the object — a scroll position, an idle sway — keeps
 * driving it afterwards, now measured from wherever the visitor left it.
 *
 * It is a ref on purpose: the frame loop reads it sixty times a second and must
 * not re-render the React tree to do so.
 */
export function useOrbitDrag<T extends HTMLElement = HTMLDivElement>({
  speed = 0.008,
  pitchLimit = 0.7,
}: OrbitDragOptions = {}) {
  const offset = useRef({ yaw: 0, pitch: 0 })
  const last = useRef({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!dragging) return

    const move = (event: PointerEvent) => {
      const { x, y } = last.current
      offset.current.yaw += (event.clientX - x) * speed
      offset.current.pitch = Math.min(
        pitchLimit,
        Math.max(-pitchLimit, offset.current.pitch + (event.clientY - y) * speed * 0.75),
      )
      last.current = { x: event.clientX, y: event.clientY }
    }
    // pointercancel matters as much as pointerup here: on touch the browser
    // takes the gesture back the moment it decides you are scrolling the page.
    const stop = () => setDragging(false)

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
    }
  }, [dragging, speed, pitchLimit])

  const onPointerDown = useCallback((event: React.PointerEvent<T>) => {
    last.current = { x: event.clientX, y: event.clientY }
    setDragging(true)
  }, [])

  return { offset, dragging, onPointerDown }
}
