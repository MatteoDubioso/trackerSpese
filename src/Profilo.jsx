import { auth } from './firebase';
import { signOut } from 'firebase/auth';

function Profilo({ utente }) {
    const logout = () => {
        if(window.confirm("Sei sicuro di voler uscire?")) {
            signOut(auth);
        }
    };

    return (
        <div className="animate-fade-in pb-20 w-full max-w-3xl mx-auto">
            
            {/* HEADER */}
            <div className="flex flex-col gap-1 mb-10 px-4 md:px-0 text-center md:text-left">
                <h2 className="text-3xl font-black text-slate-100 tracking-tight">Il Tuo Profilo</h2>
                <p className="text-emerald-400/80 text-[10px] font-bold uppercase tracking-widest">Impostazioni Account</p>
            </div>

            <div className="relative bg-slate-900/60 p-8 md:p-12 rounded-[2.5rem] border border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl flex flex-col items-center">
                
                {/* SFONDO GLOW INTERNO (Opzionale per dare profondità) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

                {/* FOTO PROFILO */}
                <div className="relative mb-6 group">
                    <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-slate-900 ring-2 ring-emerald-500/50 shadow-[0_0_30px_rgba(52,211,153,0.2)] transition-transform duration-300 group-hover:scale-105 bg-slate-800 flex items-center justify-center">
                        {utente.photoURL ? (
                            <img src={utente.photoURL} alt="Profilo" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-4xl font-black text-emerald-400">
                                {utente.email?.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                    {/* Badge Online Status */}
                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-slate-900 shadow-sm"></div>
                </div>

                {/* INFO UTENTE */}
                <h3 className="text-2xl font-black text-white mb-1 tracking-tight z-10">
                    {utente.displayName || 'Utente Tracker'}
                </h3>
                <p className="text-slate-400 font-medium text-sm mb-10 z-10">
                    {utente.email}
                </p>

                {/* SCHEDE INFORMATIVE */}
                <div className="w-full max-w-md grid grid-cols-2 gap-4 mb-10 text-left z-10">
                    <div className="bg-slate-950/50 p-5 rounded-3xl border border-slate-800/60 shadow-inner hover:bg-slate-900/50 transition-colors">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Stato Account</p>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                            <p className="text-slate-200 font-bold">Attivo</p>
                        </div>
                    </div>
                    
                    <div className="bg-slate-950/50 p-5 rounded-3xl border border-slate-800/60 shadow-inner hover:bg-slate-900/50 transition-colors">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Accesso tramite</p>
                        <div className="flex items-center gap-2">
                            <span className="text-lg leading-none">
                                {utente.providerData[0]?.providerId === 'google.com' ? '🔵' : '✉️'}
                            </span>
                            <p className="text-slate-200 font-bold capitalize">
                                {utente.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Email'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* PULSANTE LOGOUT */}
                <button 
                    onClick={logout}
                    className="w-full max-w-md bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 py-4 rounded-2xl font-bold tracking-widest uppercase text-sm transition-all shadow-lg active:scale-[0.98] z-10"
                >
                    Disconnetti Account
                </button>
                
                {/* FOOTER VERSIONE */}
                <div className="mt-10 flex flex-col items-center gap-2 z-10">
                    <span className="text-[10px] bg-slate-950/50 text-slate-500 px-3 py-1.5 rounded-full font-bold uppercase tracking-widest border border-slate-800/50">
                        TrackerSpese v1.0
                    </span>
                    <p className="text-slate-600 text-[10px] font-medium tracking-wide">
                        Sincronizzato via Firebase Cloud ☁️
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Profilo;