import { useEffect } from 'react'
import { useTheme, type Theme } from '../../store/theme'

const OPTIONS: Array<{ value: Theme; label: string; path: string }> = [
  {
    value: 'light',
    label: 'Light',
    // A sun: disc and eight rays, drawn rather than fetched so the control has
    // nothing to wait for.
    path: 'M12 5.2a1 1 0 0 1-1-1V2.6a1 1 0 1 1 2 0v1.6a1 1 0 0 1-1 1Zm0 16.2a1 1 0 0 1-1-1v-1.6a1 1 0 1 1 2 0v1.6a1 1 0 0 1-1 1Zm9.4-9.4a1 1 0 0 1-1 1h-1.6a1 1 0 1 1 0-2h1.6a1 1 0 0 1 1 1Zm-16.2 0a1 1 0 0 1-1 1H2.6a1 1 0 1 1 0-2h1.6a1 1 0 0 1 1 1Zm13.1-6.3a1 1 0 0 1 0 1.4l-1.1 1.2a1 1 0 1 1-1.5-1.5l1.2-1.1a1 1 0 0 1 1.4 0ZM6.9 17.1a1 1 0 0 1 0 1.4l-1.2 1.2a1 1 0 0 1-1.4-1.4l1.2-1.2a1 1 0 0 1 1.4 0Zm11.4 2.6a1 1 0 0 1-1.4 0l-1.2-1.2a1 1 0 0 1 1.5-1.4l1.1 1.2a1 1 0 0 1 0 1.4ZM6.9 6.9a1 1 0 0 1-1.4 0L4.3 5.7a1 1 0 0 1 1.4-1.4l1.2 1.2a1 1 0 0 1 0 1.4ZM12 7.6a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8Z',
  },
  {
    value: 'dark',
    label: 'Dark',
    // A crescent, cut from one disc by another.
    path: 'M20.7 14.6A9 9 0 0 1 9.4 3.3a1 1 0 0 0-1.3-1.2 10.4 10.4 0 1 0 13.8 13.8 1 1 0 0 0-1.2-1.3Z',
  },
]

/**
 * Two states, shown as two buttons rather than one switch: a switch has to say
 * which way is on, and neither theme is the "on" one.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useTheme((s) => s.theme)
  const setTheme = useTheme((s) => s.setTheme)
  const followSystem = useTheme((s) => s.followSystem)

  // Keep following the system for as long as nobody has overridden it, so a
  // visitor who switches their laptop to dark at dusk sees the site follow.
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: light)')
    const update = (event: MediaQueryList | MediaQueryListEvent) =>
      followSystem(event.matches ? 'light' : 'dark')
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [followSystem])

  return (
    <div
      className={`flex items-center rounded-full border border-ink-line p-0.5 ${className}`}
      role="group"
      aria-label="Colour theme"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setTheme(option.value)}
          aria-pressed={theme === option.value}
          title={`${option.label} theme`}
          className={[
            'grid h-6 w-7 place-items-center rounded-full transition-colors',
            theme === option.value ? 'bg-paper text-ink' : 'text-paper/55 hover:text-paper',
          ].join(' ')}
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
            <path d={option.path} />
          </svg>
          <span className="sr-only">{option.label} theme</span>
        </button>
      ))}
    </div>
  )
}
