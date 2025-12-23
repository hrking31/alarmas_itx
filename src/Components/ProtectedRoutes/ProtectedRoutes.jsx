import { Navigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext"; 

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth(); 

  if (loading) return <p className="text-white">Cargando sistema...</p>;

  // Si no hay usuario, lo manda al Login automáticamente
  if (!user) {
    return <Navigate to="/" />;
  }

  return children;
};
