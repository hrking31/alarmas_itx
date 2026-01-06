import React, { useState, useEffect } from "react";
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

    //Traer los últimos 60 puntos (la última hora) para no saturar al inicio
    const consulta = query(historialRef, limitToLast(60));

    // Escuchar cada vez que sensor escriba un punto nuevo
    const unsubscribe = onChildAdded(consulta, (snapshot) => {
      const nuevaLectura = {
        hora: new Date(Number(snapshot.key)).toLocaleTimeString("es-CO", {
          hour: "2-digit",
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

  return (
    <div className="w-full h-80 bg-slate-950 p-4 rounded-2xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/5">
      <h3 className="text-cyan-400 font-black text-xs mb-4 tracking-tighter uppercase">
        Live Stream // {salaId.replace("_", " ")}
      </h3>

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
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            stroke="#475569"
            fontSize={10}
            tickLine={false}
            axisLine={false}
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

// import React, { useState, useEffect } from "react";
// import {
//   ResponsiveContainer,
//   AreaChart,
//   Area,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
// } from "recharts";
// import { ref, onChildAdded, query, limitToLast } from "firebase/database";
// import { database } from "../../Firebase/Firebase.js";

// export default function GraficaTiempoReal({ salaId }) {
//   const [datos, setDatos] = useState([]);
//   const [cargando, setCargando] = useState(true);

//   useEffect(() => {
//     if (!salaId) return;
//     setDatos([]);
//     setCargando(true);

//     // Obtenemos el año, mes y día local
//     const d = new Date();
//     const año = d.getFullYear();
//     const mes = String(d.getMonth() + 1).padStart(2, "0");
//     const dia = String(d.getDate()).padStart(2, "0");
//     const hoyLocal = `${año}-${mes}-${dia}`; // Resultado exacto: "2026-01-02"

//     const ruta = `historial/${salaId}/${hoyLocal}`;
//     console.log("Conectando a ruta local:", ruta);

//     const historialRef = ref(database, ruta);
//     // Traemos los últimos 50 para que la gráfica no esté vacía al iniciar
//     const consulta = query(historialRef, limitToLast(50));

//     const unsubscribe = onChildAdded(consulta, (snapshot) => {
//       const dataVal = snapshot.val();
//       if (dataVal) {
//         // Buscamos 't' o 'temperatura' según lo que envíe tu sensor
//         const tempFinal =
//           dataVal.t !== undefined ? dataVal.t : dataVal.temperatura;

//         const nuevaLectura = {
//           hora: snapshot.key.replace("-", ":"),
//           temp: tempFinal,
//         };

//         setDatos((prev) => {
//           if (prev.find((d) => d.hora === nuevaLectura.hora)) return prev;
//           return [...prev, nuevaLectura].slice(-50);
//         });
//         setCargando(false);
//       }
//     });

//     return () => unsubscribe();
//   }, [salaId]);

//   // useEffect(() => {
//   //   // 1. Si no hay salaId, no hacemos nada para evitar el error 'undefined'
//   //   if (!salaId) return;

//   //   // Limpiar datos al cambiar de sala
//   //   setDatos([]);

//   //   const hoy = "2026-01-02";
//   //   const historialRef = ref(database, `historial/${salaId}/${hoy}`);

//   //   // 2. Traer solo los últimos 60 puntos para que la gráfica sea fluida
//   //   const consulta = query(historialRef, limitToLast(60));

//   //   // 3. Listener de Firebase
//   //   const unsubscribe = onChildAdded(consulta, (snapshot) => {
//   //     // VALIDACIÓN: Si por alguna razón la key es nula, ignoramos este punto
//   //     const key = snapshot.key;
//   //     if (!key) return;

//   //     const dataVal = snapshot.val();
//   //     if (!dataVal) return;

//   //     const nuevaLectura = {
//   //       // Usamos una validación segura para el replace
//   //       hora: key.toString().includes("-") ? key.replace("-", ":") : key,
//   //       temp: dataVal.t || 0,
//   //       hum: dataVal.h || 0,
//   //     };

//   //     setDatos((prev) => {
//   //       // Evitar duplicados por el StrictMode de React
//   //       if (prev.find((d) => d.hora === nuevaLectura.hora)) return prev;
//   //       return [...prev, nuevaLectura];
//   //     });
//   //   });

//   //   // Limpieza al desmontar el componente
//   //   return () => unsubscribe();
//   // }, [salaId]);

//   // Si no hay salaId, mostramos un estado de carga o vacío
//   if (!salaId)
//     return (
//       <div className="text-gray-500 text-center p-10">
//         Selecciona una sala...
//       </div>
//     );

//   return (
//     <div className="w-full h-80 bg-slate-950 p-4 rounded-2xl border border-cyan-500/20 shadow-2xl">
//       <div className="flex justify-between items-center mb-6">
//         <h3 className="text-cyan-400 font-black text-xs tracking-widest uppercase italic">
//           Data Stream // {salaId.replace("_", " ")}
//         </h3>
//         <div className="flex gap-2">
//           <span className="flex items-center gap-1 text-[10px] text-cyan-500">
//             <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>{" "}
//             LIVE
//           </span>
//         </div>
//       </div>

//       <ResponsiveContainer width="100%" height="100%">
//         <AreaChart data={datos}>
//           <defs>
//             <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
//               <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
//               <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
//             </linearGradient>
//           </defs>

//           <CartesianGrid
//             strokeDasharray="3 3"
//             stroke="#1e293b"
//             vertical={false}
//             strokeOpacity={0.5}
//           />

//           <XAxis
//             dataKey="hora"
//             stroke="#475569"
//             fontSize={10}
//             tickLine={false}
//             axisLine={false}
//             minTickGap={30}
//           />

//           <YAxis
//             stroke="#475569"
//             fontSize={10}
//             tickLine={false}
//             axisLine={false}
//             domain={["auto", "auto"]}
//             unit="°"
//           />

//           <Tooltip
//             contentStyle={{
//               backgroundColor: "#020617",
//               border: "1px solid #1e293b",
//               borderRadius: "8px",
//               fontSize: "12px",
//             }}
//             itemStyle={{ color: "#22d3ee" }}
//             cursor={{ stroke: "#22d3ee", strokeWidth: 1 }}
//           />

//           <Area
//             type="monotone"
//             dataKey="temp"
//             stroke="#22d3ee"
//             strokeWidth={3}
//             fillOpacity={1}
//             fill="url(#colorTemp)"
//             isAnimationActive={true}
//           />
//         </AreaChart>
//       </ResponsiveContainer>
//     </div>
//   );
// }
