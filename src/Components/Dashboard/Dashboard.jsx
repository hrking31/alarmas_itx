import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { database } from "../../Firebase/Firebase.js";
import Footer from "../../Components/Footer/Footer.jsx";
import logo from "../../assets/Logo.png";
import { RedAc } from "../../Components/Icons/RedAc.jsx";
import { Generador } from "../../Components/Icons/Generador.jsx";
import { MdOutlinePower } from "react-icons/md";
import { IoMdThermometer } from "react-icons/io";
import { WiHumidity } from "react-icons/wi";
import { FaRegLightbulb, FaTimes } from "react-icons/fa";
import { useDarkMode } from "../../Context/DarkModeContext";
import StatusIndicator from "../../Components/StatusIndicator/StatusIndicator.jsx";
import GraficasTiempoReal from "../../Components/GraficasTiempoReal/GraficasTiempoReal.jsx";
import GraficaComparativa from "../../Components/GraficaComparativa/GraficaComparativa.jsx";

export default function App() {
  const navigate = useNavigate();
  const { darkMode, setDarkMode } = useDarkMode();
  const [sensores, setSensores] = useState(null);
  const [umbrales, setUmbrales] = useState(null);
  const [heartbeat, setHeartbeat] = useState(null);
  const [ac, setAc] = useState(0);
  const [planta, setPlanta] = useState(0);
  const [selectedSala, setSelectedSala] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const sensoresRef = ref(database, "sensores");
      const umbralesRef = ref(database, "configuracion/umbrales");
      const heartbeatRef = ref(database, "heartbeat");
      const acRef = ref(database, "Ac");
      const plantaRef = ref(database, "Planta");

      const unsubSensores = onValue(sensoresRef, (snap) => {
        if (snap.exists()) setSensores(snap.val());
      });

      const unsubUmbrales = onValue(umbralesRef, (snap) => {
        if (snap.exists()) setUmbrales(snap.val());
      });

      const unsubHeartbeat = onValue(heartbeatRef, (snap) => {
        if (snap.exists()) setHeartbeat(snap.val());
      });

      const unsubAc = onValue(acRef, (snap) => {
        setAc(snap.val());
      });

      const unsubPlanta = onValue(plantaRef, (snap) => {
        setPlanta(snap.val());
      });

      setLoading(false);

      return () => {
        unsubSensores();
        unsubUmbrales();
        unsubHeartbeat();
        unsubAc();
        unsubPlanta();
      };
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  }, []);

  const plantaEncendida = planta === 1;
  const redCorte = ac === 1;
  const AcPlanta = heartbeat?.AcPlanta?.timestamp;

  return (
    <div className="min-h-svh flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500">
      {/* HEADER - Más compacto en móvil */}
      <header className="w-full mx-auto px-4 md:px-10 flex justify-between items-center shrink-0 pt-2">
        <button
          type="button"
          onClick={() => navigate("/ViewLogin")}
          className="flex items-center gap-3 md:gap-4 group focus:outline-none"
        >
          <img
            src={logo}
            alt="Alarmas ITX"
            className="w-10 h-10 md:w-14 md:h-14 object-contain transition-transform duration-200 group-hover:scale-105"
          />

          <div className="text-left">
            <h1 className="text-xl md:text-4xl font-black tracking-tighter uppercase italic leading-none transition-colors duration-200 group-hover:text-blue-400">
              Alarmas ITX
            </h1>
            <p className="text-[8px] md:text-xs font-bold text-slate-400 tracking-[0.2em] uppercase mt-1">
              Centro de Monitoreo
            </p>
          </div>
        </button>

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
      <main className="flex-1 mx-auto w-full p-4 md:p-10 grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-12 md:overflow-hidden">
        {/* PANEL ENERGÍA - Más delgado en móvil */}
        <section className="xl:col-span-4 tv:col-span-5! flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 md:p-8 rounded-4xl md:rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-800 h-full tv:h-auto">
            <div className="flex justify-between items-start">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 md:mb-0 flex items-center gap-2">
                <MdOutlinePower size={16} className="text-blue-500" />{" "}
                Suministro Eléctrico RCA SBL
              </h2>
              {/* INDICADOR DE CONEXIÓN */}
              <StatusIndicator timestamp={AcPlanta} />
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-1 tv:grid-cols-2! gap-3 place-content-evenly md:h-full tv:h-auto">
              <div
                className={`flex flex-col md:flex-row items-center justify-between p-3 md:p-6 rounded-2xl md:rounded-4xl border-2 ${
                  !redCorte
                    ? "bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800"
                    : "bg-red-50 border-red-500 dark:bg-red-900/30 md:animate-pulse"
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
                  !plantaEncendida
                    ? "bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800"
                    : "bg-orange-50 border-red-500 dark:bg-orange-900/30"
                }`}
              >
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-0 lg:gap-4 xl:gap-0 2xl:gap-4 text-center md:text-left">
                  <Generador
                    className={`w-15 h-15 md:w-30 md:h-30 ${
                      !plantaEncendida
                        ? "text-amber-400"
                        : "text-red-500 md:animate-pulse"
                    }`}
                  />
                  <span className="font-black text-[10px] md:text-sm uppercase italic">
                    GENERADOR
                  </span>
                </div>
                <span
                  className={`text-xs md:text-lg font-black ${
                    !plantaEncendida ? "text-amber-400" : "text-red-500"
                  }`}
                >
                  {plantaEncendida ? "ON" : "OFF"}
                </span>
              </div>
            </div>
          </div>

          {/* Estadísticas solo para TV (XL) */}
          <section className="hidden tv:flex flex-1 flex-col bg-white dark:bg-slate-900 p-6 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="mb-4 ml-2">
              <h3 className="text-slate-800 dark:text-white font-black text-sm uppercase">
                Comparativo Global
              </h3>
              <div className="flex items-center justify-between">
                <p className="text-[9px] text-slate-400 font-bold uppercase">
                  Todas las salas en tiempo real
                </p>
                <span className="text-[9px] text-slate-400 font-bold uppercase">
                  Umbrales: {umbrales?.alto ?? "--"}°C /{" "}
                  {umbrales?.bajo ?? "--"}°C
                </span>
              </div>
            </div>

            <div className="flex-1 w-full">
              <GraficaComparativa />
            </div>
          </section>
        </section>

        {/* PANEL SALAS */}
        <section className="xl:col-span-8 tv:col-span-7! flex flex-col">
          <div className="grid grid-cols-2 xl:grid-cols-2 gap-3 md:gap-10 xl:h-full">
            {Object.entries(sensores || {}).map(([sala, dataSensores]) => {
              const heartbeatSensor = heartbeat?.[sala]?.timestamp;
              const esCritico = dataSensores.temperatura >= umbrales.alto;
              const nombreSala = sala.replace("_", " ");

              return (
                <div
                  key={sala}
                  onClick={() => setSelectedSala({ id: sala, ...dataSensores })}
                  className={`relative p-4 rounded-3xl md:rounded-[3.5rem] shadow-lg md:shadow-2xl transition-all border-2 flex flex-col justify-between 
                    ${
                      esCritico
                        ? "bg-red-50 border-red-500 dark:bg-red-950/40 dark:border-red-600 md:animate-pulse"
                        : "bg-white border-white dark:bg-slate-900 dark:border-slate-800 active:scale-95"
                    }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <h3 className="text-sm md:text-3xl font-black uppercase tracking-tighter dark:text-white truncate pr-2">
                        {nombreSala}
                      </h3>
                    </div>
                    {/* INDICADOR DE CONEXIÓN */}
                    <StatusIndicator timestamp={heartbeatSensor} />
                  </div>

                  <div className="flex justify-center items-center flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-8 my-2">
                      <div className="flex items-center md:block gap-2">
                        <p
                          className={`text-3xl md:text-4xl lg:text-5xl xl:text-5xl 2xl:text-6xl font-black tracking-tighter ${
                            esCritico ? "text-red-600" : "dark:text-white"
                          }`}
                        >
                          {dataSensores.temperatura?.toFixed(1)}
                          <span className="text-xs md:text-2xl font-bold ml-2">
                            ° C
                          </span>
                        </p>
                        <div className="flex items-center gap- text-slate-400">
                          <IoMdThermometer className="hidden md:block w-4 h-4" />
                          <span className="text-[8px] md:text-xs font-black uppercase text-slate-400">
                            <span className="md:hidden">Temp</span>
                            <span className="hidden md:inline">
                              Temperatura
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center md:block gap-2 border-t md:border-t-0 md:border-l-2 border-slate-100 dark:border-slate-800 pt-1 md:pt-0 md:pl-8">
                        <p className="text-2xl md:text-3xl lg:text-4xl xl:text-4xl 2xl:text-5xl font-black tracking-tighter text-cyan-500 dark:text-cyan-400">
                          {dataSensores.humedad?.toFixed(1)}
                          <span className="text-xs md:text-2xl font-bold ml-2">
                            %
                          </span>
                        </p>
                        <div className="flex items-center gap- text-slate-400">
                          <WiHumidity className="hidden md:block w-4 h-4" />
                          <span className="text-[8px] md:text-xs font-black uppercase text-slate-400 tracking-widest">
                            <span className="md:hidden">Hum</span>
                            <span className="hidden md:inline">Humedad</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {esCritico && (
                    <div className="py-1 md:py-3 bg-red-600 text-white rounded-lg md:rounded-2xl text-[10px] sm:text-xs md:text-sm lg:text-base font-black text-center md:animate-pulse uppercase tracking-wider">
                      <span className="md:hidden">Fuera de rango</span>{" "}
                      <span className="hidden md:inline">
                        Temperatura fuera de rango
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />

      {/* MODAL */}
      {selectedSala && (
        <div className="fixed inset-0 z-50 flex  items-center justify-center p-2 bg-slate-950/80 backdrop-blur-sm transition-all">
          {/* Contenedor del Modal */}
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] overflow-hidden animate-in slide-in-from-bottom duration-300 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="px-4 py-6 md:p-8">
              {/* Cabecera */}
              <header className="flex justify-between items-center mb-2">
                <div className="text-left ml-2">
                  <h2 className="text-cyan-400 font-black text-xl tracking-tighter uppercase">
                    Live Stream {selectedSala.id.replace("_", " ")}
                  </h2>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">
                    Umbrales: {umbrales?.alto ?? "--"}°C /{" "}
                    {umbrales?.bajo ?? "--"}°C
                  </span>
                </div>
                <button
                  onClick={() => setSelectedSala(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <FaTimes className=" text-slate-400" />
                </button>
              </header>

              {/* Área de la Gráfica */}
              <div className="bg-slate-300/50 dark:bg-slate-950/50 rounded-3xl p-4 border border-slate-300/50 dark:border-slate-800">
                <GraficasTiempoReal salaId={selectedSala.id} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
