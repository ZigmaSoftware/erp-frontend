import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type Theme = "light" | "dark";

type ThemePalette = {
  primary: string;
  primaryHover: string;
  primarySoft: string;
  primaryGradient: string;
  accent: string;
  accentHover: string;
  accentSoft: string;
  surface: string;
  surfaceMuted: string;
  surfaceAlt: string;
  border: string;
  text: string;
  mutedText: string;
  cardShadow: string;
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  palette: ThemePalette;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/* --------------------------------------------------------
   🌿 PASTEL GREEN THEME
-------------------------------------------------------- */
const THEME_PALETTES: Record<Theme, ThemePalette> = {
  light: {
    primary: "#4CAF93",          // soft green
    primaryHover: "#3f9e84",
    primarySoft: "#e7f6f1",
    primaryGradient: "#6bc4a8",
    accent: "#6bc4a8",
    accentHover: "#58b39a",
    accentSoft: "#e3f5ef",
    surface: "#f3fbf8",
    surfaceMuted: "#eaf6f1",
    surfaceAlt: "#ffffff",
    border: "#cfe9df",
    text: "#0f2f26",
    mutedText: "#5f7f75",
    cardShadow: "0 14px 35px rgba(76, 175, 147, 0.18)",
  },

dark: {
  primary: "#6fdcc0",           // mint accent (used sparingly)
  primaryHover: "#8be6cd",
  primarySoft: "rgba(111, 220, 192, 0.16)",
  primaryGradient: "#54cfae",

  accent: "#8be6cd",
  accentHover: "#a6f0da",
  accentSoft: "rgba(111, 220, 192, 0.22)",

  // SURFACES — neutral, not green
  surface: "#0f172a",           // deep slate (main bg)
  surfaceMuted: "#162036",      // cards / header
  surfaceAlt: "#1e293b",        // elevated panels

  border: "#24324d",            // subtle cool border

  // TEXT
  text: "#e5f9f2",              // soft white
  mutedText: "#9fcfc2",

  // SHADOW
  cardShadow: "0 18px 40px rgba(0, 0, 0, 0.55)",
},

};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("iwms-theme");
    return (saved as Theme) || "light";
  });

  const palette = useMemo(() => THEME_PALETTES[theme], [theme]);

  useEffect(() => {
    localStorage.setItem("iwms-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(palette).forEach(([token, value]) => {
      root.style.setProperty(`--admin-${token}`, value);
    });
  }, [palette]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, palette }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}