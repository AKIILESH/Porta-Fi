// src/context/ThemeContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { lightTheme, darkTheme } from '../lib/theme.js'

const ThemeCtx = createContext(null)

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('portafi-theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const theme  = isDark ? darkTheme : lightTheme
  const toggle = () => {
    setIsDark(v => {
      localStorage.setItem('portafi-theme', !v ? 'dark' : 'light')
      return !v
    })
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    // Also set the body background so there's no flash of wrong color
    document.body.style.background = isDark
      ? 'rgba(14, 11, 20, 1)'
      : 'rgba(242, 240, 236, 1)'
  }, [isDark])

  return (
    <ThemeCtx.Provider value={{ theme, isDark, toggle }}>
      {children}
    </ThemeCtx.Provider>
  )
}

export const useTheme = () => useContext(ThemeCtx)