import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Login from './Login';
import Dashboard from './Dashboard';
import Analisi from './Analisi';
import Profilo from './Profilo';

// --- NAV LINK MIGLIORATO ---
function NavLink({ to, icon, label, mobile = false }) {
  const location = useLocation();
  const attivo = location.pathname === to;

  if (mobile) {
    return (
      <Link
        to={to}
        className={`
          flex flex-col items-center justify-center w-full py-1 transition-all
          ${attivo 
            ? 'text-emerald-400 scale-105' 
            : 'text-slate-500 hover:text-white'}
        `}
      >
        <span className="text-xl">{icon}</span>
        <span className="text-[10px] font-bold uppercase mt-0.5 tracking-wide">
          {label}
        </span>
      </Link>
    );
  }

  return (
    <Link
      to={to}
      className={`
        relative px-4 py-2 rounded-xl font-semibold transition-all
        ${attivo
          ? 'text-white'
          : 'text-slate-400 hover:text-white'}
      `}
    >
      {label}

      {/* underline animato */}
      <span
        className={`
          absolute left-0 -bottom-1 h-[2px] bg-emerald-400 transition-all duration-300
          ${attivo ? 'w-full' : 'w-0 group-hover:w-full'}
        `}
      />
    </Link>
  );
}

function App() {
  const [utente, setUtente] = useState(null);
  const [caricamento, setCaricamento] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUtente(currentUser);
      setCaricamento(false);
    });
    return () => unsubscribe();
  }, []);

  // --- LOADING SCREEN PREMIUM ---
  if (caricamento) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-slate-700"></div>
          <div className="absolute inset-0 animate-spin rounded-full border-t-2 border-emerald-500"></div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">

        {!utente ? (
          <Login />
        ) : (
          <>
            {/* NAVBAR DESKTOP FULL WIDTH */}
            <nav className="hidden md:block sticky top-0 z-50 backdrop-blur-xl bg-slate-900/70 border-b border-slate-800">
              
              <div className="w-full px-8 lg:px-16 h-16 flex justify-between items-center">
                
                {/* LOGO */}
                <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent">
                  TRACKER<span className="text-white">SPESE</span>
                </h1>

                {/* NAV */}
                <div className="flex gap-6 items-center">
                  <NavLink to="/" label="Dashboard" />
                  <NavLink to="/analisi" label="Analisi" />
                  <NavLink to="/profilo" label="Profilo" />
                </div>

              </div>
            </nav>

            {/* CONTENUTO FULL WIDTH */}
            <main className="flex-1 w-full">

              {/* wrapper responsive intelligente */}
              <div className="
                w-full
                px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20
                py-6
              ">
                <Routes>
                  <Route path="/" element={<Dashboard utente={utente} />} />
                  <Route path="/analisi" element={<Analisi utente={utente} />} />
                  <Route path="/profilo" element={<Profilo utente={utente} />} />
                </Routes>
              </div>

            </main>

            {/* MOBILE TAB BAR MIGLIORATA */}
            <nav className="
              md:hidden fixed bottom-0 left-0 right-0
              bg-slate-900/90 backdrop-blur-xl
              border-t border-slate-800
              h-16 flex justify-around items-center
              z-50 px-2
            ">
              <NavLink to="/" icon="🏠" label="Home" mobile />
              <NavLink to="/analisi" icon="📊" label="Analisi" mobile />
              <NavLink to="/profilo" icon="👤" label="Profilo" mobile />
            </nav>
          </>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;