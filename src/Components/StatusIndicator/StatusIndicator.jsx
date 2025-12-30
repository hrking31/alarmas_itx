import { useState, useEffect } from "react";
import { FaWifi } from "react-icons/fa";

export default function StatusIndicator({ timestamp }) {
  const [ahora, setAhora] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setAhora(Date.now());
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  const diff = ahora - timestamp;
  const isOnline = timestamp && diff < 90000; // 90 segundos

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full 
      ${
        isOnline
          ? "bg-green-500/10 dark:bg-green-500/5"
          : "bg-red-500/10 dark:bg-red-500/5"
      } 
      transition-colors duration-500 w-fit`}
    >
      {/* Icono para móvil */}
      <div className="md:hidden flex items-center justify-center">
        {isOnline ? (
          <FaWifi className="w-4 h-4 text-green-500 transition-all duration-500" />
        ) : (
          <div className="relative flex items-center justify-center w-4 h-4">
            {/* Ping */}
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />

            {/* Icono */}
            <FaWifi className="relative z-10 w-4 h-4 text-red-500" />
          </div>
        )}
      </div>

      {/* Círculo con pulso si está online */}
      <div className="hidden md:flex relative h-3 w-3">
        {isOnline ? (
          <>
            <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </>
        ) : (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </>
        )}
      </div>

      {/* Texto de estado */}
      <span
        className={`hidden md:block text-xs font-bold tracking-widest ${
          isOnline ? "text-green-500" : "text-red-500"
        }`}
      >
        {isOnline ? "ONLINE" : "OFFLINE"}
      </span>
    </div>
  );
}
