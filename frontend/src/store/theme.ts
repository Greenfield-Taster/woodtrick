import { create } from 'zustand'

export type Theme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'unidragon-theme'

interface ThemeState {
  theme: Theme
  /** False until the visitor picks one, while the system still decides. */
  chosen: boolean
  setTheme(theme: Theme): void
  /** Follow the system, for as long as nobody has overridden it. */
  followSystem(theme: Theme): void
}

/**
 * The document element already carries the right theme: an inline script in
 * index.html sets it before the first paint so nobody sees the other one flash.
 * Reading it back rather than working it out again keeps the two in step.
 */
function current(): { theme: Theme; chosen: boolean } {
  if (typeof document === 'undefined') return { theme: 'dark', chosen: false }
  const theme: Theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
  let chosen = false
  try {
    chosen = localStorage.getItem(THEME_STORAGE_KEY) !== null
  } catch {
    // Private mode, or storage denied. The theme still works, it just will not
    // outlive the tab.
  }
  return { theme, chosen }
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme
  // A phone paints its own chrome around the page from this.
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'light' ? '#f3ece1' : '#14100c')
}

export const useTheme = create<ThemeState>((set) => ({
  ...current(),

  setTheme: (theme) => {
    apply(theme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // See above: not being able to remember the choice is not a reason to
      // refuse to make it.
    }
    set({ theme, chosen: true })
  },

  followSystem: (theme) =>
    set((state) => {
      if (state.chosen) return state
      apply(theme)
      return { theme }
    }),
}))
