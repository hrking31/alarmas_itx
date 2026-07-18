import { createContext, useContext, useEffect, useState } from "react";

// eslint-disable-next-line react-refresh/only-export-components -- contexto + hook junto al provider; separarlo obligaría a tocar los imports de varios componentes por una mejora menor de hot-reload en desarrollo
export const DarkModeContext = createContext(null);
// eslint-disable-next-line react-refresh/only-export-components -- ver nota arriba
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
