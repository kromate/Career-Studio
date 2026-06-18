type ThemePreference = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'career-studio:theme:v1'
const DARK_THEME_COLOR = '#171521'
const LIGHT_THEME_COLOR = '#601ded'

let systemThemeQuery: MediaQueryList | null = null
let systemThemeListenerAttached = false

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: ResolvedTheme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme

  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (themeColor) themeColor.content = theme === 'dark' ? DARK_THEME_COLOR : LIGHT_THEME_COLOR
}

export function useTheme() {
  const preference = useState<ThemePreference>('career-studio-theme-preference', () => 'system')
  const resolvedTheme = useState<ResolvedTheme>('career-studio-theme-resolved', () => 'light')
  const initialized = useState('career-studio-theme-initialized', () => false)

  const syncTheme = () => {
    if (!import.meta.client) return
    const nextTheme = preference.value === 'system' ? getSystemTheme() : preference.value
    resolvedTheme.value = nextTheme
    applyTheme(nextTheme)
  }

  const setPreference = (nextPreference: ThemePreference) => {
    preference.value = nextPreference
    if (import.meta.client) {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextPreference)
      syncTheme()
    }
  }

  const toggleTheme = () => {
    setPreference(resolvedTheme.value === 'dark' ? 'light' : 'dark')
  }

  const initTheme = () => {
    if (!import.meta.client) return

    if (!initialized.value) {
      const storedPreference = window.localStorage.getItem(THEME_STORAGE_KEY)
      if (isThemePreference(storedPreference)) preference.value = storedPreference

      systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
      if (!systemThemeListenerAttached) {
        systemThemeQuery.addEventListener('change', () => {
          if (preference.value === 'system') syncTheme()
        })
        systemThemeListenerAttached = true
      }

      watch(preference, syncTheme, { immediate: true })
      initialized.value = true
      return
    }

    syncTheme()
  }

  return {
    preference,
    resolvedTheme,
    setPreference,
    toggleTheme,
    initTheme,
  }
}
