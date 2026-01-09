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

export default function GraficaTiempoReal({ salaId }) {
  const [datos, setDatos] = useState([]);

  useEffect(() => {
    // Obtener la fecha de hoy para el nodo
    const hoyLocal = new Date()
      .toLocaleString("sv-SE", {
        timeZone: "America/Bogota",
      })
      .split(" ")[0];

    const historialRef = ref(database, `grafica/${salaId}/${hoyLocal}`);

    //Traer los últimos 60 puntos (la última hora)
    const consulta = query(historialRef, limitToLast(60));

    // Escuchar cada vez que sensor escriba un punto nuevo
    const unsubscribe = onChildAdded(consulta, (snapshot) => {
      const nuevaLectura = {
        hora: new Date(Number(snapshot.key)).toLocaleTimeString("es-CO", {
          hour: "numeric",
          minute: "2-digit",
        }),

        temp: snapshot.val().t,
      };

      setDatos((prev) => {
        // Evitamos duplicados por el StrictMode de React
        if (prev.find((d) => d.hora === nuevaLectura.hora)) return prev;
        return [...prev, nuevaLectura];
      });
    });

    return () => unsubscribe();
  }, [salaId]);

  console.log("gra", datos);
  return (
    <div className="w-full h-80 bg-slate-950 p-4 rounded-2xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/5">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={datos}>
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
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "8px",
            }}
            labelStyle={{
              color: "#e5e7eb",
              fontSize: 12,
              fontWeight: "bold",
            }}
            itemStyle={{ color: "#22d3ee", fontWeight: "bold" }}
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
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
