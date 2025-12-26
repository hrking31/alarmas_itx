// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { db } from "../../Firebase/Firebase";
// import {
//   doc,
//   setDoc,
//   getDoc,
//   updateDoc,
//   arrayUnion,
//   arrayRemove,
// } from "firebase/firestore";
// import {
//   FaTelegramPlane,
//   FaKey,
//   FaUserPlus,
//   FaTrashAlt,
//   FaRegLightbulb,
// } from "react-icons/fa";
// import { useAuth } from "../../Context/AuthContext.jsx";
// import { useDarkMode } from "../../Context/DarkModeContext";
// import { IoShieldCheckmarkSharp } from "react-icons/io5";
// import Footer from "../../Components/Footer/Footer.jsx";

// export default function ControlDashboard() {
//   const navigate = useNavigate();
//   const { logout } = useAuth();
//   const { darkMode, setDarkMode } = useDarkMode();
//   // CONFIG_ID: Usaremos un documento fijo para la configuración global
//   const CONFIG_ID = "telegram_config";

//   const [token, setToken] = useState("");
//   const [isTokenSaved, setIsTokenSaved] = useState(false);
//   const [chatName, setChatName] = useState("");
//   const [chatId, setChatId] = useState("");
//   const [chatList, setChatList] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const handlerLogout = async () => {
//     await logout();
//   };

//   // 1. Cargar configuración inicial desde Firestore
//   useEffect(() => {
//     const fetchConfig = async () => {
//       try {
//         const docRef = doc(db, "configuraciones", CONFIG_ID);
//         const docSnap = await getDoc(docRef);
//         if (docSnap.exists()) {
//           const data = docSnap.data();
//           if (data.botToken) setIsTokenSaved(true);
//           setChatList(data.receptores || []);
//         }
//       } catch (error) {
//         console.error("Error cargando config:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchConfig();
//   }, []);

//   // 2. Guardar Token
//   const handleSaveToken = async (e) => {
//     e.preventDefault();
//     if (!token.trim()) return;
//     try {
//       const docRef = doc(db, "configuraciones", CONFIG_ID);

//       // USAMOS setDoc: Si no existe, lo crea. Si existe, solo cambia el token.
//       await setDoc(docRef, { botToken: token }, { merge: true });

//       setIsTokenSaved(true);
//       setToken("");
//       alert("Token vinculado y guardado en la base de datos.");
//     } catch (error) {
//       console.error("Error al guardar token:", error);
//     }
//   };

//   // 3. Añadir Receptor ID Chat
//   const handleAddChat = async (e) => {
//     e.preventDefault();
//     if (chatName && chatId) {
//       const nuevoReceptor = { id: chatId, name: chatName };
//       try {
//         const docRef = doc(db, "configuraciones", CONFIG_ID);

//         // USAMOS setDoc: Si es el primer ID, crea la colección y la lista.
//         await setDoc(
//           docRef,
//           {
//             receptores: arrayUnion(nuevoReceptor),
//           },
//           { merge: true }
//         );

//         setChatList([...chatList, nuevoReceptor]);
//         setChatName("");
//         setChatId("");
//       } catch (error) {
//         console.error("Error al añadir receptor:", error);
//       }
//     }
//   };

//   // 4. Eliminar Receptor
//   const removeChat = async (chatObj) => {
//     try {
//       const docRef = doc(db, "configuraciones", CONFIG_ID);
//       await updateDoc(docRef, {
//         receptores: arrayRemove(chatObj),
//       });
//       setChatList(chatList.filter((c) => c.id !== chatObj.id));
//     } catch (error) {
//       console.error("Error al eliminar:", error);
//     }
//   };

//   if (loading)
//     return (
//       <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500 font-mono italic">
//         CARGANDO PROTOCOLOS...
//       </div>
//     );

//   return (
//     <div className="h-svh flex flex-col verflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500">
//       {/* HEADER */}
//       <header className="w-full mx-auto px-3 md:px-8 flex justify-between items-center shrink-0 py-1.5 md:pt-2">
//         <div className="flex items-center gap-2 md:gap-4">
//           <button
//             className="bg-blue-500/20 p-2 md:p-3 rounded-xl md:rounded-2xl border border-blue-500/30"
//             onClick={() => {
//               handlerLogout();
//               navigate("/");
//             }}
//           >
//             <FaTelegramPlane className="text-xl md:text-3xl text-blue-400" />
//           </button>

