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
import { ref, onChildAdded, query, limitToLast } from "firebase/database";
import { database } from "../../Firebase/Firebase.js";
import { useDarkMode } from "../../Context/DarkModeContext";

export default function GraficaTiempoReal({ salaId, isPortrait }) {
  const [datos, setDatos] = useState([]);
  const { darkMode } = useDarkMode();
  const isDark = darkMode;

  // useEffect(() => {
  //   // Obtener la fecha de hoy para el nodo
  //   const hoyLocal = new Date()
  //     .toLocaleString("sv-SE", {
  //       timeZone: "America/Bogota",
  //     })
  //     .split(" ")[0];

  //   const historialRef = ref(database, `grafica/${salaId}/${hoyLocal}`);

  //   //Traer los últimos 60 puntos (la última hora)
  //   const consulta = query(historialRef, limitToLast(60));

  //   // Escuchar cada vez que sensor escriba un punto nuevo
  //   const unsubscribe = onChildAdded(consulta, (snapshot) => {
  //     const nuevaLectura = {
  //       hora: new Date(Number(snapshot.key)).toLocaleTimeString("es-CO", {
  //         hour: "numeric",
  //         minute: "2-digit",
  //       }),

  //       temp: snapshot.val().t,
  //     };

  //     setDatos((prev) => {
  //       // Evitamos duplicados por el StrictMode de React
  //       if (prev.find((d) => d.hora === nuevaLectura.hora)) return prev;
  //       return [...prev, nuevaLectura];
  //     });
  //   });

  //   return () => unsubscribe();
  // }, [salaId]);

  useEffect(() => {
    const historialRef = ref(database, `grafica/${salaId}`);

    // Últimos 60 puntos ( última hora )
    const consulta = query(historialRef, limitToLast(60));

    const unsubscribe = onChildAdded(consulta, (snapshot) => {
      const registro = snapshot.val();
      if (!registro?.ts || registro.t === undefined) return;

      const fecha = new Date(registro.ts);

      const nuevaLectura = {
        hora: fecha.toLocaleTimeString("es-CO", {
          timeZone: "America/Bogota",
          hour: "numeric",
          minute: "2-digit",
        }),
        temp: registro.t,
      };

      setDatos((prev) => {
        // Evitar duplicados (StrictMode React)
        if (
          prev.some(
            (d) => d.hora === nuevaLectura.hora && d.temp === nuevaLectura.temp
          )
        ) {
          return prev;
        }
        return [...prev, nuevaLectura];
      });
    });

    return () => unsubscribe();
  }, [salaId]);

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
