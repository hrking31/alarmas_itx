import { useState, useEffect } from "react";
import { FaBluetoothB } from "react-icons/fa";

export default function StatusBluetooth({ timestamp }) {
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
          ? "bg-blue-500/10 dark:bg-blue-500/5"
          : "bg-red-500/10 dark:bg-red-500/5"
      } 
      transition-colors duration-500 w-fit`}
    >
      {/* Icono para móvil */}
      <div className="md:hidden flex items-center justify-center">
        {isOnline ? (
          <FaBluetoothB className="w-4 h-4 text-blue-500 transition-all duration-500" />
        ) : (
          <div className="relative flex items-center justify-center w-4 h-4">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
            <FaBluetoothB className="relative z-10 w-4 h-4 text-red-500" />
          </div>
        )}
      </div>

      {/* Círculo con pulso */}
      <div className="hidden md:flex relative h-3 w-3">
        {isOnline ? (
          <>
            <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </>
        ) : (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </>
        )}
      </div>

      {/* Texto */}
      <span
        className={`hidden md:block text-xs font-bold tracking-widest ${
          isOnline ? "text-blue-500" : "text-red-500"
        }`}
      >
        {isOnline ? "BT ONLINE" : "BT OFFLINE"}
      </span>
    </div>
  );
}
