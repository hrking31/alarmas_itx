import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ref, onValue, query, orderByChild } from "firebase/database";
import { database } from "../../Firebase/Firebase.js";
import { useDarkMode } from "../../Context/DarkModeContext";

export default function GraficaTiempoReal({ salaId, isPortrait }) {
  const [datos, setDatos] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split("T")[0],
  );
  const { darkMode } = useDarkMode();
  const isDark = darkMode;

  useEffect(() => {
    // La ruta ahora apunta directamente al día seleccionado
    const historialRef = ref(
      database,
      `grafica/${salaId}/${fechaSeleccionada}`,
    );

    const consulta = query(historialRef, orderByChild("ts"));

    setDatos([]);

    const unsubscribe = onValue(consulta, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setDatos([]); // Limpiar si no hay datos en ese día
        return;
      }

      const listaProcesada = Object.values(data)
        .map((reg) => ({
          ts: reg.ts,
          hora: new Date(reg.ts).toLocaleTimeString("es-CO", {
            hour: "numeric",
            minute: "2-digit",
          }),
          temp: reg.t === "null" ? null : reg.t, // Manejo profesional de desconexiones
        }))
        .sort((a, b) => a.ts - b.ts);

      setDatos(listaProcesada);
    });

    return () => unsubscribe();
  }, [salaId, fechaSeleccionada]); // CAMBIO: Se dispara al cambiar de sala o de día

  return (
    <div
      className={`w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-3xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/5 ${isPortrait ? "h-80" : "h-full"}`}
    >
      {/* Selector de fecha */}
      <div className="flex justify-between items-center mb-4 px-2">
        <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">
          Historial{" "}
          {fechaSeleccionada === new Date().toISOString().split("T")[0]
            ? "Tiempo Real"
            : "Archivo"}
        </span>
        <input
          type="date"
          value={fechaSeleccionada}
          onChange={(e) => setFechaSeleccionada(e.target.value)}
          className="bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 p-1 rounded-lg border-none focus:ring-1 focus:ring-cyan-500 outline-none"
        />
      </div>

      <ResponsiveContainer width="100%" height="90%">
        <AreaChart data={datos} accessibilityLayer={false}>
          <defs>
            {/* Gradiente para el efecto neón debajo de la línea */}
            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke={isDark ? "#1e293b" : "#e2e8f0"}
            vertical={false}
          />

          <XAxis
            dataKey="hora"
            stroke="#475569"
            fontSize={10}
            minTickGap={30}
          />

          <YAxis
            width={30}
            stroke="#475569"
            fontSize={10}
            domain={["auto", "auto"]}
          />

          <Tooltip
            cursor={{
              stroke: "#06b6d4",
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
            contentStyle={{
              backgroundColor: isDark ? "#0f172a" : "#ffffff",
              border: "1px solid #1e293b",
              borderRadius: "8px",
            }}
            labelStyle={{
              color: isDark ? "#cbd5f5" : "#475569",
              fontSize: 12,
              fontWeight: "bold",
            }}
            itemStyle={{ fontWeight: "bold" }}
          />

          <Area
            type="monotone"
            dataKey="temp"
            stroke="#22d3ee"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorTemp)"
            isAnimationActive={true}
            animationDuration={1000}
            connectNulls={false}
            dot={false}
            style={{ pointerEvents: "none" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
