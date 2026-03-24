import { useState } from 'react';
import { auth } from './firebase'; 
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';

function Login() {
    const [errore, setErrore] = useState('');
    const [caricamento, setCaricamento] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);

    // --- LOGICA EMAIL / PASSWORD ---
    const gestisciAccessoEmail = async (e) => {
        e.preventDefault();
        setErrore(''); 
        setCaricamento(true);
        try {
            if (isRegistering) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/invalid-credential') {
                setErrore('Email o password non corretti.');
            } else if (err.code === 'auth/email-already-in-use') {
                setErrore('Questa email è già registrata.');
            } else {
                setErrore("Errore durante l'operazione. Riprova.");
            }
        } finally {
            setCaricamento(false);
        }
    };

    // --- LOGICA ACCESSO GOOGLE ---
    const accediConGoogle = async () => {
        setErrore('');
        setCaricamento(true);
        
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        try {
            await signInWithPopup(auth, provider);
        } catch (err) {
            console.error("Dettaglio Errore Google:", err.code);
            if (err.code === 'auth/popup-closed-by-user') {
                setErrore("Accesso annullato.");
            } else if (err.code === 'auth/popup-blocked') {
                setErrore("Il browser ha bloccato il popup.");
            } else {
                setErrore("Errore durante l'accesso con Google.");
            }
        } finally {
            setCaricamento(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            
            {/* SFONDI AMBIENTALI (Glow) */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            {/* CARD LOGIN GLASSMORPHISM */}
            <div className="relative z-10 bg-slate-900/60 p-8 md:p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-800/60 w-full max-w-md animate-fade-in backdrop-blur-2xl">
                
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <span className="text-3xl">👛</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-100 tracking-tight">
                        {isRegistering ? 'Crea Account' : 'Bentornato!'}
                    </h2>
                    <p className="text-emerald-400/80 text-[10px] font-bold uppercase tracking-widest mt-2">
                        Il tuo ecosistema finanziario
                    </p>
                </div>
                
                {errore && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 animate-fade-in">
                        <span className="text-red-400 text-xl">⚠️</span>
                        <p className="text-red-400 text-sm font-medium leading-tight">{errore}</p>
                    </div>
                )}

                <form onSubmit={gestisciAccessoEmail} className="flex flex-col gap-4">
                    <input 
                        type="email" required value={email} onChange={(e) => setEmail(e.target.value)} 
                        className="w-full p-4 rounded-2xl bg-slate-950/50 border-none ring-1 ring-slate-800/60 text-slate-200 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-600" 
                        placeholder="Indirizzo Email"
                    />
                    <input 
                        type="password" required value={password} onChange={(e) => setPassword(e.target.value)} 
                        className="w-full p-4 rounded-2xl bg-slate-950/50 border-none ring-1 ring-slate-800/60 text-slate-200 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-600" 
                        placeholder="Password"
                    />
                    <button 
                        type="submit" disabled={caricamento} 
                        className="mt-2 w-full bg-emerald-500 text-slate-950 font-bold uppercase tracking-widest text-sm py-4 rounded-2xl hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(52,211,153,0.2)] active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                    >
                        {caricamento ? 'ELABORAZIONE...' : (isRegistering ? 'REGISTRATI' : 'ACCEDI')}
                    </button>
                </form>

                <p className="text-center text-slate-500 mt-6 text-sm font-medium">
                    {isRegistering ? 'Hai già un account?' : 'Nuovo utente?'}
                    <button type="button" onClick={() => { setIsRegistering(!isRegistering); setErrore(''); }} className="text-emerald-400 ml-2 font-bold hover:text-emerald-300 transition-colors">
                        {isRegistering ? 'Accedi' : 'Registrati'}
                    </button>
                </p>

                <div className="flex items-center gap-4 my-8">
                    <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                    <span className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Oppure</span>
                    <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-slate-700 to-transparent"></div>
                </div>

                <button 
                    onClick={accediConGoogle}
                    disabled={caricamento}
                    className="w-full flex items-center justify-center gap-3 bg-slate-950/50 hover:bg-slate-900 border border-slate-800 text-slate-200 font-bold text-sm py-4 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continua con Google
                </button>

            </div>
        </div>
    );
}

export default Login;