//           <div>
//             <h1 className="text-lg md:text-3xl font-black uppercase italic tracking-tight md:tracking-tighter leading-none text-white">
//               Control <span className="text-emerald-500">Notificaciones</span>
//             </h1>
//             <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em] md:tracking-[0.3em]">
//               Módulo de enlace Telegram
//             </p>
//           </div>
//         </div>

//         <button
//           onClick={() => setDarkMode(!darkMode)}
//           className="p-2 md:p-4 rounded-lg md:rounded-xl bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 active:scale-90 transition-all"
//         >
//           <FaRegLightbulb
//             className={`w-4 h-4 md:w-5 md:h-5 ${
//               !darkMode ? "text-green-500" : "text-red-500"
//             }`}
//           />
//         </button>
//       </header>

//       {/* SECCIÓN TOKEN + CHAT */}
//       <div className="w-full mx-auto p-4 md:px-10 md:py-4 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-16 shrink-0">
//         {/* SECCIÓN TOKEN */}
//         <section className="bg-slate-900/50 border border-slate-800 p-4 md:p-6 rounded-2xl transition-all hover:border-emerald-500/30">
//           <div className="flex items-center gap-3 mb-3 md:mb-6">
//             <FaKey className="text-emerald-500" />
//             <h2 className="font-black uppercase tracking-widest text-sm text-slate-400">
//               Bot API Token
//             </h2>
//           </div>

//           {!isTokenSaved ? (
//             <form onSubmit={handleSaveToken} className="space-y-2 md:space-y-4">
//               <input
//                 type="password"
//                 value={token}
//                 onChange={(e) => setToken(e.target.value)}
//                 placeholder="Paste token from BotFather..."
//                 className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 transition-all"
//               />
//               <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black py-2 rounded-lg text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-emerald-900/20">
//                 Vincular Terminal
//               </button>
//             </form>
//           ) : (
//             <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 <IoShieldCheckmarkSharp className="text-2xl text-emerald-500 animate-pulse" />
//                 <div>
//                   <p className="text-[10px] font-black uppercase text-emerald-500 tracking-tighter">
//                     Enlace Seguro Establecido
//                   </p>
//                   <p className="text-[9px] font-mono text-slate-600">
//                     •••••••••••••••••••••••••
//                   </p>
//                 </div>
//               </div>
//               <button
//                 onClick={() => setIsTokenSaved(false)}
//                 className="text-[9px] font-bold text-slate-500 hover:text-white uppercase tracking-widest"
//               >
//                 Reset
//               </button>
//             </div>
//           )}
//         </section>

//         {/* SECCIÓN NUEVO CHAT */}
//         <section className="bg-slate-900/50 border border-slate-800 p-4 sm:p-6 rounded-2xl transition-all hover:border-blue-500/30">
//           <div className="flex items-center gap-3 mb-3 md:mb-6">
//             <FaUserPlus className="text-blue-500" />
//             <h2 className="font-black uppercase tracking-widest text-sm text-slate-400">
//               Nuevo Receptor
//             </h2>
//           </div>
//           <form onSubmit={handleAddChat} className="space-y-2 md:space-y-4">
//             <input
//               type="text"
//               placeholder="Nombre del responsable"
//               value={chatName}
//               onChange={(e) => setChatName(e.target.value)}
//               className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
//             />
//             <input
//               type="text"
//               placeholder="Chat ID (Numérico)"
//               value={chatId}
//               onChange={(e) => setChatId(e.target.value)}
//               className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-mono text-blue-400 focus:outline-none focus:border-blue-500"
//             />
//             <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-2 rounded-lg text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-900/20">
//               Añadir ID
//             </button>
//           </form>
//         </section>
//       </div>

//       {/* LISTA NODOS RECEPCION */}
//       <div className="mx-auto w-full px-4 md:px-10 min-h-0 md:flex-1">
//         <section className="bg-slate-900/30 border border-slate-800 rounded-2xl h-full flex flex-col">
//           {/* HEADER FIJO */}
//           <div className="bg-slate-800/50 px-6 py-3 border-b border-slate-800 rounded-t-2xl flex justify-between shrink-0">
//             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
//               Nodos de Recepción
//             </h3>
//             <span className="text-[9px] font-mono text-emerald-500">
//               {chatList.length} Online
//             </span>
//           </div>

