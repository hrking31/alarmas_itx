import { Navigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext"; // Ajusta la ruta a tu AuthContext

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth(); // Asumiendo que tu contexto exporta 'user' y 'loading'

  if (loading) return <p className="text-white">Cargando sistema...</p>;

  // Si no hay usuario, lo manda al Login automáticamente
  if (!user) {
    return <Navigate to="/" />;
  }

  return children;
};
