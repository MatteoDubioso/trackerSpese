import { Link } from 'react-router-dom';

function Home() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 relative overflow-hidden flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
            
            {/* SFONDI LUMINOSI (GLOW) */}
            <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '10s' }}></div>

            {/* NAVBAR */}
            <nav className="w-full max-w-7xl mx-auto px-6 py-8 flex justify-between items-center relative z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <span className="text-xl">👛</span>
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-white">
                        TRACKER<span className="text-emerald-400">SPESE</span>
                    </h1>
                </div>
                <Link to="/login" className="px-6 py-2.5 rounded-xl text-sm font-bold bg-slate-900/50 border border-slate-700 hover:bg-white hover:text-slate-950 transition-all shadow-lg backdrop-blur-md">
                    Accedi
                </Link>
            </nav>

            {/* HERO SECTION CON MOCKUP FLUTTUANTE */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-6 pt-12 pb-24 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
                
                {/* Testo Hero */}
                <div className="flex-1 flex flex-col items-start text-left animate-fade-in">
                    <span className="px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        V1.0 Live & Criptata
                    </span>

                    <h2 className="text-5xl lg:text-7xl font-black text-slate-100 tracking-tighter leading-[1.1] mb-6">
                        Domina le tue finanze con <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-500">
                            Intelligenza.
                        </span>
                    </h2>

                    <p className="text-lg text-slate-400 mb-10 max-w-xl font-medium leading-relaxed">
                        Abbandona i vecchi fogli Excel. Traccia spese, analizza costi fissi ed esporta report PDF in un ecosistema dal design puro e blindato con crittografia End-to-End.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <Link to="/login" className="px-8 py-4 rounded-2xl bg-emerald-500 text-slate-950 font-black tracking-wide hover:bg-emerald-400 active:scale-95 transition-all shadow-[0_0_30px_rgba(52,211,153,0.3)] text-center">
                            Inizia Gratuitamente
                        </Link>
                        <a href="#features" className="px-8 py-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-300 font-bold tracking-wide hover:bg-slate-800 transition-all backdrop-blur-sm text-center">
                            Scopri come funziona
                        </a>
                    </div>
                    
                    {/* Social Proof */}
                    <div className="mt-10 flex items-center gap-4 opacity-70">
                        <div className="flex -space-x-3">
                            {[1,2,3,4].map(i => (
                                <div key={i} className={`w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-[10px]`}>👤</div>
                            ))}
                        </div>
                        <p className="text-xs font-bold text-slate-400">Scelta da utenti che amano il design.</p>
                    </div>
                </div>

                {/* Grafica Fluttuante (CSS Mockup) */}
                <div className="flex-1 w-full max-w-md relative animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    {/* Elemento decorativo dietro */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-purple-500/20 blur-3xl rounded-[3rem]"></div>
                    
                    {/* Card Principale */}
                    <div className="relative bg-slate-900/80 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-slate-700/50 shadow-2xl shadow-black/50 transform hover:-translate-y-2 hover:rotate-1 transition-all duration-500">
                        <div className="flex justify-between items-center mb-8">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Risparmio Attuale</p>
                            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-emerald-500/20">+14.5%</span>
                        </div>
                        <h3 className="text-5xl font-black text-white mb-8 tracking-tighter">€ 2.450<span className="text-slate-500 text-2xl">.00</span></h3>
                        
                        {/* Finti elementi di lista */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-lg">🍕</div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Cena Fuori</p>
                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Costi Variabili</p>
                                    </div>
                                </div>
                                <span className="text-red-400 font-bold text-sm">- € 45.00</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-lg">💰</div>
                                    <div>
                                        <p className="text-sm font-bold text-white">Stipendio</p>
                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Entrata</p>
                                    </div>
                                </div>
                                <span className="text-emerald-400 font-bold text-sm">+ € 2100.00</span>
                            </div>
                        </div>
                    </div>

                    {/* Badge fluttuante */}
                    <div className="absolute -bottom-6 -left-6 bg-slate-800/90 backdrop-blur-xl p-4 rounded-3xl border border-slate-700 shadow-xl flex items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
                        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center text-xl border border-blue-500/30">📊</div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Report Generato</p>
                            <p className="text-sm font-black text-white">PDF Pronto</p>
                        </div>
                    </div>
                </div>

            </main>

            {/* FEATURES GRID */}
            <section id="features" className="w-full bg-slate-950/50 border-t border-slate-900 pt-20 pb-24 relative z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Progettata per l'eccellenza.</h2>
                        <p className="text-slate-400 font-medium">Tutto ciò che ti serve, senza distrazioni.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="group bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800/60 hover:bg-slate-900/80 transition-colors shadow-lg">
                            <div className="w-14 h-14 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 group-hover:-rotate-6 transition-transform shadow-inner">🔒</div>
                            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Privacy Assoluta</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">I tuoi dati sono blindati con la crittografia militare AES-256. La chiave risiede solo nel tuo account.</p>
                        </div>

                        <div className="group bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800/60 hover:bg-slate-900/80 transition-colors shadow-lg">
                            <div className="w-14 h-14 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-inner">⚡</div>
                            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Velocità Estrema</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">Sincronizzazione in tempo reale grazie a Firebase Cloud. Inserisci una spesa e appare ovunque istantaneamente.</p>
                        </div>

                        <div className="group bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800/60 hover:bg-slate-900/80 transition-colors shadow-lg">
                            <div className="w-14 h-14 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform shadow-inner">📄</div>
                            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Export Professionale</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">Genera report PDF e CSV impaginati perfettamente con un clic. Ideali per la tua contabilità personale.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-slate-800/60 bg-slate-950 py-10 text-center relative z-10">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                        © {new Date().getFullYear()} TrackerSpese. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <span className="text-slate-600 text-xs hover:text-slate-300 transition-colors cursor-pointer">Privacy Policy</span>
                        <span className="text-slate-600 text-xs hover:text-slate-300 transition-colors cursor-pointer">Terms of Service</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Home;