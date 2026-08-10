import { useEffect, useState } from 'react'

/**
 * `still` honours prefers-reduced-motion: scenes compose themselves instantly
 * and never animate. `low` is phones and weak GPUs. `high` is everything else.
 */
export type QualityTier = 'high' | 'low' | 'still'

export interface QualitySettings {
  tier: QualityTier
  /**
   * Ceiling on hero pieces, not a target. The wordmark asks for the size of
   * piece its letters can be read at and takes however many that comes to;
   * this only caps it on a device that cannot draw them.
   */
  heroPieces: number
  dpr: [number, number]
  shadows: boolean
  animate: boolean
}

function detect(): QualityTier {
  if (typeof window === 'undefined') return 'high'
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'still'

  const coarse = window.matchMedia('(pointer: coarse)').matches
  const narrow = window.innerWidth < 900
  const fewCores = (navigator.hardwareConcurrency ?? 8) <= 4
  return coarse || narrow || fewCores ? 'low' : 'high'
}

const SETTINGS: Record<QualityTier, Omit<QualitySettings, 'tier'>> = {
  high: { heroPieces: 900, dpr: [1, 2], shadows: true, animate: true },
  low: { heroPieces: 700, dpr: [1, 1.5], shadows: false, animate: true },
  still: { heroPieces: 700, dpr: [1, 1.5], shadows: false, animate: false },
}

export function useQuality(): QualitySettings {
  const [tier, setTier] = useState<QualityTier>(detect)

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setTier(detect())
    motion.addEventListener('change', update)
    window.addEventListener('resize', update)
    return () => {
      motion.removeEventListener('change', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return { tier, ...SETTINGS[tier] }
}
