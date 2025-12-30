import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { database } from "../../Firebase/Firebase";
import { ref, update, onValue } from "firebase/database";
import {
  FaTelegramPlane,
  FaKey,
  FaUserPlus,
  FaTrashAlt,
  FaRegLightbulb,
  FaTemperatureHigh,
  FaTimes,
  FaUsers,
} from "react-icons/fa";
import { useAuth } from "../../Context/AuthContext.jsx";
import { useAppContext } from "../../Context/AppContext";
import { useDarkMode } from "../../Context/DarkModeContext";
import { IoShieldCheckmarkSharp } from "react-icons/io5";
import Loading from "../Loading/Loading.jsx";
import Footer from "../../Components/Footer/Footer.jsx";

export default function ControlDashboard() {
  const navigate = useNavigate();
  const { showNotif, confirmAction } = useAppContext();
  const { logout } = useAuth();
  const { darkMode, setDarkMode } = useDarkMode();
  const [token, setToken] = useState("");
  const [isTokenSaved, setIsTokenSaved] = useState(false);
  const [chatName, setChatName] = useState("");
  const [chatId, setChatId] = useState("");
  const [chatList, setChatList] = useState([]);
  const [tempMax, setTempMax] = useState("");
  const [tempMin, setTempMin] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlerLogout = async () => {
    await logout();
  };

  // Cargar configuración inicial desde realtime database
  useEffect(() => {
    const configRef = ref(database, "configuracion");

    const unsubscribe = onValue(configRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.telegram?.botToken) {
          setIsTokenSaved(true);
        } else {
          setIsTokenSaved(false);
        }
        setChatList(data.telegram?.receptores || []);
        setTempMax(data.umbrales?.alto || "");
        setTempMin(data.umbrales?.bajo || "");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Guardar Token
  const handleSaveToken = async (e) => {
    e.preventDefault();
    if (!token.trim()) {
      showNotif("warning", "El campo del Token está vacío");
      return;
    }
    const seguro = await confirmAction(
      "¿Actualizar Token? Esto cambiará la vinculación del Bot de Telegram"
    );
    if (!seguro) return;
    try {
      await update(ref(database, "configuracion/telegram"), {
        botToken: token,
      });

      showNotif("success", "Protocolo: Token de acceso actualizado");
      setToken("");
    } catch (error) {
      console.error(error);
      showNotif("error", "Error de red: No se pudo sincronizar el Token");
    }
  };

  // Añadir Receptor ID Chat
  const handleAddChat = async (e) => {
    e.preventDefault();

    if (chatName && chatId) {
      const nuevoReceptor = {
        id: chatId,
        name: chatName,
      };
      const nuevaLista = [...chatList, nuevoReceptor];
      try {
        await update(ref(database, "configuracion/telegram"), {
          receptores: nuevaLista,
        });

        showNotif("success", `Terminal: Receptor ${chatName} vinculado`);

        setChatName("");
        setChatId("");
      } catch (error) {
        console.error(error);
        showNotif("error", "Fallo en la sincronización de protocolo");
      }
    } else {
      showNotif("warning", "Datos insuficientes para la vinculación");
    }
  };

  // Eliminar Receptor
  const removeChat = async (chatObj) => {
    const seguro = await confirmAction(
      `¿Deseas eliminar a ${chatObj.first_name || "este contacto"} del sistema?`
    );

    if (!seguro) return;

    const nuevaLista = chatList.filter((c) => c.id !== chatObj.id);

    try {
      // Actualizar base de datos
      await update(ref(database, "configuracion/telegram"), {
        receptores: nuevaLista,
      });

      showNotif("success", "Protocolo: Receptor eliminado correctamente");
    } catch (error) {
      console.error(error);
      showNotif(
        "error",
        "Error crítico: No se pudo actualizar la base de datos"
      );
    }
  };

  // Guardar Umbrales (tempMax y tempMin)
  const handleSaveThresholds = async (e) => {
    e.preventDefault();
    try {
      await update(ref(database, "configuracion/umbrales"), {
        alto: Number(tempMax),
        bajo: Number(tempMin),
      });

      showNotif("success", "Protocolo: Umbrales actualizados correctamente");
    } catch (error) {
      console.error(error);
      showNotif("error", "Fallo en la conexión con la base de datos");
    }
  };

  // Sub-componente lista nodos
  const UsersList = () => (
    <div className="overflow-y-auto scrollbar-custom divide-y divide-slate-100 dark:divide-slate-800/50">
      {chatList.length > 0 ? (
        chatList.map((chat) => (
          <div
            key={chat.id}
            className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center font-black text-emerald-600 dark:text-emerald-500 text-xs shadow-sm">
                {chat.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {chat.name}
                </p>
                <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                  ID: {chat.id}
                </p>
              </div>
            </div>
            <button
              onClick={() => removeChat(chat)}
              className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
            >
              <FaTrashAlt className="text-sm" />
            </button>
          </div>
        ))
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <p className="text-xs uppercase tracking-widest font-bold p-4">
            Sin receptores configurados
          </p>
        </div>
      )}
    </div>
  );

  if (loading) return <Loading text="CARGANDO PROTOCOLOS..." />;

  return (
    <div className="h-svh flex flex-col overflow-y-auto scrollbar-custom bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500">
      {/* HEADER */}
      <header className="w-full mx-auto px-4 pt-2 md:px-10 flex justify-between items-center shrink-0 md:py-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
        <div className="flex items-center gap-2 md:gap-4">
          <button
            className="bg-blue-500/10 dark:bg-blue-500/20 p-2 md:p-3 rounded-xl border border-blue-500/20 dark:border-blue-500/30 transition-transform active:scale-95 shadow-sm"
            onClick={() => {
              handlerLogout();
              navigate("/");
            }}
          >
            <FaTelegramPlane className="text-xl md:text-2xl text-blue-500 dark:text-blue-400" />
          </button>

          <div>
            <h1 className="text-lg md:text-2xl font-black uppercase italic tracking-tighter leading-none dark:text-white text-slate-800">
              Control <span className="text-emerald-500">Notificaciones</span>
            </h1>
            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
              Módulo de enlace Telegram
            </p>
          </div>
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 md:p-3 rounded-xl bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-800 active:scale-90 transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <FaRegLightbulb
            className={`w-4 h-4 md:w-5 md:h-5 ${
              !darkMode ? "text-amber-500" : "text-emerald-500"
            }`}
          />
        </button>
      </header>

      {/* ÁREA DE CONFIGURACIÓN */}
      <div className="flex-1 grid grid-cols-12 w-full mx-auto px-4 pt-4 md:pb-4 md:px-10 gap-4 md:items-center">
        {/* SECCIÓN TOKEN */}
        <section className="flex flex-col md:max-h-80 md:min-h-65 lg:max-h-90 lg:min-h-75 col-span-12 md:col-span-6 lg:col-span-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:border-emerald-500/30 transition-all">
          <div className="flex items-center gap-3 mb-2">
            <FaKey className="text-emerald-500" />
            <h2 className="font-black uppercase tracking-widest text-xs text-slate-500 dark:text-slate-400">
              Bot API Token
            </h2>
          </div>
          {!isTokenSaved ? (
            <form
              onSubmit={handleSaveToken}
              className="flex flex-col flex-1 justify-evenly gap-2"
            >
              <div className="flex gap-4">
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste Token..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-mono text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="flex flex-col ">
                <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white dark:text-slate-950 font-black py-2 md:py-3 rounded-lg text-[10px] uppercase tracking-widest transition-all">
                  Vincular
                </button>
              </div>
            </form>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between w-full max-w-sm">
                <div className="flex items-center gap-2">
                  <IoShieldCheckmarkSharp className="text-xl text-emerald-500 animate-pulse" />
                  <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-500">
                    Enlace Activo
                  </p>
                </div>
                <button
                  onClick={() => setIsTokenSaved(false)}
                  className="text-[9px] font-bold text-slate-400 hover:text-red-500 uppercase"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </section>
        {/* SECCIÓN UMBRALES TEMP */}
        <section className="flex flex-col md:max-h-80 md:min-h-65 lg:max-h-90 lg:min-h-75 col-span-12 md:col-span-6 lg:col-span-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:border-orange-500/30 transition-all">
          <div className="flex items-center gap-3 mb-2">
            <FaTemperatureHigh className="text-orange-500" />
            <h2 className="font-black uppercase tracking-widest text-xs text-slate-500 dark:text-slate-400">
              Alertas Temp
            </h2>
          </div>

          <form
            onSubmit={handleSaveThresholds}
            className="flex flex-col flex-1 justify-evenly gap-2"
          >
            <div className="flex gap-4">
              <input
                type="number"
                value={tempMax}
                onChange={(e) => setTempMax(e.target.value)}
                placeholder="Máx °C"
                className="w-1/2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-mono text-orange-600 dark:text-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <input
                type="number"
                value={tempMin}
                onChange={(e) => setTempMin(e.target.value)}
                placeholder="Mín °C"
                className="w-1/2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-mono text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col ">
              <button className="mt-auto w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-2 md:py-3 rounded-lg text-[10px] uppercase tracking-widest">
                Actualizar Rangos
              </button>
            </div>
          </form>
        </section>

        {/* SECCIÓN NUEVO RECEPTOR */}
        <section className="flex flex-col md:max-h-80 md:min-h-65 lg:max-h-90 lg:min-h-75 col-span-12 md:col-span-12 lg:col-span-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:border-blue-500/30 transition-all">
          <div className="flex items-center gap-3 mb-2">
            <FaUserPlus className="text-blue-500" />
            <h2 className="font-black uppercase tracking-widest text-xs text-slate-500 dark:text-slate-400">
              Nuevo Receptor
            </h2>
          </div>
          <form
            onSubmit={handleAddChat}
            className="flex flex-col flex-1 justify-evenly gap-2"
          >
            <div className="space-y-3 md:space-y-6">
              <input
                type="text"
                placeholder="Responsable"
                value={chatName}
                onChange={(e) => setChatName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm text-slate-600 dark:text-slate-300 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Chat ID"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-mono text-blue-600 dark:text-blue-400 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-4">
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-2 md:py-3 rounded-lg text-[10px] uppercase tracking-widest">
                Registrar ID
              </button>
            </div>
          </form>

          {/* BOTON PARA ABRIR MODAL VISIBLE SOLO MOVIL */}
          <div className="mt-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="md:hidden w-full bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-lg px-6 py-3 flex justify-between items-center shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FaUsers className="text-[20px] text-blue-500" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Nodos de Recepción
                </h3>
              </div>

              <span
                className={`px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 text-[9px] font-mono font-bold border border-emerald-500/20 ${
                  chatList.length > 0 ? "animate-pulse" : ""
                }`}
              >
                {chatList.length} Online
              </span>
            </button>
          </div>
        </section>
      </div>

      {/* LISTA DE NODOS PC */}
      <div className="flex-1 hidden md:block w-full mx-auto px-4 md:px-10 min-h-50">
        <section className="bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col shadow-sm overflow-hidden md:h-full">
          <div className="bg-slate-100 dark:bg-slate-800/50 px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              <FaUsers className="text-[20px] text-blue-500" />
              Nodos de Recepción
            </h3>

            <span
              className={`px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 text-[9px] font-mono font-bold border border-emerald-500/20 ${
                chatList.length > 0 ? "animate-pulse" : ""
              }`}
            >
              {chatList.length} Online
            </span>
          </div>

          <div className="md:flex flex-col overflow-y-auto">
            <UsersList />
          </div>
        </section>
      </div>

      {/* MODAL LISTA DE NODOS PARA MÓVIL */}
      {isModalOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300 p-4">
          <div className="w-full max-w-md max-h-[80vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-800 flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-500">
            {/* Header Modal */}
            <div className="p-8 py-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-black uppercase italic dark:text-white">
                  Lista de <span className="text-emerald-500">Receptores</span>
                </h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {chatList.length} Dispositivos
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-500"
              >
                <FaTimes />
              </button>
            </div>
            <UsersList />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
