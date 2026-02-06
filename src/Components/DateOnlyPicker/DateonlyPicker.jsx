import { useRef } from "react";
import { useDarkMode } from "../../Context/DarkModeContext";
import { FaChevronLeft, FaChevronRight, FaCalendarAlt } from "react-icons/fa";

export default function DateOnlyPicker({
  fechaSeleccionada,
  setFechaSeleccionada,
  soloIcono = false,
}) {
  const inputRef = useRef(null);
  const { darkMode } = useDarkMode();
  const cambiarDia = (offset) => {
    const [y, m, d] = fechaSeleccionada.split("-").map(Number);
    const fecha = new Date(y, m - 1, d);

    fecha.setDate(fecha.getDate() + offset);

    setFechaSeleccionada(fecha.toLocaleDateString("sv-SE"));
  };

  const formatFechaCorta = (fechaSeleccionada) => {
    if (!fechaSeleccionada) return "";

    const [y, m, d] = fechaSeleccionada.split("-").map(Number);
    const fecha = new Date(y, m - 1, d);

    const dia = fecha.getDate();
    const mes = fecha
      .toLocaleDateString("es-CO", { month: "short" })
      .replace(".", "") // quita punto si el navegador lo agrega
      .toLowerCase();

    return `${dia}/${mes}`;
  };

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => cambiarDia(-1)}
        className="p-1.5 bg-slate-200 dark:bg-slate-800 rounded-md text-slate-400 dark:text-cyan-400"
      >
        <FaChevronLeft size={10} />
      </button>

      {/* Texto visible */}
      <button
        onClick={() => inputRef.current?.showPicker?.()}
        className="flex items-center justify-center gap-2 text-[10px] font-bold
             text-slate-400 dark:text-cyan-400 cursor-pointer select-none"
      >
        {soloIcono ? formatFechaCorta(fechaSeleccionada) : fechaSeleccionada}
        {!soloIcono && (
          <FaCalendarAlt
            size={10}
            className="text-slate-400 dark:text-cyan-400"
          />
        )}
      </button>

      {/* Input oculto */}
      <input
        ref={inputRef}
        type="date"
        value={fechaSeleccionada}
        onChange={(e) => setFechaSeleccionada(e.target.value)}
        className="absolute opacity-0  pointer-events-none"
        style={{ colorScheme: darkMode ? "dark" : "light" }}
      />

      <button
        onClick={() => cambiarDia(1)}
        disabled={fechaSeleccionada === new Date().toLocaleDateString("sv-SE")}
        className="p-1.5 bg-slate-200 dark:bg-slate-800 rounded-md text-slate-400 dark:text-cyan-400 disabled:opacity-20"
      >
        <FaChevronRight size={10} />
      </button>
    </div>
  );
}
