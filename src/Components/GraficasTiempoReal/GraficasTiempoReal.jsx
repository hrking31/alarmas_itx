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

export default function GraficaTiempoReal({
  salaId,
  isPortrait,
  fechaSeleccionada,
}) {
  const [datos, setDatos] = useState([]);
  const { darkMode } = useDarkMode();
  const isDark = darkMode;

  useEffect(() => {
    // La ruta apunta directamente al día seleccionado
    const historialRef = ref(
      database,
      `grafica/${salaId}/${fechaSeleccionada}`,
    );

    setDatos([]);

    const unsubscribe = onValue(historialRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setDatos([]); // Limpiar si no hay datos en ese día
        return;
      }

      const registrosExtraidos = [];

      // Recorremos las carpetas de las horas (00, 01, 02...)
      Object.keys(data).forEach((hora) => {
        const registrosDeEsaHora = data[hora];
        if (registrosDeEsaHora) {
          // En esta estructura, dentro de la hora ya están los registros directos
          Object.values(registrosDeEsaHora).forEach((reg) => {
            registrosExtraidos.push(reg);
          });
        }
      });

      // Se convierte a array y se ordena por ts
      const registros = registrosExtraidos.sort((a, b) => a.ts - b.ts);
      const listaProcesada = [];
      const UMBRAL_MS = 2 * 60 * 1000; // 2 minutos

      registros.forEach((reg, index) => {
        // comparar con el registro anterior
        if (index > 0) {
          const diferencia = reg.ts - registros[index - 1].ts;

          if (diferencia > UMBRAL_MS) {
            // Se inserta un punto null para romper la línea
            listaProcesada.push({
              ts: registros[index - 1].ts + 1000,
              hora: "",
              temp: null,
            });
          }
        }

        listaProcesada.push({
          ts: reg.ts,
          hora: new Date(reg.ts).toLocaleTimeString("es-CO", {
            hour: "numeric",
            minute: "2-digit",
          }),
          temp: reg.t === "null" ? null : reg.t, // desconexiones
        });
      });

      setDatos(listaProcesada);
    });

    return () => unsubscribe();
  }, [salaId, fechaSeleccionada]); // Se dispara al cambiar de sala o de día

  return (
    <div
      className={`w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-3xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/5 ${isPortrait ? "h-80" : "h-full"}`}
    >
      <ResponsiveContainer width="100%" height="100%">
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
