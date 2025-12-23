import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaLock } from "react-icons/fa";
import { useAuth } from "../../Context/AuthContext.jsx";
import Footer from "../../Components/Footer/Footer.jsx";

export default function ViewLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [user, setUser] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = ({ target: { name, value } }) => {
    setUser((prev) => ({ ...prev, [name]: value }));
    setError("");
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!user.email || !user.password) {
      setError("Por favor ingresa tu correo y contraseña.");
      return;
    }

    setLoading(true);
    try {
      await login(user.email, user.password);
      navigate("/ControlDashboard");
    } catch (err) {
      const errorMessages = {
        "auth/invalid-email": "El formato del correo no es válido.",
        "auth/user-not-found": "No se encontró una cuenta con este correo.",
        "auth/wrong-password": "Contraseña incorrecta.",
        "auth/too-many-requests":
          "Demasiados intentos fallidos. Reintenta luego.",
        "auth/network-request-failed": "Error de red. Revisa tu conexión.",
        "auth/invalid-credential":
          "Credenciales inválidas. Verifica tus datos.",
      };
      setError(errorMessages[err.code] || "Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-svh flex flex-col bg-slate-950 text-slate-200 selection:bg-emerald-500/30">
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Decoración de fondo (Brillo neón sutil) */}
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>

        <div className="w-full max-w-md z-10 space-y-6">
          {/* Encabezado Estilo Sistema */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
              Acceso <span className="text-emerald-500">Remoto</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">
              Autenticación de Terminal v2.0
            </p>
          </div>

          {/* Caja de Formulario Estilo Dashboard */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-2xl relative group transition-all duration-500 hover:border-emerald-500/30">
            {/* Indicador visual de estado */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-0.5 bg-linear-to-r from-transparent via-emerald-500 to-transparent"></div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Input Correo */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="admin@sistema.com"
                  value={user.email}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-500 placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono text-sm"
                />
              </div>

              {/* Input Contraseña */}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">
                  Contraseña de Seguridad
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={user.password}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
                />
              </div>

              {/* Mensajes de Error con Estilo Alerta */}
              {error && (
                <div className="bg-red-500/10 border-l-2 border-red-500 p-2 animate-shake">
                  <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider">
                    {error}
                  </p>
                </div>
              )}

              {/* Botón Acción Principal */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 py-3 rounded-xl font-black uppercase tracking-widest transition-all duration-300 transform active:scale-95 disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FaLock className="w-4 h-4" />
                    Ingresar al Sistema
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-800 text-center">
              <button
                onClick={() => navigate("/ControlDashboard")}
                className="text-[10px] font-bold text-slate-500 hover:text-emerald-500 uppercase tracking-widest transition-colors"
              >
                ¿Perdiste tu clave de acceso?
              </button>
            </div>
          </div>

          {/* Registro Secundario */}
          <div className="text-center">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              ¿Nueva instalación?{" "}
              <button
                // onClick={() => navigate("/ViewRegister")}
                className="text-emerald-500 hover:text-white transition-colors underline underline-offset-4"
              >
                Registrar Iglesia
              </button>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}


