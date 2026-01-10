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

  // useEffect(() => {
  //   // Fecha de hoy
  //   const hoyLocal = new Date()
  //     .toLocaleString("sv-SE", { timeZone: "America/Bogota" })
  //     .split(" ")[0];

  //   const historialRef = ref(database, `grafica`);

  //   const unsubscribe = onValue(historialRef, (snapshot) => {
  //     const data = snapshot.val();
  //     if (!data) return;

  //     const mapaPorHora = {};

  //     Object.keys(data).forEach((salaId) => {
  //       const registrosDia = data[salaId]?.[hoyLocal];
  //       if (registrosDia) {
  //         Object.keys(registrosDia).forEach((ts) => {
  //           const registro = registrosDia[ts];
  //           const fecha = new Date(Number(ts)); // timestamp en ms → Date

  //           // Hora en formato HH:MM
  //           const horaFormateada = fecha.toLocaleTimeString("sv-SE", {
  //             timeZone: "America/Bogota",
  //             hour: "2-digit",
  //             minute: "2-digit",
  //           });

  //           // 12h para mostrar en la gráfica
  //           const etiqueta12h = fecha.toLocaleTimeString("en-US", {
  //             timeZone: "America/Bogota",
  //             hour: "numeric", // "3" en lugar de "03"
  //             minute: "2-digit",
  //             hour12: true,
  //           });

  //           if (!mapaPorHora[horaFormateada]) {
  //             mapaPorHora[horaFormateada] = {
  //               horaRaw: horaFormateada,
  //               hora: etiqueta12h,
  //             };
  //           }

  //           // Asignamos la temperatura
  //           mapaPorHora[horaFormateada][salaId] = registro.t;
  //         });
  //       }
  //     });

  //     // Convertimos a array y ordenamos
  //     const listaOrdenada = Object.values(mapaPorHora).sort((a, b) =>
  //       a.horaRaw.localeCompare(b.horaRaw)
  //     );

  //     setDatosGrafica(listaOrdenada.slice(-480)); // Últimas 8 horas
  //   });

  //   return () => unsubscribe();
  // }, []);

  // Leer configuración de horas desde Firebase
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

  // Calcular puntos según horas visibles y frecuencia ESP
  const intervaloSegundos = 60;
  const puntos = Math.ceil((horas * 3600) / intervaloSegundos);

  // Leer datos de la gráfica
  useEffect(() => {
    const historialRef = ref(database, "grafica");

    const unsubscribe = onValue(historialRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const mapaPorHora = {};

      // Recorremos salas
      Object.keys(data).forEach((salaId) => {
        const registrosSala = data[salaId];
        if (!registrosSala) return;

        // Recorremos push IDs
        Object.values(registrosSala).forEach((registro) => {
          if (!registro?.ts || registro.t === undefined) return;

          const fecha = new Date(registro.ts);

          // HH:MM para agrupar
          const horaFormateada = fecha.toLocaleTimeString("sv-SE", {
            timeZone: "America/Bogota",
            hour: "2-digit",
            minute: "2-digit",
          });

          // 12h para mostrar
          const etiqueta12h = fecha.toLocaleTimeString("en-US", {
            timeZone: "America/Bogota",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });

          if (!mapaPorHora[horaFormateada]) {
            mapaPorHora[horaFormateada] = {
              horaRaw: horaFormateada,
              hora: etiqueta12h,
            };
          }

          // Cada sala es una serie distinta
          mapaPorHora[horaFormateada][salaId] = registro.t;
        });
      });

      // Ordenar por hora
      const listaOrdenada = Object.values(mapaPorHora).sort((a, b) =>
        a.horaRaw.localeCompare(b.horaRaw)
      );

      // Últimas N horas para mostrar
      setDatosGrafica(listaOrdenada.slice(-puntos));
    });

    return () => unsubscribe();
  }, [horas]);

  return (
    <div className="w-full h-full p-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={datosGrafica}
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
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "12px",
            }}
            labelStyle={{
              color: "#e5e7eb",
              fontSize: 12,
              fontWeight: "bold",
            }}
            itemStyle={{ fontSize: "11px", fontWeight: "bold" }}
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
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
