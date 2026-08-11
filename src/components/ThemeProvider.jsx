import React, { createContext, useContext, useEffect, useState } from "react"

const initialState = {
  theme: "system",
  globalTheme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(storageKey) || defaultTheme
  )
  const [globalTheme, setGlobalTheme] = useState("system")

  // Fetch global theme
  useEffect(() => {
    const fetchGlobalTheme = async () => {
      try {
        const res = await fetch('/api/admin/settings/theme');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.globalTheme) {
            setGlobalTheme(data.globalTheme);
          }
        }
      } catch (err) {
        console.error('Failed to fetch global theme', err);
      }
    };

    fetchGlobalTheme();
    // Poll every 5 minutes
    const interval = setInterval(fetchGlobalTheme, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement

    // Remove all possible theme classes
    root.classList.remove("light", "dark", "event-diwali", "event-holi", "event-independence")

    // 1. Determine and apply Base Theme (light/dark) based on local 'theme'
    let baseTheme = theme;
    if (theme === "system") {
      baseTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    root.classList.add(baseTheme)

    // 2. Apply Event Theme based on globalTheme
    // Old DB might have 'system' instead of 'none', treat both as no-event.
    if (globalTheme && globalTheme !== 'system' && globalTheme !== 'none') {
      root.classList.add(`event-${globalTheme}`)
    }
  }, [theme, globalTheme])

  const value = {
    theme,
    globalTheme,
    setTheme: (newTheme) => {
      localStorage.setItem(storageKey, newTheme)
      setTheme(newTheme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