//           {/* LISTA NODOS */}
//           <div className="flex-1 min-h-0 overflow-y-auto scrollbar-custom divide-y divide-slate-800/50">
//             {chatList.map((chat) => (
//               <div
//                 key={chat.id}
//                 className="flex items-center justify-between px-6 py-4 hover:bg-white/1 transition-colors group"
//               >
//                 <div className="flex items-center gap-4">
//                   <div className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center font-black text-emerald-500 text-xs group-hover:border-emerald-500/40">
//                     {chat.name.charAt(0)}
//                   </div>
//                   <div>
//                     <p className="text-sm font-bold text-slate-200">
//                       {chat.name}
//                     </p>
//                     <p className="text-[10px] font-mono text-slate-500">
//                       ID: {chat.id}
//                     </p>
//                   </div>
//                 </div>

//                 <button
//                   onClick={() => removeChat(chat)}
//                   className="p-2.5 text-slate-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
//                 >
//                   <FaTrashAlt />
//                 </button>
//               </div>
//             ))}
//           </div>
//         </section>
//       </div>

//       <Footer />
//     </div>
//   );
// }







// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { db } from "../../Firebase/Firebase";
// import {
//   doc,
//   setDoc,
//   getDoc,
//   updateDoc,
//   arrayUnion,
//   arrayRemove,
// } from "firebase/firestore";
// import {
//   FaTelegramPlane,
//   FaKey,
//   FaUserPlus,
//   FaTrashAlt,
//   FaRegLightbulb,
//   FaTemperatureHigh,
// } from "react-icons/fa";
// import { useAuth } from "../../Context/AuthContext.jsx";
// import { useDarkMode } from "../../Context/DarkModeContext";
// import { IoShieldCheckmarkSharp } from "react-icons/io5";
// import Footer from "../../Components/Footer/Footer.jsx";

// export default function ControlDashboard() {
//   const navigate = useNavigate();
//   const { logout } = useAuth();
//   const { darkMode, setDarkMode } = useDarkMode();
//   const CONFIG_ID = "telegram_config";

//   const [token, setToken] = useState("");
//   const [isTokenSaved, setIsTokenSaved] = useState(false);
//   const [chatName, setChatName] = useState("");
//   const [chatId, setChatId] = useState("");
//   const [chatList, setChatList] = useState([]);

//   // Nuevos estados para umbrales
//   const [tempMax, setTempMax] = useState("");
//   const [tempMin, setTempMin] = useState("");

//   const [loading, setLoading] = useState(true);

//   const handlerLogout = async () => {
//     await logout();
//   };

//   useEffect(() => {
//     const fetchConfig = async () => {
//       try {
//         const docRef = doc(db, "configuraciones", CONFIG_ID);
//         const docSnap = await getDoc(docRef);
//         if (docSnap.exists()) {
//           const data = docSnap.data();
//           if (data.botToken) setIsTokenSaved(true);
//           setChatList(data.receptores || []);
//           setTempMax(data.tempMax || "");
//           setTempMin(data.tempMin || "");
//         }
//       } catch (error) {
//         console.error("Error cargando config:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchConfig();
//   }, []);

//   const handleSaveToken = async (e) => {
//     e.preventDefault();
//     if (!token.trim()) return;
//     try {
//       const docRef = doc(db, "configuraciones", CONFIG_ID);
//       await setDoc(docRef, { botToken: token }, { merge: true });
//       setIsTokenSaved(true);
//       setToken("");
//       alert("Token vinculado correctamente.");
//     } catch (error) {
//       console.error("Error al guardar token:", error);
//     }
//   };

//   const handleSaveThresholds = async (e) => {
//     e.preventDefault();
//     try {
//       const docRef = doc(db, "configuraciones", CONFIG_ID);
//       await setDoc(
//         docRef,
//         {
//           tempMax: Number(tempMax),
//           tempMin: Number(tempMin),
//         },
//         { merge: true }
//       );
//       alert("Umbrales de temperatura actualizados.");
//     } catch (error) {
//       console.error("Error al guardar umbrales:", error);
//     }
//   };

