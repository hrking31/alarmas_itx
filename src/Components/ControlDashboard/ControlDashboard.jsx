import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../Firebase/Firebase";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import {
  FaTelegramPlane,
  FaKey,
  FaUserPlus,
  FaTrashAlt,
  FaRegLightbulb,
} from "react-icons/fa";
import { useAuth } from "../../Context/AuthContext.jsx";
import { IoShieldCheckmarkSharp } from "react-icons/io5";
import Footer from "../../Components/Footer/Footer.jsx";

export default function ControlDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  // CONFIG_ID: Usaremos un documento fijo para la configuración global
  const CONFIG_ID = "telegram_config";

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true"
  );
  const [token, setToken] = useState("");
  const [isTokenSaved, setIsTokenSaved] = useState(false);
  const [chatName, setChatName] = useState("");
  const [chatId, setChatId] = useState("");
  const [chatList, setChatList] = useState([]);
  const [loading, setLoading] = useState(true);

  const handlerLogout = async () => {
    await logout();
  };

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // 1. Cargar configuración inicial desde Firestore
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, "configuraciones", CONFIG_ID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.botToken) setIsTokenSaved(true);
          setChatList(data.receptores || []);
        }
      } catch (error) {
        console.error("Error cargando config:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // 2. Guardar Token
  const handleSaveToken = async (e) => {
    e.preventDefault();
    if (!token.trim()) return;
    try {
      const docRef = doc(db, "configuraciones", CONFIG_ID);

      // USAMOS setDoc: Si no existe, lo crea. Si existe, solo cambia el token.
      await setDoc(docRef, { botToken: token }, { merge: true });

      setIsTokenSaved(true);
      setToken("");
      alert("Token vinculado y guardado en la base de datos.");
    } catch (error) {
      console.error("Error al guardar token:", error);
    }
  };

  // 3. Añadir Receptor ID Chat
  const handleAddChat = async (e) => {
    e.preventDefault();
    if (chatName && chatId) {
      const nuevoReceptor = { id: chatId, name: chatName };
      try {
        const docRef = doc(db, "configuraciones", CONFIG_ID);

        // USAMOS setDoc: Si es el primer ID, crea la colección y la lista.
        await setDoc(
          docRef,
          {
            receptores: arrayUnion(nuevoReceptor),
          },
          { merge: true }
        );

        setChatList([...chatList, nuevoReceptor]);
        setChatName("");
        setChatId("");
      } catch (error) {
        console.error("Error al añadir receptor:", error);
      }
    }
  };

  // 4. Eliminar Receptor
  const removeChat = async (chatObj) => {
    try {
      const docRef = doc(db, "configuraciones", CONFIG_ID);
      await updateDoc(docRef, {
        receptores: arrayRemove(chatObj),
      });
      setChatList(chatList.filter((c) => c.id !== chatObj.id));
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500 font-mono italic">
        CARGANDO PROTOCOLOS...
      </div>
    );

  return (
    <div className="h-screen flex flex-col verflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500">
      {/* HEADER */}
      <header className="w-full mx-auto px-3 md:px-8 flex justify-between items-center shrink-0 py-1.5 md:pt-2">
        <div className="flex items-center gap-2 md:gap-4">
          <button
            className="bg-blue-500/20 p-2 md:p-3 rounded-xl md:rounded-2xl border border-blue-500/30"
            onClick={() => {
              handlerLogout();
              navigate("/");
            }}
          >
            <FaTelegramPlane className="text-xl md:text-3xl text-blue-400" />
          </button>

          <div>
            <h1 className="text-lg md:text-3xl font-black uppercase italic tracking-tight md:tracking-tighter leading-none text-white">
              Control <span className="text-emerald-500">Notificaciones</span>
            </h1>
            <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em] md:tracking-[0.3em]">
              Módulo de enlace Telegram
            </p>
          </div>
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 md:p-4 rounded-lg md:rounded-xl bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 active:scale-90 transition-all"
        >
          <FaRegLightbulb
            className={`w-4 h-4 md:w-5 md:h-5 ${
              !darkMode ? "text-green-500" : "text-red-500"
            }`}
          />
        </button>
      </header>

      {/* SECCIÓN TOKEN + CHAT */}
      <div className="w-full mx-auto p-4 md:px-10 md:py-4 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-16 shrink-0">
        {/* SECCIÓN TOKEN */}
        <section className="bg-slate-900/50 border border-slate-800 p-4 md:p-6 rounded-2xl transition-all hover:border-emerald-500/30">
          <div className="flex items-center gap-3 mb-3 md:mb-6">
            <FaKey className="text-emerald-500" />
            <h2 className="font-black uppercase tracking-widest text-sm text-slate-400">
              Bot API Token
            </h2>
          </div>

          {!isTokenSaved ? (
            <form onSubmit={handleSaveToken} className="space-y-2 md:space-y-4">
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token from BotFather..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 transition-all"
              />
              <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black py-2 rounded-lg text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-emerald-900/20">
                Vincular Terminal
              </button>
            </form>
          ) : (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IoShieldCheckmarkSharp className="text-2xl text-emerald-500 animate-pulse" />
                <div>
                  <p className="text-[10px] font-black uppercase text-emerald-500 tracking-tighter">
                    Enlace Seguro Establecido
                  </p>
                  <p className="text-[9px] font-mono text-slate-600">
                    •••••••••••••••••••••••••
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTokenSaved(false)}
                className="text-[9px] font-bold text-slate-500 hover:text-white uppercase tracking-widest"
              >
                Reset
              </button>
            </div>
          )}
        </section>

        {/* SECCIÓN NUEVO CHAT */}
        <section className="bg-slate-900/50 border border-slate-800 p-4 sm:p-6 rounded-2xl transition-all hover:border-blue-500/30">
          <div className="flex items-center gap-3 mb-3 md:mb-6">
            <FaUserPlus className="text-blue-500" />
            <h2 className="font-black uppercase tracking-widest text-sm text-slate-400">
              Nuevo Receptor
            </h2>
          </div>
          <form onSubmit={handleAddChat} className="space-y-2 md:space-y-4">
            <input
              type="text"
              placeholder="Nombre del responsable"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Chat ID (Numérico)"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-mono text-blue-400 focus:outline-none focus:border-blue-500"
            />
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-2 rounded-lg text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-900/20">
              Añadir ID
            </button>
          </form>
        </section>
      </div>

      {/* LISTA NODOS RECEPCION */}
      <div className="mx-auto w-full px-4 md:px-10 min-h-0 md:flex-1">
        <section className="bg-slate-900/30 border border-slate-800 rounded-2xl h-full flex flex-col">
          {/* HEADER FIJO */}
          <div className="bg-slate-800/50 px-6 py-3 border-b border-slate-800 rounded-t-2xl flex justify-between shrink-0">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Nodos de Recepción
            </h3>
            <span className="text-[9px] font-mono text-emerald-500">
              {chatList.length} Online
            </span>
          </div>

          {/* LISTA NODOS */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-custom divide-y divide-slate-800/50">
            {chatList.map((chat) => (
              <div
                key={chat.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-white/1 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center font-black text-emerald-500 text-xs group-hover:border-emerald-500/40">
                    {chat.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-200">
                      {chat.name}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500">
                      ID: {chat.id}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => removeChat(chat)}
                  className="p-2.5 text-slate-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <FaTrashAlt />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
