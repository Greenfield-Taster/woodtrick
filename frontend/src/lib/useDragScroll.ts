import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Turns a horizontally scrolling element into something you can grab and throw.
 *
 * A rail that only responds to its scrollbar reads as broken to anyone used to
 * a carousel, and a trackpad user never finds the bar at all.
 */
export function useDragScroll<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const state = useRef({ down: false, startX: 0, startScroll: 0, moved: 0 })
  const [dragging, setDragging] = useState(false)
  const [edges, setEdges] = useState({ start: true, end: false })

  const measure = useCallback(() => {
    const node = ref.current
    if (!node) return
    const max = node.scrollWidth - node.clientWidth
    setEdges({ start: node.scrollLeft <= 2, end: node.scrollLeft >= max - 2 })
  }, [])

  useEffect(() => {
    const node = ref.current
    if (!node) return

    measure()
    node.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      node.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  useEffect(() => {
    if (!dragging) return

    const move = (event: PointerEvent) => {
      const node = ref.current
      if (!node) return
      const delta = event.clientX - state.current.startX
      state.current.moved = Math.max(state.current.moved, Math.abs(delta))
      node.scrollLeft = state.current.startScroll - delta
    }
    const up = () => {
      state.current.down = false
      setDragging(false)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [dragging])

  const onPointerDown = (event: React.PointerEvent<T>) => {
    // Let touch keep the browser's own momentum scrolling.
    if (event.pointerType === 'touch') return
    const node = ref.current
    if (!node) return
    state.current = { down: true, startX: event.clientX, startScroll: node.scrollLeft, moved: 0 }
    setDragging(true)
  }

  /**
   * Cards are links, and a link answers a press-and-drag by starting a native
   * drag-and-drop of itself — which cancels the pointer stream, so the rail
   * would stop dead a few pixels in whenever the grab landed on a card.
   */
  const onDragStart = (event: React.DragEvent<T>) => {
    event.preventDefault()
  }

  /** Swallows the click that ends a drag, so throwing the rail never navigates. */
  const onClickCapture = (event: React.MouseEvent<T>) => {
    if (state.current.moved > 6) {
      event.preventDefault()
      event.stopPropagation()
      state.current.moved = 0
    }
  }

  const scrollByPage = (direction: -1 | 1) => {
    const node = ref.current
    if (!node) return
    node.scrollBy({ left: direction * node.clientWidth * 0.8, behavior: 'smooth' })
  }

  return { ref, dragging, edges, onPointerDown, onDragStart, onClickCapture, scrollByPage }
}
