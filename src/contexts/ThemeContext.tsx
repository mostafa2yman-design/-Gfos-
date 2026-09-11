import React, { createContext, useContext, useState, useEffect } from "react";

type ThemeColor = "indigo" | "orange" | "blue" | "emerald" | "slate";
type ThemeRadius = "none" | "sm" | "md" | "lg" | "full";

interface ThemeContextType {
  color: ThemeColor;
  setColor: (color: ThemeColor) => void;
  radius: ThemeRadius;
  setRadius: (radius: ThemeRadius) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [color, setColor] = useState<ThemeColor>("orange");
  const [radius, setRadius] = useState<ThemeRadius>("lg");

  useEffect(() => {
    const savedColor = localStorage.getItem("ui-theme-color") as ThemeColor;
    const savedRadius = localStorage.getItem("ui-theme-radius") as ThemeRadius;
    if (savedColor) setColor(savedColor);
    if (savedRadius) setRadius(savedRadius);
  }, []);

  const handleSetColor = (c: ThemeColor) => {
    setColor(c);
    localStorage.setItem("ui-theme-color", c);
  };

  const handleSetRadius = (r: ThemeRadius) => {
    setRadius(r);
    localStorage.setItem("ui-theme-radius", r);
  };

  return (
    <ThemeContext.Provider value={{ color, setColor: handleSetColor, radius, setRadius: handleSetRadius }}>
      <div data-theme-color={color} data-theme-radius={radius} className="w-full h-full min-h-screen">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
