import { ref, watchEffect } from 'vue'

/**
 * 主题切换 composable。
 * - 亮/暗两态，localStorage 持久化（key: theme）
 * - 首次访问跟随系统 prefers-color-scheme
 * - 通过 <html> 上的 .dark 类驱动（style.css 中定义 .dark 变量块）
 */
const THEME_KEY = 'theme'

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(THEME_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const theme = ref(getInitialTheme())

watchEffect(() => {
  document.documentElement.classList.toggle('dark', theme.value === 'dark')
})

export function useTheme() {
  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    localStorage.setItem(THEME_KEY, theme.value)
  }

  return { theme, toggleTheme }
}
