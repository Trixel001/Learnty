import { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'

export const DarkModeToggle = () => {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark' || 
                   (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDarkMode(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  const toggleTheme = () => {
    const newIsDarkMode = !isDarkMode
    setIsDarkMode(newIsDarkMode)
    localStorage.setItem('theme', newIsDarkMode ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', newIsDarkMode)
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg">
      <span className="font-medium text-foreground">Dark Mode</span>
      <button
        onClick={toggleTheme}
        className="p-2 rounded-full bg-secondary"
      >
        {isDarkMode ? <Sun className="w-5 h-5 text-foreground" /> : <Moon className="w-5 h-5 text-foreground" />}
      </button>
    </div>
  )
}
