export default function Loading({ text = "Iniciando Protocolo..." }) {
  return (
    <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-slate-50/60 dark:bg-slate-950/80 backdrop-blur-md transition-all duration-500">
      {/* CONTENEDOR DEL SPINNER */}
      <div className="relative flex items-center justify-center mb-6">
        {/* Círculo Exterior */}
        <div className="absolute w-20 h-20 border-2 border-emerald-500/10 dark:border-emerald-500/5 rounded-full"></div>

        {/* Círculo Medio */}
        <div className="absolute w-16 h-16 border-t-2 border-b-2 border-blue-500/30 rounded-full animate-[spin_3s_linear_infinite]"></div>

        {/* Spinner Principal */}
        <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-emerald-500 dark:border-t-emerald-500 rounded-full animate-spin shadow-[0_0_15px_rgba(16,185,129,0.3)]"></div>

        {/* Punto Central */}
        <div className="absolute w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
      </div>

      {/* TEXTO DE ESTADO */}
      <div className="text-center space-y-2">
        <p className="text-xs font-black uppercase tracking-[0.4em] text-emerald-600 dark:text-emerald-500 animate-pulse">
          {text}
        </p>

        {/* Línea de progreso */}
        <div className="w-32 h-1 bg-slate-200 dark:bg-slate-800 mx-auto rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 w-full animate-loading-bar origin-left"></div>
        </div>
      </div>
    </div>
  );
}
