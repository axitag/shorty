import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({
  dark: false,
  toggle: () => {},
  setMode: () => {},
})

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('theme')
      if (saved) return saved === 'dark'
      return false
    } catch {
      return false
    }
  })

  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    if (dark) {
      root.classList.add('dark')
      body.classList.add('dark')
      root.setAttribute('data-theme', 'dark')
      try { localStorage.setItem('theme', 'dark') } catch {}
    } else {
      root.classList.remove('dark')
      body.classList.remove('dark')
      root.setAttribute('data-theme', 'light')
      try { localStorage.setItem('theme', 'light') } catch {}
    }
  }, [dark])

  const toggle = () => setDark((prev) => !prev)
  const setMode = (isDark) => setDark(isDark)

  return (
    <ThemeContext.Provider value={{ dark, toggle, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
