// src/components/shared/ThemeToggle.jsx
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext.jsx'

export default function ThemeToggle() {
  const { isDark, toggle, theme } = useTheme()

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        width:           34,
        height:          34,
        background:      isDark ? 'rgba(255,245,220,0.07)' : 'rgba(255, 255, 255, 0.05)',
        border:          `1px solid ${theme.border}`,
        borderRadius:    10,
        color:           theme.text,
        cursor:          'pointer',
        flexShrink:      0,
        transition:      'all 0.22s ease',
        backdropFilter:  'blur(12px)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = isDark ? 'rgba(255,245,220,0.13)' : 'rgba(0,0,0,0.10)'
        e.currentTarget.style.borderColor = theme.borderHi
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = isDark ? 'rgba(255,245,220,0.07)' : 'rgba(0,0,0,0.05)'
        e.currentTarget.style.borderColor = theme.border
      }}
    >
      {isDark
        ? <Sun  size={14} strokeWidth={1.8} />
        : <Moon size={14} strokeWidth={1.8} />
      }
    </button>
  )
}