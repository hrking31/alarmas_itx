import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ref, onValue, update } from "firebase/database";
import { database } from "../../Firebase/Firebase.js";
import Footer from "../../Components/Footer/Footer.jsx";
import logo from "../../assets/Logo.png";
import { RedAc } from "../../Components/Icons/RedAc.jsx";
import { Generador } from "../../Components/Icons/Generador.jsx";
import { MdOutlinePower } from "react-icons/md";
import { IoMdThermometer } from "react-icons/io";
import { IoBatteryFull } from "react-icons/io5";
import { WiHumidity } from "react-icons/wi";
import { FaRegLightbulb, FaTimes } from "react-icons/fa";
import { useDarkMode } from "../../Context/DarkModeContext";
import StatusIndicadorElectrico from "../../Components/StatusIndicadorElectrico/StatusIndicadorElectrico.jsx";
import {
  StatusWifi,
  StatusBluetooth,
} from "../../Components/StatusIndicator/StatusIndicator.jsx";
import GraficasTiempoReal from "../../Components/GraficasTiempoReal/GraficasTiempoReal.jsx";
import GraficaComparativa from "../../Components/GraficaComparativa/GraficaComparativa.jsx";
import DateOnlyPicker from "../../Components/DateOnlyPicker/DateonlyPicker.jsx";
import ContadorPlanta from "../ContadorPlanta/ContadorPlanta.jsx";
import { useAppContext } from "../../Context/AppContext";
import Loading from "../Loading/Loading.jsx";
import SimuladorPlanta from "../SimuladorPlanta/SimuladorPlanta.jsx";
import ModalUpdateHorometro from "../ModalUpdateHorometro/ModalUpdateHorometro.jsx";

