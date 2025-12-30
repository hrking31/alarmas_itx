import { createContext, useContext, useState, useCallback } from "react";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [notif, setNotif] = useState({
    open: false,
    type: "info",
    message: "",
    onConfirm: null,
    onCancel: null,
  });

  // Usamos useCallback para que la función sea estable si se usa en useEffects externos
  const closeNotif = useCallback(() => {
    setNotif((prev) => ({ ...prev, open: false }));
  }, []);

  const showNotif = (type, message) => {
    // Primero cerramos cualquier notificación abierta para reiniciar la animación
    setNotif({ open: false, type, message, onConfirm: null, onCancel: null });

    // Un pequeño timeout permite que React procese el cierre y luego la apertura con animación
    setTimeout(() => {
      setNotif({
        open: true,
        type,
        message,
        onConfirm: null,
        onCancel: null,
      });
    }, 10);
  };

  const confirmAction = (message) => {
    return new Promise((resolve) => {
      setNotif({
        open: true,
        type: "confirm",
        message,
        onConfirm: () => {
          resolve(true);
          closeNotif();
        },
        onCancel: () => {
          resolve(false);
          closeNotif();
        },
      });
    });
  };

  return (
    <AppContext.Provider
      value={{
        notif,
        setNotif,
        showNotif,
        confirmAction,
        closeNotif, // Es importante exportar también la función de cierre
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
