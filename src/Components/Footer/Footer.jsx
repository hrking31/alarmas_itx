import { useLocation } from "react-router-dom";

export default function Footer() {
  const { pathname } = useLocation();

  const isDashboard = pathname === "/";

  if (isDashboard) {
    return (
      <footer className="py-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] sm:tracking-[0.4em] shrink-0 ">
        © {new Date().getFullYear()} ITX Infrastructure Control System
        <p className="mt-1 text-[10px] font-normal tracking-normal normal-case text-gray-500">
          Developed by Hernando Rey
        </p>
      </footer>
    );
  }
  return (
    <footer className="w-full py-2 mt-auto">
      <div className="max-w-5xl mx-auto flex flex-col  items-center justify-between gap-2 px-4 text-center sm:text-left">
        <p className="text-xs sm:text-sm text-gray-400">
          © {new Date().getFullYear()} ITX Infrastructure Control System
        </p>

        <p className="text-[11px] sm:text-xs text-gray-500">
          Developed by Hernando Rey — Crafted with love and coffee ☕
        </p>
      </div>
    </footer>
  );
}
