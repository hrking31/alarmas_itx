import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../Firebase/Firebase";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Iniciar sesión
  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  // Cerrar sesión
  const logout = () => signOut(auth);

  useEffect(() => {
    // onAuthStateChanged devuelve el usuario si hay sesión o null si no
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ login, logout, user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}