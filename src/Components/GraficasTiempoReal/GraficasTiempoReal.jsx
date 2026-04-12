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
import { ref, onValue } from "firebase/database";
import { doc, getDoc } from "firebase/firestore";
import { database, firestore } from "../../Firebase/Firebase.js";
import { useDarkMode } from "../../Context/DarkModeContext";
import { useNotificationContext } from "../../Context/NotificationContext.jsx";
import Loading from "../Loading/Loading.jsx";

export default function GraficaTiempoReal({
  salaId,
  isPortrait,
  fechaSeleccionada,
}) {
  const [datos, setDatos] = useState([]);
  const { darkMode } = useDarkMode();
  const isDark = darkMode;
  const { showNotif } = useNotificationContext();
  const [loading, setLoading] = useState(true);

  // Función para procesar los registros RTDB o Firestore y detectar desconexiones
  const procesarRegistros = (registrosBrutos) => {
    if (!registrosBrutos || registrosBrutos.length === 0) return [];

    const mapa = {};

    registrosBrutos.forEach((reg) => {
      const minutoTs = Math.floor(reg.ts / 60000) * 60000;

      if (!mapa[minutoTs]) {
        mapa[minutoTs] = {
          ts: minutoTs,
          hora: new Date(minutoTs).toLocaleTimeString("es-CO", {
            hour: "numeric",
            minute: "2-digit",
          }),
          temp: null,
        };
      }

      mapa[minutoTs].temp =
        reg.t === "null" || reg.t === undefined ? (reg.temp ?? null) : reg.t;
    });

    return Object.values(mapa).sort((a, b) => a.ts - b.ts);
  };

  const completarHuecos = (data) => {
    if (!data.length) return [];

    const resultado = [];

    for (let i = 0; i < data.length - 1; i++) {
      resultado.push(data[i]);

      const actual = data[i].ts;
      const siguiente = data[i + 1].ts;

      if (siguiente - actual > 60000) {
        let cursor = actual + 60000;

        while (cursor < siguiente) {
          resultado.push({
            ts: cursor,
            hora: new Date(cursor).toLocaleTimeString("es-CO", {
              hour: "numeric",
              minute: "2-digit",
            }),
            temp: null,
          });
          cursor += 60000;
        }
      }
    }

    resultado.push(data[data.length - 1]);
    return resultado;
  };

  useEffect(() => {
    setLoading(true);
    setDatos([]);

    // Se ajusta a la zona horaria de Colombia
    const obtenerFechaLocal = () => {
      const ahora = new Date();
      const offset = ahora.getTimezoneOffset() * 60000;
      const localISOTime = new Date(ahora - offset).toISOString().split("T")[0];
      return localISOTime;
    };

    // La fecha seleccionada es HOY
    const hoy = obtenerFechaLocal();
    const esHoy = fechaSeleccionada === hoy;

    if (esHoy) {
      // --- RTDB (TIEMPO REAL) ---
      const historialRef = ref(
        database,
        `grafica/${salaId}/${fechaSeleccionada}`,
      );

      const unsubscribe = onValue(historialRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
          setDatos([]);
          setLoading(false);
          return;
        }

        const registrosExtraidos = [];
        Object.keys(data).forEach((hora) => {
          const registrosDeEsaHora = data[hora];
          if (registrosDeEsaHora) {
            Object.values(registrosDeEsaHora).forEach((reg) => {
              registrosExtraidos.push(reg);
            });
          }
        });

        const base = procesarRegistros(registrosExtraidos);
        const conHuecos = completarHuecos(base);

        setDatos(conHuecos);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      // --- FIRESTORE (HISTÓRICO) ---
      const cargarHistoricoFS = async () => {
        try {
          // El ID del documento Sala_Fecha
          const docRef = doc(
            firestore,
            "historicos",
            `${salaId}_${fechaSeleccionada}`,
          );
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            const base = procesarRegistros(data.lecturas);
            const conHuecos = completarHuecos(base);

            setDatos(conHuecos);
          } else {
            showNotif(
              "info",
              "SCAN: No se encontraron registros para la fecha seleccionada",
            );
            setDatos([]);
          }
        } catch (error) {
          showNotif("error", "FALLO DE SISTEMA: Error cargando históricos:");
          setDatos([]);
        } finally {
          setLoading(false);
        }
      };

      cargarHistoricoFS();
    }
  }, [salaId, fechaSeleccionada]);

  return (
    <div
      className={`w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-3xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/5 ${isPortrait ? "h-80" : "h-full"}`}
    >
      {loading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-sm rounded-3xl">
          <Loading text="ACCEDIENDO A ARCHIVOS HISTÓRICOS..." />
        </div>
      ) : datos.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
            Sin transmisión de datos
          </p>
        </div>
      ) : null}

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
