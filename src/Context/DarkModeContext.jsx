import { createContext, useContext, useEffect, useState } from "react";

export const DarkModeContext = createContext(null);
export const useDarkMode = () => useContext(DarkModeContext);

export function DarkModeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    // Si 'saved' es null, devolvemos true (oscuro por defecto)
    return saved === null ? true : saved === "true";
  });

  useEffect(() => {
    // Guardamos el valor actual
    localStorage.setItem("darkMode", darkMode);

    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <DarkModeContext.Provider value={{ darkMode, setDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}
