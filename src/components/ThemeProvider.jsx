import React, { createContext, useContext, useEffect, useState } from "react"
import API_BASE from "../utils/api"

const initialState = {
  theme: "system",
  globalTheme: "none",
  setTheme: () => null,
  setGlobalTheme: () => null,
}

const ThemeProviderContext = createContext(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  globalStorageKey = "vite-ui-global-theme",
  ...props
}) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(storageKey) || defaultTheme
  )
  const [globalTheme, setGlobalThemeState] = useState(
    () => {
      const saved = localStorage.getItem(globalStorageKey);
      return saved === "system" ? "none" : (saved || "none");
    }
  )

  const setGlobalTheme = (newGlobalTheme) => {
    const val = (newGlobalTheme === 'system' || !newGlobalTheme) ? 'none' : newGlobalTheme;
    localStorage.setItem(globalStorageKey, val);
    setGlobalThemeState(val);
  };

  // Fetch global theme from backend
  useEffect(() => {
    const fetchGlobalTheme = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/settings/theme`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.globalTheme) {
            const normalized = data.globalTheme === 'system' ? 'none' : data.globalTheme;
            localStorage.setItem(globalStorageKey, normalized);
            setGlobalThemeState(normalized);
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
  }, [globalStorageKey]);

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
    if (globalTheme && globalTheme !== 'system' && globalTheme !== 'none') {
      root.classList.add(`event-${globalTheme}`)
    }
  }, [theme, globalTheme])

  // System theme dynamic change listener
  useEffect(() => {
    if (theme !== "system") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(mediaQuery.matches ? "dark" : "light");
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const value = {
    theme,
    globalTheme,
    setTheme: (newTheme) => {
      localStorage.setItem(storageKey, newTheme)
      setTheme(newTheme)
    },
    setGlobalTheme,
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
