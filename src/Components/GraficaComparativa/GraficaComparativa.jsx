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
import { ref, onValue } from "firebase/database";
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

  useEffect(() => {
    const hoy = new Date().toLocaleDateString("sv-SE");
    const ahora = Date.now();
    const tsInicioVentana = ahora - horas * 3600 * 1000;

    // Usaremos un objeto para almacenar los datos crudos de cada sala
    const datosPorSala = { Sala_1: [], Sala_2: [], Sala_3: [], Sala_4: [] };
    const salas = Object.keys(datosPorSala);

    const unsubscribes = salas.map((salaId) => {
      const salaDiaRef = ref(database, `grafica/${salaId}/${hoy}`);

      return onValue(salaDiaRef, (snapshot) => {
        const data = snapshot.val() || {};
        const registrosProcesados = [];
        let ultimoTs = 0;
        const UMBRAL_MS = 2 * 60 * 1000;

        // 1. Extraer y aplanar registros de las carpetas de horas
        const registrosCrudos = [];
        Object.values(data).forEach((horaNode) => {
          if (horaNode) {
            Object.values(horaNode).forEach((reg) => {
              if (reg.ts && reg.ts >= tsInicioVentana) {
                registrosCrudos.push(reg);
              }
            });
          }
        });

        // 2. Ordenar registros de esta sala
        registrosCrudos.sort((a, b) => a.ts - b.ts);

        // 3. Procesar con detección de huecos (null)
        registrosCrudos.forEach((reg) => {
          if (ultimoTs > 0 && reg.ts - ultimoTs > UMBRAL_MS) {
            // Insertar punto de ruptura
            registrosProcesados.push({ ts: ultimoTs + 60000, t: null });
          }
          registrosProcesados.push({ ts: reg.ts, t: reg.t });
          ultimoTs = reg.ts;
        });

        // Guardar en nuestro almacén temporal
        datosPorSala[salaId] = registrosProcesados;

        // 4. UNIFICAR TODAS LAS SALAS EN EL MAPA DE LA GRÁFICA
        const nuevoMapa = {};

        salas.forEach((id) => {
          datosPorSala[id].forEach((punto) => {
            // Agrupar por minuto para que Recharts alinee los puntos
            const minutoTs = Math.floor(punto.ts / 60000) * 60000;
            if (!nuevoMapa[minutoTs]) {
              nuevoMapa[minutoTs] = {
                ts: minutoTs,
                hora: new Date(minutoTs).toLocaleTimeString("es-CO", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                }),
              };
            }
            nuevoMapa[minutoTs][id] = punto.t;
          });
        });

        setDatosGrafica(Object.values(nuevoMapa).sort((a, b) => a.ts - b.ts));
      });
    });

    return () => unsubscribes.forEach((u) => u());
  }, [horas]);

  return (
    <div className="w-full h-full p-2">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={200}
        initialDimension={{ width: 500, height: 300 }}
      >
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
              type="basis"
              dataKey={salaId}
              stroke={COLORES_SALAS[salaId]}
              fill={`url(#grad_${salaId})`}
              strokeWidth={2}
              connectNulls={false}
              dot={false}
              isAnimationActive={false}
              style={{ pointerEvents: "none" }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
