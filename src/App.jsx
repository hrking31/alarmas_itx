import { useEffect, useState } from "react";
import { getDatabase, ref, onValue } from "firebase/database";
import { app } from "./FirebaseConfig.jsx";

import { FaWifi, FaRegLightbulb, FaTimes, FaChartLine } from "react-icons/fa";
import logo from "./assets/Logo.png";
import { RedAc } from "./Components/Icons/RedAc.jsx";
import { Generador } from "./components/icons/Generador";
import { MdOutlinePower } from "react-icons/md";

export default function App() {
  const [data, setData] = useState({});
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true"
  );
  const [selectedSala, setSelectedSala] = useState(null);

  useEffect(() => {
    const database = getDatabase(app);
    const mainRef = ref(database);
    const unsub = onValue(mainRef, (snapshot) => {
      if (snapshot.exists()) setData(snapshot.val());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Función para verificar si el sensor envió datos hace menos de 60 segundos
  const estaConectado = (sensorTimestamp) => {
    if (!sensorTimestamp) return false;

    const ahora = Date.now(); // Tiempo actual en milisegundos
    const diferencia = ahora - sensorTimestamp;

    // Si el sensor envía datos cada 60s, damos un margen de 90s (90000 ms)
    return diferencia < 90000;
  };
  const plantaEncendida = data.Planta === 1;
  const redCorte = data.Ac === 1;
  const timestamp = data.timestamp;

  return (
    <div className="min-h-svh flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500 overflow-hidden">
      {/* HEADER - Más compacto en móvil */}
      <header className="w-full mx-auto px-4 md:px-8 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3 md:gap-4">
          <img
            src={logo}
            alt="Logo"
            className="w-15 h-15 md:w-30 md:h-30 object-contain"
          />

          <div>
            <h1 className="text-xl md:text-4xl font-black tracking-tighter uppercase italic leading-none">
              Alarmas ITX
            </h1>
            <p className="text-[8px] md:text-xs font-bold text-slate-400 tracking-[0.2em] uppercase mt-1">
              Centro de Monitoreo
            </p>
          </div>
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="block md:hidden p-3 md:p-4 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 active:scale-90 transition-all"
        >
          <FaRegLightbulb
            className={`w-5 h-5 ${
              !darkMode ? "text-green-500" : "text-red-500 "
            }`}
          />
        </button>
      </header>

      {/* MAIN CONTENT - Ajustado para llenar el espacio restante (flex-1) */}
      <main className="flex-1 mx-auto w-full p-4 md:p-10 grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-12 overflow-y-auto md:overflow-hidden">
        {/* PANEL ENERGÍA - Más delgado en móvil */}
        <section className="xl:col-span-4 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 md:p-8 rounded-4xl md:rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-start">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4  flex items-center gap-2">
                <MdOutlinePower size={16} className="text-blue-500" />{" "}
                Suministro Eléctrico RCA SBL
              </h2>
              {/* INDICADOR DE CONEXIÓN */}
              <div className="hidden md:flex items-center gap-1.5 mt-1">
                <div
                  className={`${
                    estaConectado(timestamp)
                      ? "bg-green-500 w-2 h-2 rounded-full animate-pulse"
                      : "bg-slate-400 w-1 h-1 rounded-full animate-ping"
                  }`}
                ></div>
                <span className="text-[7px] md:text-[9px] font-bold uppercase tracking-widest text-slate-500">
                  {estaConectado(timestamp) ? "En Línea" : "Desconectado"}
                </span>
              </div>
              <FaWifi
                size={14}
                className={`block md:hidden md:w-6 md:h-6${
                  estaConectado(timestamp)
                    ? "text-green-500 w-4 h-4 rounded-full "
                    : "text-slate-400 w-2.5 h-2.5 rounded-full animate-ping"
                }`}
              />
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-1 gap-3 md:gap-6">
              <div
                className={`flex flex-col md:flex-row items-center justify-between p-3 md:p-6 rounded-2xl md:rounded-4xl border-2 ${
                  !redCorte
                    ? "bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800"
                    : "bg-red-50 border-red-500 dark:bg-red-900/30 animate-pulse"
                }`}
              >
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-left">
                  <RedAc
                    className={`w-15 h-15 md:w-30 md:h-30 ${
                      !redCorte ? "text-green-500" : "text-red-500 "
                    }`}
                  />

                  <span className="font-black text-[10px] md:text-sm uppercase italic">
                    Red Comercial
                  </span>
                </div>
                <span
                  className={`text-xs md:text-lg font-black ${
                    !redCorte ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {!redCorte ? "OK" : "CORTE"}
                </span>
              </div>

              <div
                className={`flex flex-col md:flex-row items-center justify-between p-3 md:p-6 rounded-2xl md:rounded-4xl border-2 ${
                  plantaEncendida
                    ? "bg-orange-50 border-red-500 dark:bg-orange-900/30"
                    : "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                }`}
              >
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-0 lg:gap-4 xl:gap-0 2xl:gap-4 text-center md:text-left">
                  <Generador
                    className={`w-15 h-15 md:w-30 md:h-30 ${
                      !plantaEncendida
                        ? "text-slate-500"
                        : "text-red-500 animate-pulse"
                    }`}
                  />
                  <span className="font-black text-[10px] md:text-sm uppercase italic">
                    GENERADOR
                  </span>
                </div>
                <span
                  className={`text-xs md:text-lg font-black${
                    plantaEncendida ? "text-red-500" : "text-slate-500"
                  }`}
                >
                  {plantaEncendida ? "ON" : "OFF"}
                </span>
              </div>
            </div>
          </div>

          {/* Estadísticas solo para TV (XL) */}
          <div className="hidden xl:flex flex-1 flex-col items-center justify-center bg-white dark:bg-slate-900 p-10 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
            <FaChartLine
              className="text-slate-300 dark:text-slate-700 mb-4"
              size={50}
            />
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest text-center px-4">
              Análisis en Tiempo Real Disponible
            </p>
          </div>
        </section>

        {/* PANEL SALAS */}
        <section className="xl:col-span-8 flex flex-col">
          <div className="grid grid-cols-2 xl:grid-cols-2 gap-3 md:gap-10 h-full">
            {data.sensores &&
              Object.entries(data.sensores)
                .slice(0, 4)
                .map(([key, value]) => {
                  const esCritico = value.temperatura >= 34;

                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedSala({ id: key, ...value })}
                      className={`relative p-4 md:p-8 rounded-3xl md:rounded-[3.5rem] shadow-lg md:shadow-2xl transition-all border-2 flex flex-col justify-between 
                    ${
                      esCritico
                        ? "bg-red-50 border-red-500 dark:bg-red-950/40 dark:border-red-600 animate-pulse"
                        : "bg-white border-white dark:bg-slate-900 dark:border-slate-800 active:scale-95"
                    }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <h3 className="text-sm md:text-3xl font-black uppercase tracking-tighter dark:text-white truncate pr-2">
                            {key.replace("_", " ")}
                          </h3>
                          {/* INDICADOR DE CONEXIÓN */}
                          <div className="hidden md:flex items-center gap-1.5 mt-1">
                            <div
                              className={`${
                                estaConectado(value.timestamp)
                                  ? "bg-green-500 w-2 h-2 rounded-full animate-pulse"
                                  : "bg-slate-400 w-1 h-1 rounded-full animate-ping"
                              }`}
                            ></div>
                            <span className="text-[7px] md:text-[9px] font-bold uppercase tracking-widest text-slate-500">
                              {estaConectado(value.timestamp)
                                ? "En Línea"
                                : "Desconectado"}
                            </span>
                          </div>
                        </div>
                        <FaWifi
                          className={`block md:hidden ${
                            estaConectado(value.timestamp)
                              ? "text-green-500 w-4 h-4 rounded-full "
                              : "text-slate-400 w-2.5 h-2.5 rounded-full animate-ping"
                          }`}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-8 my-2">
                        <div className="flex items-center md:block gap-2">
                          <p
                            className={`text-3xl md:text-4xl lg:text-5xl xl:text-5xl 2xl:text-6xl font-black tracking-tighter ${
                              esCritico ? "text-red-600" : "dark:text-white"
                            }`}
                          >
                            {value.temperatura?.toFixed(1)}
                            <span className="text-xs md:text-2xl font-bold ml-2">
                              ° C
                            </span>
                          </p>
                          <span className="text-[8px] md:text-xs font-black uppercase text-slate-400">
                            Temp
                          </span>
                        </div>

                        <div className="flex items-center md:block gap-2 border-t md:border-t-0 md:border-l-2 border-slate-100 dark:border-slate-800 pt-1 md:pt-0 md:pl-8">
                          <p className="text-2xl md:text-3xl lg:text-4xl xl:text-4xl 2xl:text-5xl font-black tracking-tighter text-cyan-500 dark:text-cyan-400">
                            {value.humedad?.toFixed(1)}
                            <span className="text-xs md:text-2xl font-bold ml-2">
                              %
                            </span>
                          </p>
                          <span className="text-[8px] md:text-xs font-black uppercase text-slate-400">
                            Hum
                          </span>
                        </div>
                      </div>

                      {esCritico && (
                        <div className="py-1 md:py-3 bg-red-600 text-white rounded-lg md:rounded-2xl text-[10px] sm:text-xs md:text-sm lg:text-base font-black text-center animate-pulse uppercase tracking-wider">
                          <span className="md:hidden">Fuera de rango</span>{" "}
                          <span className="hidden md:inline">
                            Temperatura fuera de rango
                          </span>{" "}
                        </div>
                      )}
                    </div>
                  );
                })}
          </div>
        </section>
      </main>

      {/* FOOTER - Muy pequeño para no robar espacio */}
      <footer className="py-2 text-center text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] shrink-0">
        © {new Date().getFullYear()} ITX Infrastructure Control System
        <p className="mt-1 text-[10px] font-normal tracking-normal normal-case text-gray-500">
          Desarrollado por Hernando Rey — Hecho con amor y café ☕
        </p>
      </footer>

      {/* MODAL */}
      {selectedSala && (
        <div className="block md:hidden fixed inset-0 z-50 items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-4xl overflow-hidden animate-in slide-in-from-bottom">
            <div className="p-8 text-center">
              <h2 className="text-xl font-black uppercase mb-6">
                Estadísticas {selectedSala.id}
              </h2>
              <div className="h-40 bg-slate-50 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 mb-6">
                <FaChartLine size={32} className="text-slate-300 mb-2" />
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  Próximamente
                </p>
              </div>
              <button
                onClick={() => setSelectedSala(null)}
                className="w-full py-4 bg-blue-600 text-white font-black uppercase rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
