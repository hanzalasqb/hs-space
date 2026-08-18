import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark";

export function applyThemeToRoot(theme: Theme, root: { classList: { add: (name: string) => void; remove: (name: string) => void } }) {
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  setTheme?: (theme: Theme) => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("theme-transitioning");
    applyThemeToRoot(theme, root);

    if (switchable) {
      localStorage.setItem("theme", theme);
    }
    const timer = window.setTimeout(() => root.classList.remove("theme-transitioning"), 320);
    return () => window.clearTimeout(timer);
  }, [theme, switchable]);

  const toggleTheme = switchable
    ? () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme: switchable ? setTheme : undefined, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