export default function App() {
  const navigate = useNavigate();
  const { darkMode, setDarkMode } = useDarkMode();
  const { showNotif } = useAppContext();
  const [sensores, setSensores] = useState(null);
  const [umbral, setUmbral] = useState(null);
  const [horas, setHoras] = useState(null);
  const [heartbeat, setHeartbeat] = useState(null);
  const [ac, setAc] = useState(0);
  const [planta, setPlanta] = useState(0);
  const [engineStartTimestamp, setEngineStartTimestamp] = useState(0);
  const [totalMsAcumulados, setTotalMsAcumulados] = useState(0);
  const [selectedSala, setSelectedSala] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() =>
    new Date().toLocaleDateString("sv-SE"),
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isPortrait, setIsPortrait] = useState(
    window.matchMedia("(orientation: portrait)").matches,
  );

  // Datos de RTBD
  const [datosHorometro, setDatosHorometro] = useState({
    totalMs: 45000000, // Ejemplo: 12.5 horas
    estado: 0,
  });

  const handleUpdateMs = async (nuevoTotalMs) => {
    try {
      const dbRef = ref(database, "energia");

      await update(dbRef, {
        totalMsAcumulados: nuevoTotalMs,
        // Se inicia al momento actual para que el contador empiece a sumar desde el nuevo valor calibrado
        engineStartTimestamp: Date.now(),
      });

      // Se actualiza el estado local
      setDatosHorometro((prev) => ({
        ...prev,
        totalMsAcumulados: nuevoTotalMs,
        engineStartTimestamp: Date.now(),
      }));

      showNotif("success", "Sincronización exitosa: Horómetro actualizado");
    } catch (error) {
      showNotif("error", "Error de red: La calibración no pudo ser enviada");
    }
  };

  // Detecta cambios de orientación para diseño del modal
  useEffect(() => {
    const onChange = () =>
      setIsPortrait(window.matchMedia("(orientation: portrait)").matches);

    window.addEventListener("orientationchange", onChange);
    window.addEventListener("resize", onChange);

    return () => {
      window.removeEventListener("orientationchange", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, []);

  // Escucha en tiempo real los cambios en RTBD para actualizar el dashboard
  useEffect(() => {
    setLoading(true);

    // Función para manejar errores de Firebase
    const handleError = (error) => {
      console.error(error);
      showNotif(
        "error",
        "ERROR DE SINCRONIZACIÓN: Pérdida de enlace con el servidor",
      );
      setLoading(false);
    };

    const sensoresRef = ref(database, "sensores");
    const umbralRef = ref(database, "configuracion/umbral");
    const horasRef = ref(database, "configuracion/horas");
    const heartbeatRef = ref(database, "heartbeat");
    const energiaRef = ref(database, "energia");

    const unsubSensores = onValue(
      sensoresRef,
      (snap) => {
        if (snap.exists()) setSensores(snap.val());
        setLoading(false);
      },
      handleError,
    );

    const unsubUmbral = onValue(
      umbralRef,
      (snap) => {
        if (snap.exists()) setUmbral(snap.val());
      },
      handleError,
    );

    const unsubHoras = onValue(
      horasRef,
      (snap) => {
        if (snap.exists()) setHoras(snap.val());
      },
      handleError,
    );

    const unsubHeartbeat = onValue(
      heartbeatRef,
      (snap) => {
        if (snap.exists()) setHeartbeat(snap.val());
      },
      handleError,
    );

    const unsubEnergia = onValue(
      energiaRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.val();
          setPlanta(data.Planta);
          setAc(data.Ac);
          setEngineStartTimestamp(data.engineStartTimestamp);
          setTotalMsAcumulados(data.totalMsAcumulados);
        }
      },
      handleError,
    );

    return () => {
      unsubSensores();
      unsubUmbral();
      unsubHoras();
      unsubHeartbeat();
      unsubEnergia();
    };
  }, []);

  const AcPlanta = heartbeat?.AcPlanta?.timestamp;
  const redCorte = ac === 1;
  const plantaEncendida = planta === 1;
  const engineStart = engineStartTimestamp || 0;
  const acumulados = totalMsAcumulados || 0;

  if (loading) {
    return (
      <div className="h-svh w-full flex items-center justify-center bg-slate-950">
        <Loading text="ESTABLECIENDO PROTOCOLOS DE SEGURIDAD..." />
      </div>
    );
  }

  return (
    <div className="min-h-svh flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500">
      {/* HEADER - Más compacto en móvil */}
      <header className="w-full mx-auto px-4 md:px-10 flex justify-between items-center shrink-0 pt-2">
        <button
          type="button"
          onClick={() => navigate("/ViewLogin")}
          className="flex items-center gap-1 group focus:outline-none"
        >
          <img
            src={logo}
            alt="Alarmas ITX"
            className="w-auto h-10 md:h-16 object-contain transition-transform duration-200 group-hover:scale-105"
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

        {/* <SimuladorPlanta /> */}

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
      <main className="flex-1 mx-auto w-full p-4 md:p-10 flex flex-col xl:grid xl:grid-cols-12 gap-4 md:gap-12 md:overflow-hidden">
        {/* PANEL ENERGÍA - Más delgado en móvil */}
        <section className="flex-1 xl:flex-none xl:col-span-4 tv:col-span-5! flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 md:p-8 rounded-4xl md:rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 h-full tv:h-auto">
            <div className="flex justify-between items-start">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 md:mb-0 flex items-center gap-2">
                <MdOutlinePower size={16} className="text-blue-500" />{" "}
                Suministro Eléctrico RCA SBL
              </h2>
              {/* INDICADOR DE CONEXIÓN */}
              <StatusIndicadorElectrico timestamp={AcPlanta} />
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-1 tv:grid-cols-2! gap-4 md:p-2 md:pb-2 md:h-full tv:h-auto">
              {/* INDICADOR ESTADO RED */}
              <div
                className={`flex flex-col items-center justify-center rounded-2xl md:rounded-4xl border-2 gap-1 ${
                  !redCorte
                    ? "bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800"
                    : "bg-red-50 border-red-500 dark:bg-red-900/30 md:animate-pulse"
                }`}
              >
                <RedAc
                  className={`w-15 h-25 md:w-30 md:h-25 ${
                    !redCorte ? "text-green-500" : "text-red-500 "
                  }`}
                />
                <div className="flex flex-col items-center text-center">
                  <span className="font-black text-[10px] md:text-sm uppercase italic">
                    Red Comercial
                  </span>
                </div>
                <span
                  className={`text-xs md:text-lg font-black pb-2 ${
                    !redCorte ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {!redCorte ? "OK" : "CORTE"}
                </span>
              </div>

              {/* INDICADOR ESTADO GENERADOR */}
              <div
                className={`flex flex-col items-center justify-center rounded-2xl md:rounded-4xl border-2 ${
                  !plantaEncendida
                    ? "bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800"
                    : "bg-orange-50 border-red-500 dark:bg-orange-900/30"
                }`}
              >
                <Generador
                  className={`block w-30 h-14 md:w-60 md:h-18 ${
                    !plantaEncendida
                      ? "text-amber-400"
                      : "text-red-500 md:animate-pulse"
                  }`}
                />

                <span className="font-black text-[10px] md:text-sm uppercase italic">
                  GENERADOR
                </span>

                <span
                  className={`text-xs md:text-lg font-black ${
                    !plantaEncendida ? "text-amber-400" : "text-red-500"
                  }`}
                >
                  {plantaEncendida ? "ON" : "OFF"}
                </span>

                <div
                  onClick={() => setIsModalOpen(true)}
                  className="w-fit h-fit cursor-pointer hover:scale-105 transition-transform pb-2"
                >
                  <ContadorPlanta
                    estado={plantaEncendida}
                    engineStartTimestamp={engineStart}
                    totalMsAcumulados={acumulados}
                  />
                </div>

                <ModalUpdateHorometro
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  onSave={handleUpdateMs}
                  // Pasamos el valor actual convertido a string de 6 dígitos
                  valorActual={
                    Math.floor(datosHorometro.totalMs / 3600000)
                      .toString()
                      .padStart(5, "0") +
                    Math.floor(
                      ((datosHorometro.totalMs / 3600000) % 1) * 10,
                    ).toString()
                  }
                />
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
                <span className="text-[9px] text-slate-400 font-bold">
                  UMBRAL: {umbral?.alto ?? "--"}°C / HORAS:{" "}
                  {horas?.visible ?? "--"}h
                </span>
              </div>
            </div>

            <div className="flex-1 w-full">
              <GraficaComparativa />
            </div>
          </section>
        </section>

        {/* PANEL SALAS */}
        <section className="flex-1 xl:flex-none xl:col-span-8 tv:col-span-7! flex flex-col">
          <div className="grid grid-cols-2 gap-3 md:gap-10 flex-1">
            {Object.entries(sensores || {}).map(([sala, dataSensores]) => {
              const temperatura = dataSensores.temperatura;
              const humedad = dataSensores.humedad;
              const bateria = dataSensores.bateria;

              // Si es Sala 4 y su estado Bluetooth
              const esSala4 = sala === "Sala_4";
              const bluetoothOK = dataSensores?.estado === "online";

              // Estado del ESP (Sala 1, 2,3)
              const heartbeatSensor = heartbeat?.[sala]?.timestamp;
              const espOnline =
                heartbeatSensor && Date.now() - heartbeatSensor < 90000;

              // Si es Sala 4, necesita ESP + BT. Si es otra, solo ESP.
              const conexionTotalOk = esSala4
                ? espOnline && bluetoothOK
                : espOnline;

              const tempMostrar =
                !conexionTotalOk || isNaN(Number(temperatura))
                  ? "—"
                  : Number(temperatura).toFixed(1);

              const humMostrar =
                !conexionTotalOk || isNaN(Number(humedad))
                  ? "—"
                  : Number(humedad).toFixed(1);

              const batMostrar =
                !conexionTotalOk || isNaN(Number(bateria))
                  ? "—"
                  : Number(bateria).toFixed(0);

              const esCritico =
                conexionTotalOk &&
                dataSensores.temperatura >= (umbral?.alto ?? Infinity);
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
                  <div className="flex justify-between items-start md:m-4">
                    <div className="flex flex-col">
                      <h3 className="text-sm md:text-3xl font-black uppercase tracking-tighter dark:text-white truncate pr-2">
                        {nombreSala}
                      </h3>
                    </div>

                    {/* COLUMNA ESTADO */}
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex flex-row gap-2">
                        {/* INDICADOR DE CONEXIÓN */}
                        <StatusWifi isOnline={espOnline} />
                        {esSala4 && <StatusBluetooth isOnline={bluetoothOK} />}
                      </div>
                      {/* INDICADOR DE BATERÍA */}
                      {bateria !== undefined && bateria !== null && (
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <IoBatteryFull className="w-3 h-3 md:w-5 md:h-5" />

                          <span className="text-[10px] md:text-sm font-bold">
                            {batMostrar}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center items-center flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-8 my-2">
                      <div className="flex items-center md:block gap-2">
                        <p
                          className={`text-3xl md:text-4xl lg:text-5xl xl:text-5xl 2xl:text-6xl font-black tracking-tighter ${
                            esCritico ? "text-red-600" : "dark:text-white"
                          }`}
                        >
                          {tempMostrar}
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
                          {humMostrar}
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
                    <div className="sm:px-6 md:px-8">
                      <div className="w-full p-1 md:p-2 bg-red-600 text-white rounded-lg md:rounded-2xl text-[10px] sm:text-xs md:text-sm lg:text-base font-black text-center md:animate-pulse uppercase tracking-wider">
                        <span className="md:hidden">Fuera de rango</span>
                        <span className="hidden md:inline">
                          Temperatura fuera de rango
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />

      {/* MODAL GRÁFICA */}
      {selectedSala && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm transition-all">
          {/* Contenedor del Modal */}
          <div
            className={`bg-white dark:bg-slate-900 w-screen overflow-hidden animate-in slide-in-from-bottom duration-300 shadow-2xl border border-slate-200 dark:border-slate-800 ${
              isPortrait ? "max-w-2xl rounded-[2.5rem]" : "h-screen"
            }
        `}
          >
            <div className="p-3 md:p-6 h-full flex flex-col">
              <header className="flex justify-between items-center mb-2 shrink-0">
                <div className="ml-2 flex flex-col leading-tight">
                  <h2 className="text-cyan-400 font-black text-xl tracking-tighter uppercase">
                    {fechaSeleccionada ===
                    new Date().toLocaleDateString("sv-SE")
                      ? "Live Stream"
                      : "Record"}{" "}
                    {selectedSala.id.replace("_", " ")}
                  </h2>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">
                    Umbral: {umbral?.alto ?? "--"}°C
                  </span>
                </div>

                {/* Selector de fecha */}
                <div className="flex items-center gap-2">
                  <DateOnlyPicker
                    fechaSeleccionada={fechaSeleccionada}
                    setFechaSeleccionada={setFechaSeleccionada}
                    soloIcono={isPortrait}
                  />
                </div>

                {/* Botón de salida */}
                <button
                  onClick={() => setSelectedSala(null)}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <FaTimes className="text-slate-400 dark:text-cyan-400" />
                </button>
              </header>

              <div className="flex-1 bg-slate-300/50 dark:bg-slate-950/50 rounded-3xl p-2 md:p-4 border border-slate-300/50 dark:border-slate-800 overflow-hidden">
                <GraficasTiempoReal
                  salaId={selectedSala.id}
                  isPortrait={isPortrait}
                  fechaSeleccionada={fechaSeleccionada}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
