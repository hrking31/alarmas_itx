import { useEffect } from "react";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimes,
  FaQuestionCircle,
} from "react-icons/fa";
import { useAppContext } from "../../Context/AppContext";

export default function Notificaciones() {
  const { notif, setNotif } = useAppContext();

  useEffect(() => {
    if (notif.open && notif.type !== "confirm") {
      const timer = setTimeout(() => setNotif({ ...notif, open: false }), 4000);
      return () => clearTimeout(timer);
    }
  }, [notif.open, notif.type, setNotif]);

  if (!notif.open) return null;

  const variants = {
    success:
      "border-green-400 text-green-500 dark:text-green-400 shadow-[0_0_10px_rgba(74,222,128,0.2)]",
    error:
      "border-red-500 text-red-600 dark:text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]",
    warning:
      "border-yellow-400 text-yellow-500 dark:text-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.2)]",
    info: "border-cyan-400 text-cyan-500 dark:text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]",
    confirm:
      "border-fuchsia-500 text-fuchsia-600 dark:text-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.3)]",
  };

  const icons = {
    success: <FaCheckCircle className="text-lg" />,
    error: <FaExclamationTriangle className="text-lg" />,
    warning: <FaExclamationTriangle className="text-lg" />,
    info: <FaInfoCircle className="text-lg" />,
    confirm: <FaQuestionCircle className="text-lg text-emerald-500" />,
  };

  return (
    <div
      className={`fixed z-100 flex flex-col gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-slide-in
        ${
          notif.type === "confirm"
            ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[320px] bg-white dark:bg-slate-900"
            : "bottom-6 right-6 left-6 md:left-auto md:w-80 bg-white/90 dark:bg-slate-900/90"
        } ${variants[notif.type]}`}
    >
      {/* CABECERA */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-current/10">{icons[notif.type]}</div>
        <span className="text-[10px] font-black uppercase tracking-wider flex-1">
          {notif.message}
        </span>

        {notif.type !== "confirm" && (
          <button
            onClick={() => setNotif({ ...notif, open: false })}
            className="p-1 hover:bg-current/10 rounded-md transition-colors text-slate-400"
          >
            <FaTimes />
          </button>
        )}
      </div>

      {/* BLOQUE DE CONFIRMACIÓN */}
      {notif.type === "confirm" && (
        <div className="flex flex-col gap-2 mt-2">
          <div className="h-px bg-slate-200 dark:bg-slate-800 w-full mb-2" />
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                notif.onConfirm?.();
                setNotif({ ...notif, open: false });
              }}
              className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:text-slate-950 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
            >
              Confirmar
            </button>
            <button
              onClick={() => {
                notif.onCancel?.();
                setNotif({ ...notif, open: false });
              }}
              className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* BARRA DE PROGRESO (SOLO AUTO-HIDE) */}
      {notif.type !== "confirm" && (
        <div className="absolute bottom-0 left-1.5 h-1 w-full overflow-hidden rounded-b-2xl">
          <div className="h-full bg-current opacity-30 animate-progress-timer" />
        </div>
      )}
    </div>
  );
}