//   const handleAddChat = async (e) => {
//     e.preventDefault();
//     if (chatName && chatId) {
//       const nuevoReceptor = { id: chatId, name: chatName };
//       try {
//         const docRef = doc(db, "configuraciones", CONFIG_ID);
//         await setDoc(
//           docRef,
//           { receptores: arrayUnion(nuevoReceptor) },
//           { merge: true }
//         );
//         setChatList([...chatList, nuevoReceptor]);
//         setChatName("");
//         setChatId("");
//       } catch (error) {
//         console.error("Error al añadir receptor:", error);
//       }
//     }
//   };

//   const removeChat = async (chatObj) => {
//     try {
//       const docRef = doc(db, "configuraciones", CONFIG_ID);
//       await updateDoc(docRef, { receptores: arrayRemove(chatObj) });
//       setChatList(chatList.filter((c) => c.id !== chatObj.id));
//     } catch (error) {
//       console.error("Error al eliminar:", error);
//     }
//   };

//   if (loading)
//     return (
//       <div className="h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-emerald-500 font-mono italic">
//         CARGANDO PROTOCOLOS...
//       </div>
//     );

//   return (
//     <div className="h-svh flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500">
//       {/* HEADER */}
//       <header className="w-full mx-auto px-4 md:px-8 flex justify-between items-center shrink-0 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-transparent backdrop-blur-sm">
//         <div className="flex items-center gap-2 md:gap-4">
//           <button
//             className="bg-blue-500/10 dark:bg-blue-500/20 p-2 md:p-3 rounded-xl border border-blue-500/20 dark:border-blue-500/30 transition-transform active:scale-95 shadow-sm"
//             onClick={() => {
//               handlerLogout();
//               navigate("/");
//             }}
//           >
//             <FaTelegramPlane className="text-xl md:text-2xl text-blue-500 dark:text-blue-400" />
//           </button>

//           <div>
//             <h1 className="text-lg md:text-2xl font-black uppercase italic tracking-tighter leading-none dark:text-white text-slate-800">
//               Control <span className="text-emerald-500">Notificaciones</span>
//             </h1>
//             <p className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
//               Módulo de enlace Telegram
//             </p>
//           </div>
//         </div>

//         <button
//           onClick={() => setDarkMode(!darkMode)}
//           className="p-2 md:p-3 rounded-xl bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-800 active:scale-90 transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
//         >
//           <FaRegLightbulb
//             className={`w-4 h-4 md:w-5 md:h-5 ${
//               !darkMode ? "text-amber-500" : "text-emerald-500"
//             }`}
//           />
//         </button>
//       </header>

//       {/* ÁREA DE CONFIGURACIÓN */}
//       <div className="w-full mx-auto p-4 md:px-10 overflow-y-auto md:overflow-visible shrink-0">
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           {/* SECCIÓN TOKEN */}
//           <section className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:border-emerald-500/30 transition-all">
//             <div className="flex items-center gap-3 mb-4">
//               <FaKey className="text-emerald-500" />
//               <h2 className="font-black uppercase tracking-widest text-xs text-slate-500 dark:text-slate-400">
//                 Bot API Token
//               </h2>
//             </div>
//             {!isTokenSaved ? (
//               <form onSubmit={handleSaveToken} className="space-y-3">
//                 <input
//                   type="password"
//                   value={token}
//                   onChange={(e) => setToken(e.target.value)}
//                   placeholder="Paste Token..."
//                   className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-mono text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
//                 />
//                 <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white dark:text-slate-950 font-black py-2 rounded-lg text-[10px] uppercase tracking-widest transition-all">
//                   Vincular
//                 </button>
//               </form>
//             ) : (
//               <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between">
//                 <div className="flex items-center gap-2">
//                   <IoShieldCheckmarkSharp className="text-xl text-emerald-500 animate-pulse" />
//                   <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-500">
//                     Enlace Activo
//                   </p>
//                 </div>
//                 <button
//                   onClick={() => setIsTokenSaved(false)}
//                   className="text-[9px] font-bold text-slate-400 hover:text-red-500 uppercase"
//                 >
//                   Reset
//                 </button>
//               </div>
//             )}
//           </section>

