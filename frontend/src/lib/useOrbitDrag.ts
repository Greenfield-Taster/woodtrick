import { useCallback, useEffect, useRef, useState } from 'react'

interface OrbitDragOptions {
  speed?: number
  pitchLimit?: number
  /* Half the sweep, in radians. Unbounded by default — a puzzle turns right round. */
  yawLimit?: number
}

export function useOrbitDrag<T extends HTMLElement = HTMLDivElement>({
  speed = 0.008,
  pitchLimit = 0.7,
  yawLimit = Infinity,
}: OrbitDragOptions = {}) {
  const offset = useRef({ yaw: 0, pitch: 0 })
  const last = useRef({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!dragging) return

    const move = (event: PointerEvent) => {
      const { x, y } = last.current
      offset.current.yaw = Math.min(
        yawLimit,
        Math.max(-yawLimit, offset.current.yaw + (event.clientX - x) * speed),
      )
      offset.current.pitch = Math.min(
        pitchLimit,
        Math.max(-pitchLimit, offset.current.pitch + (event.clientY - y) * speed * 0.75),
      )
      last.current = { x: event.clientX, y: event.clientY }
    }
    const stop = () => setDragging(false)

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
    }
  }, [dragging, speed, pitchLimit, yawLimit])

  const onPointerDown = useCallback((event: React.PointerEvent<T>) => {
    last.current = { x: event.clientX, y: event.clientY }
    setDragging(true)
  }, [])

  return { offset, dragging, onPointerDown }
}
