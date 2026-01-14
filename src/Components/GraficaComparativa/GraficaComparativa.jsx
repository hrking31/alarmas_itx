import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ref, onValue} from "firebase/database";
import { database } from "../../Firebase/Firebase.js";
import { useDarkMode } from "../../Context/DarkModeContext";

// Colores neón para identificar cada sala
const COLORES_SALAS = {
  Sala_1: "#22d3ee", // Cian
  Sala_2: "#818cf8", // Indigo
  Sala_3: "#f472b6", // Rosa
  Sala_4: "#fbbf24", // Ámbar
};

export default function GraficaComparativa() {
  const [datosGrafica, setDatosGrafica] = useState([]);
  const [horas, setHoras] = useState(1);
  const { darkMode } = useDarkMode();
  const isDark = darkMode;

  // Leer configuración de horas visibles
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

  // Leer datos de la gráfica con FILTRO DE TIEMPO REAL
  useEffect(() => {
    const historialRef = ref(database, "grafica");

    // Cálculo del tiempo de corte (Ahora - N horas)
    const ahora = Date.now();
    const tiempoCorte = ahora - horas * 3600 * 1000;

    // Nota: Para filtrar múltiples salas simultáneamente en la raíz "grafica",
    // Firebase requiere que cada hijo tenga un índice. Si no puedes indexar todo,
    const unsubscribe = onValue(historialRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setDatosGrafica([]);
        return;
      }

      const mapa = {};

      Object.keys(data).forEach((salaId) => {
        Object.values(data[salaId] || {}).forEach((registro) => {
          // Solo incluir si el ts es mayor al tiempo de corte
          if (
            !registro?.ts ||
            registro.ts < tiempoCorte ||
            registro.t === undefined
          )
            return;

          const minutoTs = Math.floor(registro.ts / 60000) * 60000;
          const fecha = new Date(minutoTs);

          if (!mapa[minutoTs]) {
            mapa[minutoTs] = {
              ts: minutoTs,
              hora: fecha.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              }),
            };
          }
          mapa[minutoTs][salaId] = registro.t;
        });
      });

      // Ordenar por timestamp real
      const listaOrdenada = Object.values(mapa).sort((a, b) => a.ts - b.ts);
      setDatosGrafica(listaOrdenada);
    });

    return () => unsubscribe();
  }, [horas]);

  return (
    <div className="w-full h-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={datosGrafica}
          accessibilityLayer={false}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            {Object.keys(COLORES_SALAS).map((sala) => (
              <linearGradient
                key={sala}
                id={`grad_${sala}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={COLORES_SALAS[sala]}
                  stopOpacity={0.2}
                />
                <stop
                  offset="95%"
                  stopColor={COLORES_SALAS[sala]}
                  stopOpacity={0}
                />
              </linearGradient>
            ))}
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
          />
          <YAxis
            width={50}
            stroke="#475569"
            fontSize={10}
            domain={["auto", "auto"]}
            // tickLine={false}
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
              borderRadius: "12px",
            }}
            labelStyle={{
              color: isDark ? "#cbd5f5" : "#475569",
              fontSize: 12,
              fontWeight: "bold",
            }}
            itemStyle={{ fontWeight: "bold" }}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: "10px", paddingTop: "10px" }}
          />

          {/* Creamos una línea por cada sala configurada */}
          {Object.keys(COLORES_SALAS).map((salaId) => (
            <Area
              key={salaId}
              type="monotone"
              dataKey={salaId}
              stroke={COLORES_SALAS[salaId]}
              fill={`url(#grad_${salaId})`}
              strokeWidth={2}
              connectNulls={false}
              dot={{ r: 1 }}
              isAnimationActive={false}
              style={{ pointerEvents: "none" }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
