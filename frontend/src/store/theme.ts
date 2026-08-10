import { create } from 'zustand'

export type Theme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'unidragon-theme'

interface ThemeState {
  theme: Theme
  chosen: boolean
  setTheme(theme: Theme): void
  followSystem(theme: Theme): void
}

function current(): { theme: Theme; chosen: boolean } {
  if (typeof document === 'undefined') return { theme: 'dark', chosen: false }
  const theme: Theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
  let chosen = false
  try {
    chosen = localStorage.getItem(THEME_STORAGE_KEY) !== null
  } catch {}
  return { theme, chosen }
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme
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
    } catch {}
    set({ theme, chosen: true })
  },

  followSystem: (theme) =>
    set((state) => {
      if (state.chosen) return state
      apply(theme)
      return { theme }
    }),
}))
