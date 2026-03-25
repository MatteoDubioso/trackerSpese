import { useState } from 'react';
import { auth } from './firebase'; 
import { Link } from 'react-router-dom';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile // Necessario per salvare il nome
} from 'firebase/auth';

function Login() {
    const [errore, setErrore] = useState('');
    const [caricamento, setCaricamento] = useState(false);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confermaPassword, setConfermaPassword] = useState('');
    const [nomeCognome, setNomeCognome] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);

    const gestisciAccessoEmail = async (e) => {
        e.preventDefault();
        setErrore(''); 
        
        // Validazioni extra per la registrazione
        if (isRegistering) {
            if (password !== confermaPassword) {
                setErrore('Le password non coincidono.');
                return;
            }
            if (password.length < 6) {
                setErrore('La password deve avere almeno 6 caratteri.');
                return;
            }
        }

        setCaricamento(true);
        try {
            if (isRegistering) {
                // 1. Crea l'utente
                const result = await createUserWithEmailAndPassword(auth, email, password);
                // 2. Aggiorna il profilo con Nome e Cognome
                await updateProfile(result.user, {
                    displayName: nomeCognome
                });
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

    const accediConGoogle = async () => {
        setErrore('');
        setCaricamento(true);
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        try {
            await signInWithPopup(auth, provider);
        } catch (err) {
            if (err.code === 'auth/popup-closed-by-user') {
                setErrore("Accesso annullato.");
            } else {
                setErrore("Errore durante l'accesso con Google.");
            }
        } finally {
            setCaricamento(false);
        }
    };

    return (
        <div className="min-h-[100svh] w-full flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
            
            <div className="absolute top-6 left-6 z-20">
                <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-bold bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800 backdrop-blur-md hover:bg-slate-800">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Torna alla Home
                </Link>
            </div>

            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }}></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>

            <div className="relative z-10 bg-slate-900/70 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl shadow-black/50 border border-slate-800/60 w-full max-w-md animate-fade-in backdrop-blur-2xl">
                
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-950 rounded-2xl border border-slate-700/50 flex items-center justify-center mx-auto mb-6 shadow-inner relative overflow-hidden">
                        <span className="text-3xl relative z-10">👛</span>
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight mb-2">
                        {isRegistering ? 'Crea un account' : 'Bentornato!'}
                    </h2>
                    <p className="text-emerald-400/80 text-[10px] font-bold uppercase tracking-widest">
                        {isRegistering ? 'Inizia a risparmiare oggi' : 'Il tuo ecosistema finanziario'}
                    </p>
                </div>
                
                {errore && (
                    <div className="mb-8 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 animate-fade-in shadow-inner">
                        <span className="text-red-400 text-xl">⚠️</span>
                        <p className="text-red-400 text-sm font-medium leading-tight">{errore}</p>
                    </div>
                )}

                <form onSubmit={gestisciAccessoEmail} className="flex flex-col gap-4">
                    
                    {/* CAMPO NOME E COGNOME (Solo in registrazione) */}
                    {isRegistering && (
                        <div className="relative group animate-fade-in">
                            <input 
                                type="text" required value={nomeCognome} onChange={(e) => setNomeCognome(e.target.value)} 
                                className="w-full p-4 pl-12 rounded-2xl bg-slate-950/50 border border-slate-800 text-slate-200 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-600" 
                                placeholder="Nome e Cognome"
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500/70 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                            </span>
                        </div>
                    )}

                    <div className="relative group">
                        <input 
                            type="email" required value={email} onChange={(e) => setEmail(e.target.value)} 
                            className="w-full p-4 pl-12 rounded-2xl bg-slate-950/50 border border-slate-800 text-slate-200 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-600" 
                            placeholder="Indirizzo Email"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500/70 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                        </span>
                    </div>

                    <div className="relative group">
                        <input 
                            type="password" required value={password} onChange={(e) => setPassword(e.target.value)} 
                            className="w-full p-4 pl-12 rounded-2xl bg-slate-950/50 border border-slate-800 text-slate-200 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-600" 
                            placeholder="Password"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500/70 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        </span>
                    </div>

                    {/* CAMPO CONFERMA PASSWORD (Solo in registrazione) */}
                    {isRegistering && (
                        <div className="relative group animate-fade-in">
                            <input 
                                type="password" required value={confermaPassword} onChange={(e) => setConfermaPassword(e.target.value)} 
                                className="w-full p-4 pl-12 rounded-2xl bg-slate-950/50 border border-slate-800 text-slate-200 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-600" 
                                placeholder="Conferma Password"
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500/70 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                            </span>
                        </div>
                    )}

                    <button 
                        type="submit" disabled={caricamento} 
                        className="mt-4 w-full bg-emerald-500 text-slate-950 font-black tracking-widest text-sm py-4 rounded-2xl hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(52,211,153,0.2)] hover:shadow-[0_0_30px_rgba(52,211,153,0.4)] active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                    >
                        {caricamento ? 'ELABORAZIONE...' : (isRegistering ? 'CREA ACCOUNT' : 'ACCEDI ORA')}
                    </button>
                </form>

                <p className="text-center text-slate-500 mt-6 text-sm font-medium">
                    {isRegistering ? 'Hai già un account?' : 'Nuovo utente?'}
                    <button type="button" onClick={() => { setIsRegistering(!isRegistering); setErrore(''); }} className="text-emerald-400 ml-2 font-bold hover:text-emerald-300 transition-colors">
                        {isRegistering ? 'Accedi' : 'Registrati'}
                    </button>
                </p>

                <div className="flex items-center gap-4 my-8 opacity-70">
                    <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
                    <span className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Oppure</span>
                    <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-slate-600 to-transparent"></div>
                </div>

                <button 
                    onClick={accediConGoogle}
                    disabled={caricamento}
                    className="w-full flex items-center justify-center gap-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-200 font-bold text-sm py-4 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 shadow-inner"
                >
                    {/* SVG Google rimosso per brevità, mantieni quello originale */}
                    Continua con Google
                </button>

            </div>
        </div>
    );
}

export default Login;