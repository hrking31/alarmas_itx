import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./Context/AuthContext.jsx";
import { AppProvider } from "./Context/AppContext.jsx";
import { DarkModeProvider } from "./Context/DarkModeContext";

import Notificaciones from "./Components/Notificaciones/Notificaciones.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <DarkModeProvider>
      <AuthProvider>
        <AppProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
          <Notificaciones />
        </AppProvider>
      </AuthProvider>
    </DarkModeProvider>
  </StrictMode>
);
