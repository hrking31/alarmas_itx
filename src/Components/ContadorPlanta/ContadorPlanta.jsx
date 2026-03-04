import { useState, useEffect } from "react";
import { useDarkMode } from "../../Context/DarkModeContext";

const DURACION_CICLO = 6 * 60 * 1000; // 6 minutos

// Casilla
const DigitoCasilla = ({
  valor,
  totalMsAcumulados,
  engineStartTimestamp,
  estado,
  esRojo,
  darkMode,
}) => {
  const [now, setNow] = useState(0);

  // Solo se actualiza el rojo que es el que muestra el progreso en tiempo real
  useEffect(() => {
    if (!esRojo) return;

    const interval = setInterval(() => {
      setNow((t) => t + 1);
    }, 100); // fluido

    return () => clearInterval(interval);
  }, [esRojo]);

  let desplazamiento;

  // Si es rojo calculamos el desplazamiento en base al tiempo real acumulado + tiempo de encendido actual
  if (esRojo) {
    let tiempoActualMs = Number(totalMsAcumulados) || 0;

    const plantaEncendida = estado === true || estado === 1;

    if (plantaEncendida && engineStartTimestamp) {
      tiempoActualMs += Date.now() - engineStartTimestamp;
    }

    // Total de décimas acumuladas
    const totalDecimas = tiempoActualMs / DURACION_CICLO;
    // Parte entera dentro de 0–9
    const decimaActual = Math.floor(totalDecimas) % 10;
    // Parte decimal (progreso)
    const progreso = totalDecimas % 1;
    desplazamiento = (decimaActual + progreso) * 28;
  } else {
    desplazamiento = valor * 28;
  }

  return (
    <div className="relative w-3 h-7 overflow-hidden rounded-sm">
      {/* Fondo */}
      <div
        className={`absolute inset-0 ${
          esRojo
            ? darkMode
              ? "bg-linear-to-b from-[#ff2a2a] to-[#7a0000]"
              : "bg-linear-to-b from-[#a12222] to-[#5c0f0f]"
            : darkMode
              ? "bg-linear-to-b from-[#111] to-[#000]"
              : "bg-linear-to-b from-[#2a2a2a] to-[#0f0f0f]"
        }`}
      />

      {/* Cinta de números */}
      <div
        className="absolute inset-0 flex flex-col will-change-transform"
        style={{
          transform: `translateY(-${desplazamiento}px)`,
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num, index) => (
          <div
            key={index}
            className={`h-7 flex items-center justify-center font-mono font-bold text-lg ${
              darkMode
                ? esRojo
                  ? "text-red-200 drop-shadow-[0_0_4px_red]"
                  : "text-green-300 drop-shadow-[0_0_6px_lime]"
                : "text-gray-100"
            }`}
          >
            {num}
          </div>
        ))}
      </div>

      {/* Línea central */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-black/60" />
    </div>
  );
};

// HORÓMETRO INDUSTRIAL
const ContadorPlanta = ({
  estado, // 1 o 0
  engineStartTimestamp, // timestamp real de encendido
  totalMsAcumulados, // acumulado histórico
}) => {
  const [tiempo, setTiempo] = useState("000000");
  const { darkMode } = useDarkMode();

  useEffect(() => {
    let intervalo;
    // estado sea booleano (soporta 1/0 o true/false)
    const plantaEncendida = estado === true || estado === 1;

    const actualizarTiempo = () => {
      // Total acumulado real en ms
      let tiempoActualMs = Number(totalMsAcumulados) || 0;

      // Cuanto tiempo paso desde que se encendió la planta
      if (plantaEncendida && engineStartTimestamp) {
        tiempoActualMs += Date.now() - engineStartTimestamp;
      }

      // todo a décimas totales
      const totalDecimas = Math.floor(tiempoActualMs / 360000);
      console.log("totalDecimas", totalDecimas);

      // Separa parte entera y decimal
      const horasEnteras = Math.floor(totalDecimas / 10)
        .toString()
        .padStart(5, "0");

      const decima = (totalDecimas % 10).toString();

      setTiempo(`${horasEnteras}${decima}`);
    };

    actualizarTiempo();

    if (plantaEncendida) {
      // 1000ms es suficiente para ver el cambio fluido en las décimas ya que una décima cambia cada 360,000ms (6 min)
      intervalo = setInterval(actualizarTiempo, 1000);
    }

    return () => clearInterval(intervalo);
  }, [estado, engineStartTimestamp, totalMsAcumulados]);

  const digitosArr = tiempo.split("");

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-500 ${
        darkMode
          ? "bg-linear-to-br from-[#4a4a4a] via-[#1a1a1a] to-[#0a0a0a] border-[#555] shadow-[0_4px_10px_rgba(0,0,0,0.9)]"
          : "bg-linear-to-br from-[#e0e0e0] via-[#999999] to-[#777777] border-[#888] shadow-inner"
      }`}
    >
      <div
        className={`w-2 h-2 rounded-full ${
          estado
            ? darkMode
              ? "bg-red-400 shadow-[0_0_8px_red] animate-pulse"
              : "bg-red-500 animate-pulse"
            : "bg-slate-700"
        }`}
      />

      <div
        className={`flex gap-1 p- rounded border-2 transition-all duration-500 ${
          darkMode
            ? "bg-black border-[#050505] shadow-[inset_0_0_15px_black]"
            : "bg-black border-[#111]"
        }`}
      >
        {digitosArr.map((digito, index) => (
          <DigitoCasilla
            key={index}
            valor={Number(digito)}
            totalMsAcumulados={totalMsAcumulados}
            engineStartTimestamp={engineStartTimestamp}
            estado={estado}
            esRojo={index === digitosArr.length - 1}
            darkMode={darkMode}
          />
        ))}
      </div>
    </div>
  );
};

export default ContadorPlanta;
