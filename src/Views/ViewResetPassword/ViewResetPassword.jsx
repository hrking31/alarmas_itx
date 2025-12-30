import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../Firebase/Firebase.js";
import { useNavigate } from "react-router-dom";
import Footer from "../../Components/Footer/Footer.jsx";
import { FaShieldAlt } from "react-icons/fa";

export default function ViewResetPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(
        "✅ Si existe una cuenta asociada a este correo, recibirás un enlace de recuperación."
      );
      setTimeout(() => navigate("/ViewLogin"), 3000);
    } catch (err) {
      console.log("🔥 Error Firebase:", err.code, err.message);
      const errorMessages = {
        "auth/missing-email": "Debes ingresar un correo electrónico.",
        "auth/invalid-email": "El formato del correo es inválido.",
        "auth/too-many-requests": "Demasiados intentos. Intenta más tarde.",
        "auth/network-request-failed": "Error de conexión. Revisa tu red.",
      };
      setError(
        errorMessages[err.code] || "Error al enviar el correo de recuperación."
      );
    }
  };

  return (
    <div className="min-h-svh h-svh flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500 overflow-hidden">
      <div className="flex-1 flex items-center justify-center px-4 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl -z-10"></div>

        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="inline-flex p-4 rounded-3xl bg-white dark:bg-emerald-500/10 border border-slate-200 dark:border-emerald-500/20 mb-4 shadow-sm">
              <FaShieldAlt className="text-4xl text-emerald-600 dark:text-emerald-500 animate-pulse" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-slate-800 dark:text-white leading-none">
              Restablecer
              <span className="text-emerald-600 dark:text-emerald-500">
                Acceso
              </span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-3">
              Verificación de Protocolo
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl dark:shadow-2xl dark:shadow-black/50 relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-0.5 bg-linear-to-r from-transparent via-emerald-500 to-transparent"></div>

            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@terminal.com"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-mono text-slate-900 dark:text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white dark:text-slate-950 font-black py-3.5 rounded-xl text-[11px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-emerald-500/20 active:scale-95 mt-2"
              >
                Enviar Enlace
              </button>
            </form>

            {message && (
              <div className="mt-4 p-3 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-bold text-emerald-600 dark:text-emerald-400 text-center leading-relaxed">
                {message}
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-bold text-red-600 dark:text-red-400 text-center">
                {error}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/50">
              <button
                onClick={() => navigate("/ViewLogin")}
                className="w-full text-[9px] font-black text-slate-400 dark:text-slate-600 hover:text-emerald-600 dark:hover:text-emerald-500 uppercase tracking-widest transition-colors"
              >
                Volver al inicio de sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer className="shrink-0" />
    </div>
  );
}