//           {/* SECCIÓN UMBRALES TEMP */}
//           <section className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:border-orange-500/30 transition-all">
//             <div className="flex items-center gap-3 mb-4">
//               <FaTemperatureHigh className="text-orange-500" />
//               <h2 className="font-black uppercase tracking-widest text-xs text-slate-500 dark:text-slate-400">
//                 Alertas Temp
//               </h2>
//             </div>
//             <form onSubmit={handleSaveThresholds} className="space-y-3">
//               <div className="flex gap-2">
//                 <input
//                   type="number"
//                   value={tempMax}
//                   onChange={(e) => setTempMax(e.target.value)}
//                   placeholder="Máx °C"
//                   className="w-1/2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-mono text-orange-600 dark:text-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
//                 />
//                 <input
//                   type="number"
//                   value={tempMin}
//                   onChange={(e) => setTempMin(e.target.value)}
//                   placeholder="Mín °C"
//                   className="w-1/2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-mono text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
//                 />
//               </div>
//               <button className="w-full bg-slate-800 dark:bg-white text-white dark:text-slate-950 font-black py-2 rounded-lg text-[10px] uppercase tracking-widest transition-all">
//                 Actualizar Rangos
//               </button>
//             </form>
//           </section>

//           {/* SECCIÓN NUEVO RECEPTOR */}
//           <section className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:border-blue-500/30 transition-all">
//             <div className="flex items-center gap-3 mb-4">
//               <FaUserPlus className="text-blue-500" />
//               <h2 className="font-black uppercase tracking-widest text-xs text-slate-500 dark:text-slate-400">
//                 Nuevo Receptor
//               </h2>
//             </div>
//             <form onSubmit={handleAddChat} className="space-y-3">
//               <input
//                 type="text"
//                 placeholder="Responsable"
//                 value={chatName}
//                 onChange={(e) => setChatName(e.target.value)}
//                 className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm text-slate-600 dark:text-slate-300 focus:outline-none"
//               />
//               <input
//                 type="text"
//                 placeholder="Chat ID"
//                 value={chatId}
//                 onChange={(e) => setChatId(e.target.value)}
//                 className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-mono text-blue-600 dark:text-blue-400 focus:outline-none"
//               />
//               <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-2 rounded-lg text-[10px] uppercase tracking-widest">
//                 Registrar ID
//               </button>
//             </form>
//           </section>
//         </div>
//       </div>

//       {/* LISTA DE NODOS */}
//       <div className="mx-auto w-full px-4 md:px-10 flex-1 min-h-0 pb-4">
//         <section className="bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl h-full flex flex-col shadow-sm overflow-hidden">
//           <div className="bg-slate-100 dark:bg-slate-800/50 px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
//             <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
//               Nodos Activos
//             </h3>
//             <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 text-[9px] font-mono font-bold border border-emerald-500/20">
//               {chatList.length} ONLINE
//             </span>
//           </div>

//           <div className="flex-1 overflow-y-auto scrollbar-custom divide-y divide-slate-100 dark:divide-slate-800/50">
//             {chatList.length > 0 ? (
//               chatList.map((chat) => (
//                 <div
//                   key={chat.id}
//                   className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
//                 >
//                   <div className="flex items-center gap-4">
//                     <div className="w-10 h-10 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center font-black text-emerald-600 dark:text-emerald-500 text-xs shadow-sm">
//                       {chat.name.charAt(0)}
//                     </div>
//                     <div>
//                       <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
//                         {chat.name}
//                       </p>
//                       <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
//                         ID: {chat.id}
//                       </p>
//                     </div>
//                   </div>
//                   <button
//                     onClick={() => removeChat(chat)}
//                     className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
//                   >
//                     <FaTrashAlt className="text-sm" />
//                   </button>
//                 </div>
//               ))
//             ) : (
//               <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
//                 <p className="text-xs uppercase tracking-widest font-bold">
//                   Sin receptores configurados
//                 </p>
//               </div>
//             )}
//           </div>
//         </section>
//       </div>

//       <Footer />
//     </div>
//   );
// }



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
  FaTemperatureHigh,
  FaTimes,
  FaUsers,
} from "react-icons/fa";
import { useAuth } from "../../Context/AuthContext.jsx";
import { useDarkMode } from "../../Context/DarkModeContext";
import { IoShieldCheckmarkSharp } from "react-icons/io5";
import Footer from "../../Components/Footer/Footer.jsx";

