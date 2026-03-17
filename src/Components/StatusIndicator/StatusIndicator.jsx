// import { FaWifi, FaBluetoothB } from "react-icons/fa";

// // COMPONENTE VISUAL
// function StatusBase({ isOnline, icon: Icon, colorClass }) {
//   const colorActive = isOnline ? colorClass : "red";
//   const bgClass = isOnline ? `bg-${colorClass}-500/10` : "bg-red-500/10";
//   const textColor = isOnline ? `text-${colorClass}-500` : "text-red-500";
//   const dotColor = isOnline ? `bg-${colorClass}-500` : "bg-red-500";
//   const pingColor = isOnline ? `bg-${colorClass}-400` : "bg-red-400";

//   return (
//     <div
//       className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${bgClass} transition-colors duration-500 w-fit`}
//     >
//       {/* Icono Móvil */}
//       <div className="md:hidden flex items-center justify-center">
//         <div className="relative flex items-center justify-center w-4 h-4">
//           {!isOnline && (
//             <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
//           )}
//           <Icon className={`relative z-10 w-4 h-4 ${textColor}`} />
//         </div>
//       </div>

//       {/* Círculo con pulso (Escritorio) */}
//       <div className="hidden md:flex relative h-3 w-3">
//         <span
//           className={`${!isOnline ? "animate-ping" : ""} absolute inline-flex h-full w-full rounded-full ${pingColor} opacity-75`}
//         ></span>
//         <span
//           className={`relative inline-flex rounded-full h-3 w-3 ${dotColor}`}
//         ></span>
//       </div>

//       {/* Texto */}
//       <span
//         className={`hidden md:block text-xs font-bold tracking-widest ${textColor}`}
//       >
//         {isOnline ? "ONLINE" : "OFFLINE"}
//       </span>
//     </div>
//   );
// }

// //  VARIACIONES (WIFI, BLUETOOTH)
// export function StatusWifi({ isOnline }) {
//   return <StatusBase isOnline={isOnline} icon={FaWifi} colorClass="green" />;
// }

// export function StatusBluetooth({ isOnline }) {
//   return (
//     <StatusBase isOnline={isOnline} icon={FaBluetoothB} colorClass="blue" />
//   );
// }

import { FaWifi, FaBluetoothB } from "react-icons/fa";

// 1. CONFIGURACIÓN DE COLORES (Para que Tailwind detecte las clases completas)
const VARIANTS = {
  green: {
    bg: "bg-green-500/10",
    text: "text-green-500",
    dot: "bg-green-500",
    ping: "bg-green-400",
  },
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-500",
    dot: "bg-blue-500",
    ping: "bg-blue-400",
  },
  red: {
    bg: "bg-red-500/10",
    text: "text-red-500",
    dot: "bg-red-500",
    ping: "bg-red-400",
  },
};

// 2. COMPONENTE BASE (Lógica visual unificada)
function StatusBase({ isOnline, icon: Icon, colorClass }) {
  // Si está offline, usamos la variante roja; si está online, la que pida el componente
  const current = isOnline ? VARIANTS[colorClass] : VARIANTS.red;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${current.bg} transition-colors duration-500 w-fit`}
    >
      {/* Icono para móvil */}
      <div className="md:hidden flex items-center justify-center">
        <div className="relative flex items-center justify-center w-4 h-4">
          {!isOnline && (
            <span
              className={`absolute inline-flex h-full w-full rounded-full ${current.ping} opacity-75 animate-ping`}
            />
          )}
          <Icon className={`relative z-10 w-4 h-4 ${current.text}`} />
        </div>
      </div>

      {/* Círculo con pulso (Escritorio) */}
      <div className="hidden md:flex relative h-3 w-3">
        <span
          className={`${
            !isOnline ? "animate-ping" : ""
          } absolute inline-flex h-full w-full rounded-full ${current.ping} opacity-75`}
        ></span>
        <span
          className={`relative inline-flex rounded-full h-3 w-3 ${current.dot}`}
        ></span>
      </div>

      {/* Texto de estado */}
      <span
        className={`hidden md:block text-xs font-bold tracking-widest ${current.text}`}
      >
        {isOnline ? "ONLINE" : "OFFLINE"}
      </span>
    </div>
  );
}

// 3. EXPORTACIONES NOMBRADAS
export function StatusWifi({ isOnline }) {
  return <StatusBase isOnline={isOnline} icon={FaWifi} colorClass="green" />;
}

export function StatusBluetooth({ isOnline }) {
  return (
    <StatusBase isOnline={isOnline} icon={FaBluetoothB} colorClass="blue" />
  );
}
