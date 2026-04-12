import { useEffect, useState } from "react";
import { useDarkMode } from "../../Context/DarkModeContext";

const ModalUpdateHorometro = ({ isOpen, onClose, onSave, valorActual }) => {
  const { darkMode } = useDarkMode();
  // String de 6 dígitos que muestra el contador
  const [digitos, setDigitos] = useState([0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    setDigitos(valorActual.split("").map(Number));
  }, [valorActual]);

  if (!isOpen) return null;

  const handleIncrement = (index) => {
    const nuevosDigitos = [...digitos];
    nuevosDigitos[index] = (nuevosDigitos[index] + 1) % 10;
    setDigitos(nuevosDigitos);
  };

  const handleDecrement = (index) => {
    const nuevosDigitos = [...digitos];
    nuevosDigitos[index] = (nuevosDigitos[index] - 1 + 10) % 10;
    setDigitos(nuevosDigitos);
  };

  const handleGuardar = () => {
    // Convierte los dígitos a horas decimales Ejemplo: [0,0,0,1,2,5] -> "00012" y "5" -> 12.5 horas
    const horasEnteras = parseInt(digitos.slice(0, 5).join(""), 10);
    const decima = digitos[5] / 10;
    const horasTotales = horasEnteras + decima;

    // Convierte a milisegundos para la base de datos
    const msTotales = horasTotales * 3600000;
    onSave(msTotales);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all duration-300 ${
          darkMode
            ? "bg-[#1a1a1a] border-[#333] text-white"
            : "bg-white border-gray-200 text-gray-800"
        }`}
      >
        <h2 className="text-xl font-black italic tracking-tighter uppercase mb-6 flex items-center gap-2">
          <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
          Actualizar Horómetro
        </h2>

        {/* CONTENEDOR DE SELECTORES (6 CASILLAS) */}
        <div className="flex justify-center gap-2 mb-8 bg-black/20 p-4 rounded-xl shadow-inner">
          {digitos.map((digito, index) => (
            <div key={index} className="flex flex-col items-center gap-2">
              <button
                onClick={() => handleIncrement(index)}
                className="p-1 hover:text-red-500 transition-colors"
              >
                ▲
              </button>

              <div
                className={`relative w-10 h-14 flex items-center justify-center rounded-md border-2 font-mono text-2xl font-black shadow-lg ${
                  index === 5
                    ? "bg-red-900 border-red-600 text-red-100"
                    : "bg-[#222] border-[#444] text-white"
                }`}
              >
                {digito}
                <div className="absolute w-full h-px bg-white/10 top-1/2" />
              </div>

              <button
                onClick={() => handleDecrement(index)}
                className="p-1 hover:text-red-500 transition-colors"
              >
                ▼
              </button>
              {index === 4 && <span className="mt-8 text-xl font-bold">.</span>}
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className={`flex-1 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${
              darkMode
                ? "bg-[#333] hover:bg-[#444]"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-widest text-xs shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalUpdateHorometro;
