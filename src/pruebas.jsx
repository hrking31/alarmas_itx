import { useEffect, useState } from "react";
import { getDatabase, ref, onValue } from "firebase/database";
import { app } from "./FirebaseConfig.jsx";

// Íconos
import {
  FaWifi,
  FaLightbulb,
  FaRegLightbulb,
  FaBolt,
  FaServer,
  FaTimes,
  FaChartLine,
} from "react-icons/fa";
import { IoMdThermometer } from "react-icons/io";
import { WiHumidity } from "react-icons/wi";
import { MdOutlinePower } from "react-icons/md";

export default function App() {
  const [data, setData] = useState({});
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true"
  );
  const [selectedSala, setSelectedSala] = useState(null); // Para el Modal

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

  const plantaEncendida = data.PLANTA === 1;
  const redCorte = data.AC === 1;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500 font-sans">
      {/* HEADER - Ajustado para visibilidad en TV */}
      <header className="max-w-[1600px] mx-auto p-6 md:p-10 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-500/30">
            <FaBolt size={28} />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic leading-none">
              Alarmas ITX
            </h1>
            <p className="text-[10px] md:text-xs font-bold text-slate-400 tracking-[0.2em] uppercase mt-1">
              Centro de Monitoreo RCA
            </p>
          </div>
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 hover:scale-105 active:scale-95 transition-all"
        >
          {darkMode ? (
            <FaRegLightbulb className="text-yellow-400 text-2xl" />
          ) : (
            <FaLightbulb className="text-slate-500 text-2xl" />
          )}
        </button>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 md:p-10 grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-12">
        {/* ENERGÍA - Ocupa 4 columnas en TV */}
        <section className="xl:col-span-4 space-y-8">
          <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl p-8 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
              <MdOutlinePower size={20} className="text-blue-500" /> Suministro
              Eléctrico
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-6">
              <div
                className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all duration-700 ${
                  !redCorte
                    ? "bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800/50"
                    : "bg-red-50 border-red-500 dark:bg-red-900/40 animate-pulse"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-4 rounded-2xl shadow-lg ${
                      !redCorte
                        ? "bg-green-500 shadow-green-500/20"
                        : "bg-red-500 shadow-red-500/20"
                    } text-white`}
                  >
                    <FaBolt size={24} />
                  </div>
                  <span className="font-black text-sm uppercase tracking-tight">
                    Red Red Comercial
                  </span>
                </div>
                <span
                  className={`text-lg font-black ${
                    !redCorte ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {!redCorte ? "OK" : "CORTE"}
                </span>
              </div>

              <div
                className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all duration-700 ${
                  plantaEncendida
                    ? "bg-orange-50 border-orange-500 dark:bg-orange-900/40 animate-pulse"
                    : "bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-4 rounded-2xl shadow-lg ${
                      plantaEncendida
                        ? "bg-orange-500 shadow-orange-500/20"
                        : "bg-slate-500 shadow-slate-500/20"
                    } text-white`}
                  >
                    <FaServer size={24} />
                  </div>
                  <span className="font-black text-sm uppercase tracking-tight">
                    Generador RCA
                  </span>
                </div>
                <span
                  className={`text-lg font-black ${
                    plantaEncendida ? "text-orange-500" : "text-slate-400"
                  }`}
                >
                  {plantaEncendida ? "ON" : "OFF"}
                </span>
              </div>
            </div>
          </div>

          {/* Espacio para Estadísticas Futuras en TV */}
          <div className="hidden xl:block bg-blue-600/5 dark:bg-blue-600/10 border-2 border-dashed border-blue-200 dark:border-blue-900/50 p-8 rounded-[3rem] text-center">
            <FaChartLine className="mx-auto text-blue-500 mb-4" size={40} />
            <p className="text-blue-500 font-bold text-xs uppercase tracking-widest">
              Panel de Estadísticas
            </p>
            <p className="text-slate-400 text-[10px] mt-2 italic font-medium tracking-normal">
              Gráficas históricas disponibles próximamente
            </p>
          </div>
        </section>

        {/* SALAS - Ocupa 8 columnas en TV */}
        <section className="xl:col-span-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8 md:gap-10">
            {data.sensores &&
              Object.entries(data.sensores).map(([key, value]) => {
                const esCritico = value.temperatura >= 34;
                return (
                  <div
                    key={key}
                    onClick={() => setSelectedSala({ id: key, ...value })}
                    className={`group relative p-8 rounded-[3.5rem] shadow-2xl transition-all duration-500 border-2 cursor-pointer hover:scale-[1.02] active:scale-95 ${
                      esCritico
                        ? "bg-red-50 border-red-500 dark:bg-red-950/40 dark:border-red-600"
                        : "bg-white border-white dark:bg-slate-900 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-10">
                      <h3 className="text-3xl font-black uppercase tracking-tighter dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {key.replace("_", " ")}
                      </h3>
                      <FaWifi
                        className={
                          data.ESTADO === 1
                            ? "text-green-500"
                            : "text-slate-300"
                        }
                        size={24}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-400">
                          <IoMdThermometer size={18} />
                          <span className="text-xs font-black uppercase tracking-widest">
                            Temp
                          </span>
                        </div>
                        <p
                          className={`text-6xl font-black tracking-tighter ${
                            esCritico ? "text-red-600" : "dark:text-white"
                          }`}
                        >
                          {value.temperatura?.toFixed(1)}
                          <span className="text-2xl font-bold">°C</span>
                        </p>
                      </div>

                      <div className="space-y-2 border-l-2 border-slate-100 dark:border-slate-800 pl-8">
                        <div className="flex items-center gap-2 text-slate-400">
                          <WiHumidity size={22} />
                          <span className="text-xs font-black uppercase tracking-widest">
                            Hum
                          </span>
                        </div>
                        <p className="text-6xl font-black tracking-tighter text-cyan-500 dark:text-cyan-400">
                          {value.humedad?.toFixed(1)}
                          <span className="text-2xl font-bold">%</span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      </main>

      {/* MODAL PARA ESTADÍSTICAS (Aparece al hacer click) */}
      {selectedSala && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md transition-all">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black uppercase tracking-tighter">
                  Estadísticas {selectedSala.id.replace("_", " ")}
                </h2>
                <button
                  onClick={() => setSelectedSala(null)}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:rotate-90 transition-transform"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="h-64 w-full bg-slate-50 dark:bg-slate-800/50 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                <FaChartLine
                  size={48}
                  className="text-slate-300 dark:text-slate-600 mb-4"
                />
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">
                  Cargando historial de datos...
                </p>
              </div>

              <button
                onClick={() => setSelectedSala(null)}
                className="w-full mt-6 py-4 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors"
              >
                Cerrar Panel
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="text-center p-12 text-slate-400 text-[10px] font-black uppercase tracking-[0.5em] opacity-50">
        ITX Infrastructure Control System — 2025
      </footer>
    </div>
  );
}


import { useEffect, useState } from "react";
import { getDatabase, ref, onValue } from "firebase/database";
import { app } from "./FirebaseConfig.jsx";

// Íconos
import { FaWifi, FaLightbulb, FaRegLightbulb, FaBolt, FaServer } from "react-icons/fa";
import { IoMdThermometer } from "react-icons/io";
import { WiHumidity } from "react-icons/wi";
import { MdOutlinePower } from "react-icons/md";

export default function App() {
  const [data, setData] = useState({});
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");

  // ---------- CONEXIÓN FIREBASE ----------
  useEffect(() => {
    const database = getDatabase(app);
    const mainRef = ref(database);
    
    const unsub = onValue(mainRef, (snapshot) => {
      if (snapshot.exists()) {
        setData(snapshot.val());
      }
    });

    return () => unsub();
  }, []);

  // ---------- MODO OSCURO ----------
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Lógica de Energía
  const plantaEncendida = data.PLANTA === 1;
  const redCorte = data.AC === 1; // 1 es corte según tu lógica anterior

  return (
    <div className="min-h-screen transition-colors duration-500 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* HEADER */}
      <header className="max-w-7xl mx-auto p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <FaBolt size={20} />
          </div>
          <h1 className="text-2xl font-black tracking-tighter uppercase italic">Alarmas ITX</h1>
        </div>
        
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-xl hover:scale-110 transition-all border border-slate-200 dark:border-slate-700"
        >
          {darkMode ? <FaRegLightbulb className="text-yellow-400 text-xl" /> : <FaLightbulb className="text-slate-500 text-xl" />}
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA: ESTADO DE ENERGÍA */}
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <MdOutlinePower size={18} /> Suministro Eléctrico
            </h2>
            
            <div className="space-y-4">
              {/* Card Red AC */}
              <div className={`flex items-center justify-between p-4 rounded-3xl border-2 transition-colors ${
                !redCorte 
                ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900" 
                : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 animate-pulse"
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${!redCorte ? "bg-green-500" : "bg-red-500"} text-white`}>
                    <FaBolt />
                  </div>
                  <span className="font-bold">RED COMERCIAL</span>
                </div>
                <span className={`text-sm font-black ${!redCorte ? "text-green-600" : "text-red-600"}`}>
                  {!redCorte ? "NORMAL" : "CORTE"}
                </span>
              </div>

              {/* Card Planta */}
              <div className={`flex items-center justify-between p-4 rounded-3xl border-2 transition-colors ${
                plantaEncendida 
                ? "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900 animate-pulse" 
                : "bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${plantaEncendida ? "bg-orange-500" : "bg-slate-400"} text-white`}>
                    <FaServer />
                  </div>
                  <span className="font-bold">GENERADOR RCA</span>
                </div>
                <span className={`text-sm font-black ${plantaEncendida ? "text-orange-500" : "text-slate-500"}`}>
                  {plantaEncendida ? "ENCENDIDO" : "APAGADO"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* COLUMNA DERECHA: SALAS DE SERVIDORES */}
        <section className="lg:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.sensores && Object.entries(data.sensores).map(([key, value]) => {
              const esCritico = value.temperatura >= 34;

              return (
                <div 
                  key={key} 
                  className={`group relative p-6 rounded-[2.5rem] shadow-2xl transition-all duration-500 border-2 ${
                    esCritico 
                    ? "bg-red-50 border-red-500 dark:bg-red-950/40 dark:border-red-600" 
                    : "bg-white border-white dark:bg-slate-900 dark:border-slate-800"
                  }`}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black uppercase tracking-tight dark:text-white">
                      {key.replace("_", " ")}
                    </h3>
                    <FaWifi className={data.ESTADO === 1 ? "text-green-500" : "text-slate-300"} />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-slate-400">
                        <IoMdThermometer size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Temp</span>
                      </div>
                      <p className={`text-4xl font-black tracking-tighter ${esCritico ? "text-red-600" : "dark:text-white"}`}>
                        {value.temperatura?.toFixed(1)}°C
                      </p>
                    </div>

                    <div className="space-y-1 border-l border-slate-100 dark:border-slate-800 pl-6">
                      <div className="flex items-center gap-1 text-slate-400">
                        <WiHumidity size={18} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Humedad</span>
                      </div>
                      <p className="text-4xl font-black tracking-tighter text-cyan-500 dark:text-cyan-400">
                        {value.humedad?.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {esCritico && (
                    <div className="mt-6 py-2 bg-red-600 text-white rounded-2xl text-[10px] font-black text-center animate-pulse uppercase">
                      Alerta: Temperatura fuera de rango
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="text-center p-8 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
        Sistema de Monitoreo ITX - 2025
      </footer>
    </div>
  );
}






import { useEffect, useState } from "react";
import { getDatabase, ref, onValue } from "firebase/database";
import { app } from "./FirebaseConfig.jsx";

// Recursos gráficos (Asegúrate de que las rutas sean correctas)
import generadorActivo from "./assets/generadorActivo.svg";
import generadorInactivo from "./assets/generadorInactivo.svg";
import redActiva from "./assets/redActiva.svg";
import redInactiva from "./assets/redInactiva.svg";
import Logo from "./assets/Logo.png";

// Íconos
import { FaWifi, FaLightbulb, FaRegLightbulb, FaBolt, FaWarehouse } from "react-icons/fa";
import { IoMdThermometer } from "react-icons/io";
import { WiHumidity } from "react-icons/wi";

export default function App() {
  const [data, setData] = useState({});
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");

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
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Lógica de colores y estados
  const isPlantaOn = data.PLANTA === 1;
  const isAcOk = data.AC === 0; // Según tu lógica original AC 0 es Activa/Normal

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? "bg-slate-900 text-white" : "bg-gray-50 text-slate-800"}`}>
      
      {/* HEADER */}
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <img src={Logo} alt="Logo" className="h-10 w-auto object-contain" />
          <h1 className="text-2xl font-black tracking-tighter uppercase">Alarmas ITX</h1>
        </div>
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-lg hover:scale-110 transition-transform"
        >
          {darkMode ? <FaRegLightbulb className="text-yellow-400 text-xl" /> : <FaLightbulb className="text-slate-600 text-xl" />}
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SECCIÓN ENERGÍA (PLANTA Y RED) */}
        <section className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Suministro Eléctrico</h2>
              <FaWifi className={data.ESTADO === 1 ? "text-green-500 animate-pulse" : "text-gray-300"} />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              {/* Card AC */}
              <div className={`p-4 rounded-2xl border ${isAcOk ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"}`}>
                <img src={isAcOk ? redActiva : redInactiva} className="h-16 mx-auto mb-2" alt="Red" />
                <span className="text-xs font-bold uppercase block opacity-70">Red AC</span>
                <span className={`text-lg font-black ${isAcOk ? "text-green-600" : "text-red-600"}`}>{isAcOk ? "NORMAL" : "CORTE"}</span>
              </div>

              {/* Card Planta */}
              <div className={`p-4 rounded-2xl border ${isPlantaOn ? "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800" : "bg-gray-50 border-gray-200 dark:bg-slate-700/50 dark:border-slate-600"}`}>
                <img src={isPlantaOn ? generadorActivo : generadorInactivo} className="h-16 mx-auto mb-2" alt="Generador" />
                <span className="text-xs font-bold uppercase block opacity-70">Generador</span>
                <span className={`text-lg font-black ${isPlantaOn ? "text-orange-500" : "text-gray-500"}`}>{isPlantaOn ? "ENCENDIDO" : "APAGADO"}</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN SENSORES SALAS */}
        <section className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(data).map(([key, value]) => {
              if (key.startsWith("SALA_") && value?.ESTADO !== undefined) {
                const temp = value.Temperatura || value.temperatura || 0;
                const hum = value.Humedad || value.humedad || 0;
                
                // Lógica de color de alerta
                const isHot = temp >= 34;
                const isCold = temp < 20;

                return (
                  <div key={key} className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-lg border border-gray-100 dark:border-slate-700 hover:shadow-2xl transition-shadow relative overflow-hidden">
                    {/* Indicador de fondo si hay calor */}
                    {isHot && <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 blur-3xl -mr-10 -mt-10"></div>}
                    
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <FaWarehouse className="text-slate-400" />
                          <h3 className="font-black text-lg tracking-tight uppercase">{key.replace("_", " ")}</h3>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${value.ESTADO === 1 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                          {value.ESTADO === 1 ? "En línea" : "Desconectado"}
                        </span>
                      </div>
                      <FaWifi className={value.ESTADO === 1 ? "text-green-500" : "text-gray-300"} />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-700/50 p-3 rounded-2xl">
                        <IoMdThermometer className={`text-2xl ${isHot ? "text-red-500 animate-bounce" : "text-blue-500"}`} />
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Temp</p>
                          <p className={`text-xl font-black ${isHot ? "text-red-500" : ""}`}>{temp.toFixed(1)}°C</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-700/50 p-3 rounded-2xl">
                        <WiHumidity className="text-3xl text-cyan-500" />
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Humedad</p>
                          <p className="text-xl font-black">{hum.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </section>
      </main>
    </div>
  );
}