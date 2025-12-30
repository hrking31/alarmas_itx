import { Navigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import Loading from "../Loading/Loading";

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <Loading text="Cargando sistema..." />;

  // Si no hay usuario, lo manda al Login automáticamente
  if (!user) {
    return <Navigate to="/" />;
  }

  return children;
};