export default function ControlDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { darkMode, setDarkMode } = useDarkMode();
  const CONFIG_ID = "telegram_config";

  const [token, setToken] = useState("");
  const [isTokenSaved, setIsTokenSaved] = useState(false);
  const [chatName, setChatName] = useState("");
  const [chatId, setChatId] = useState("");
  const [chatList, setChatList] = useState([]);
  const [tempMax, setTempMax] = useState("");
  const [tempMin, setTempMin] = useState("");
  const [loading, setLoading] = useState(true);

  // Estado para el Modal en móvil
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlerLogout = async () => {
    await logout();
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, "configuraciones", CONFIG_ID);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.botToken) setIsTokenSaved(true);
          setChatList(data.receptores || []);
          setTempMax(data.tempMax || "");
          setTempMin(data.tempMin || "");
        }
      } catch (error) {
        console.error("Error cargando config:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSaveToken = async (e) => {
    e.preventDefault();
    if (!token.trim()) return;
    try {
      const docRef = doc(db, "configuraciones", CONFIG_ID);
      await setDoc(docRef, { botToken: token }, { merge: true });
      setIsTokenSaved(true);
      setToken("");
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveThresholds = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, "configuraciones", CONFIG_ID);
      await setDoc(
        docRef,
        { tempMax: Number(tempMax), tempMin: Number(tempMin) },
        { merge: true }
      );
      alert("Umbrales actualizados");
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddChat = async (e) => {
    e.preventDefault();
    if (chatName && chatId) {
      const nuevoReceptor = { id: chatId, name: chatName };
      try {
        const docRef = doc(db, "configuraciones", CONFIG_ID);
        await setDoc(
          docRef,
          { receptores: arrayUnion(nuevoReceptor) },
          { merge: true }
        );
        setChatList([...chatList, nuevoReceptor]);
        setChatName("");
        setChatId("");
      } catch (error) {
        console.error(error);
      }
    }
  };

  const removeChat = async (chatObj) => {
    try {
      const docRef = doc(db, "configuraciones", CONFIG_ID);
      await updateDoc(docRef, { receptores: arrayRemove(chatObj) });
      setChatList(chatList.filter((c) => c.id !== chatObj.id));
    } catch (error) {
      console.error(error);
    }
  };

  // Sub-componente para evitar repetición de código en la lista
  const UsersList = () => (
    <div className="flex-1 overflow-y-auto scrollbar-custom divide-y divide-slate-100 dark:divide-slate-800/50">
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
        <div className="p-10 text-center text-slate-400 text-xs uppercase tracking-widest font-bold">
          Sin receptores
        </div>
      )}
    </div>
  );

  if (loading)
    return (
      <div className="h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-emerald-500 font-mono italic">
        CARGANDO...
      </div>
    );

  return (
    <div className="h-svh flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-500 relative">
      {/* HEADER */}
      <header className="w-full mx-auto px-4 md:px-8 flex justify-between items-center shrink-0 py-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 md:gap-4">
          <button
            className="bg-blue-500/10 dark:bg-blue-500/20 p-2 rounded-xl border border-blue-500/20"
            onClick={() => {
              handlerLogout();
              navigate("/");
            }}
          >
            <FaTelegramPlane className="text-xl text-blue-500" />
          </button>
          <div>
            <h1 className="text-lg md:text-2xl font-black uppercase italic dark:text-white text-slate-800 leading-none">
              Control <span className="text-emerald-500">Notificaciones</span>
            </h1>
          </div>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 md:p-3 rounded-xl bg-white dark:bg-slate-900 shadow-md border border-slate-200 dark:border-slate-800"
        >
          <FaRegLightbulb
            className={!darkMode ? "text-amber-500" : "text-emerald-500"}
          />
        </button>
      </header>

      {/* ÁREA DE CONFIGURACIÓN */}
      <div className="w-full mx-auto p-4 md:px-10 overflow-y-auto md:overflow-visible shrink-0 scrollbar-custom">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Token Form */}
          <section className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              {" "}
              <FaKey className="text-emerald-500" />{" "}
              <h2 className="font-black uppercase tracking-widest text-xs text-slate-500 dark:text-slate-400">
                Bot Token
              </h2>{" "}
            </div>
            {!isTokenSaved ? (
              <form onSubmit={handleSaveToken} className="space-y-3">
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste Token..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-mono text-emerald-600 dark:text-emerald-400 focus:outline-none"
                />
                <button className="w-full bg-emerald-600 text-white dark:text-slate-950 font-black py-2 rounded-lg text-[10px] uppercase">
                  Vincular
                </button>
              </form>
            ) : (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase text-emerald-600">
                  Enlace Activo
                </p>
                <button
                  onClick={() => setIsTokenSaved(false)}
                  className="text-[9px] font-bold text-slate-400 uppercase"
                >
                  Reset
                </button>
              </div>
            )}
          </section>

          {/* Thresholds Form */}
          <section className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              {" "}
              <FaTemperatureHigh className="text-orange-500" />{" "}
              <h2 className="font-black uppercase tracking-widest text-xs text-slate-500 dark:text-slate-400">
                Alertas Temp
              </h2>{" "}
            </div>
            <form onSubmit={handleSaveThresholds} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="number"
                  value={tempMax}
                  onChange={(e) => setTempMax(e.target.value)}
                  placeholder="Máx °C"
                  className="w-1/2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-mono text-orange-600"
                />
                <input
                  type="number"
                  value={tempMin}
                  onChange={(e) => setTempMin(e.target.value)}
                  placeholder="Mín °C"
                  className="w-1/2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm font-mono text-blue-600"
                />
              </div>
              <button className="w-full bg-slate-800 dark:bg-white text-white dark:text-slate-950 font-black py-2 rounded-lg text-[10px] uppercase">
                Actualizar
              </button>
            </form>
          </section>

          {/* Receiver Form */}
          <section className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              {" "}
              <FaUserPlus className="text-blue-500" />{" "}
              <h2 className="font-black uppercase tracking-widest text-xs text-slate-500 dark:text-slate-400">
                Nuevo Receptor
              </h2>{" "}
            </div>
            <form onSubmit={handleAddChat} className="space-y-3">
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
              <button className="w-full bg-blue-600 text-white font-black py-2 rounded-lg text-[10px] uppercase">
                Registrar ID
              </button>
            </form>
          </section>
        </div>
      </div>

      {/* LISTA DE NODOS - COMPORTAMIENTO DUAL MÓVIL/DESKTOP */}
      <div className="mx-auto w-full px-4 md:px-10 flex-1 min-h-0 pb-4">
        <section className="bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl h-full flex flex-col shadow-sm overflow-hidden">
          {/* HEADER DE LA LISTA */}
          <div className="bg-slate-100 dark:bg-slate-800/50 px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <FaUsers className="md:hidden" /> Nodos Activos
            </h3>

            {/* BOTÓN MÓVIL / INDICADOR DESKTOP */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 text-[9px] font-mono font-bold border border-emerald-500/20 active:scale-90 transition-all md:cursor-default md:active:scale-100"
            >
              {chatList.length} <span className="hidden md:inline">ONLINE</span>
              <span className="md:hidden"> VER LISTA</span>
            </button>
          </div>

          {/* LISTA VISIBLE SOLO EN MD+ */}
          <div className="hidden md:block h-full overflow-hidden flex flex-col">
            <UsersList />
          </div>

          {/* ESPACIO VACÍO EN MÓVIL PARA ESTÉTICA */}
          <div className="md:hidden flex-1 flex flex-col items-center justify-center text-slate-400 gap-2 opacity-50 italic text-[10px]">
            <FaTelegramPlane className="text-2xl" />
            Terminales vinculadas
          </div>
        </section>
      </div>

      {/* MODAL PARA MÓVIL */}
      {isModalOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="mt-auto h-[80vh] bg-white dark:bg-slate-900 rounded-t-[3rem] border-t border-slate-800 flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-500">
            {/* Header Modal */}
            <div className="px-8 py-6 flex justify-between items-center border-b border-slate-100 dark:border-slate-800 shrink-0">
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

            {/* Lista dentro del modal */}
            <div className="flex-1 overflow-y-auto pb-10">
              <UsersList />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}