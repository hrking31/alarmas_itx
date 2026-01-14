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
import {
  ref,
  onValue,
  query,
  orderByChild,
  startAt,
} from "firebase/database";
import { database } from "../../Firebase/Firebase.js";
import { useDarkMode } from "../../Context/DarkModeContext";

export default function GraficaTiempoReal({ salaId, isPortrait }) {
  const [datos, setDatos] = useState([]);
  const [horas, setHoras] = useState(1);
  const { darkMode } = useDarkMode();
  const isDark = darkMode;

  //Leer configuración de horas visibles desde Firebase
  useEffect(() => {
    const horasRef = ref(database, "configuracion/horas/visible");
    const unsubscribe = onValue(horasRef, (snapshot) => {
      const value = Number(snapshot.val());
      if (!isNaN(value) && value > 0) {
        setHoras(value);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const historialRef = ref(database, `grafica/${salaId}`);

    // Calcular el tiempo exacto de "corte" (hace N horas)
    const ahora = Date.now();
    const tiempoCorte = ahora - horas * 3600 * 1000;

    // Nueva consulta: Ordenar por timestamp y empezar desde el tiempo de corte
    // Esto evita traer datos de hace varios días
    const consulta = query(
      historialRef,
      orderByChild("ts"),
      startAt(tiempoCorte)
    );

    // Limpiamos los datos antes de suscribirnos para no mezclar con sesiones anteriores
    setDatos([]);

    const unsubscribe = onValue(consulta, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const listaProcesada = Object.values(data)
        .map((reg) => ({
          ts: reg.ts,
          hora: new Date(reg.ts).toLocaleTimeString("es-CO", {
            hour: "numeric",
            minute: "2-digit",
          }),
          temp: reg.t,
        }))
        .sort((a, b) => a.ts - b.ts); // Ordenar cronológicamente

      setDatos(listaProcesada);
    });

    return () => unsubscribe();
  }, [salaId, horas]);

  return (
    <div
      className={`w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-3xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/5 ${
        isPortrait ? "h-80" : "h-full"
      }
        `}
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
            stroke="#1e293b"
            vertical={false}
          />

          <XAxis
            dataKey="hora"
            stroke="#475569"
            fontSize={10}
            // tickLine={false}
            // axisLine={false}
          />

          <YAxis
            width={30}
            stroke="#475569"
            fontSize={10}
            // tickLine={false}
            // axisLine={false}
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
            dot={{ r: 1 }}
            style={{ pointerEvents: "none" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
