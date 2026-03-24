import { useState, useEffect } from 'react';
import { db } from './firebase';
import CryptoJS from 'crypto-js';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

function Analisi({ utente }) {
    const [spese, setSpese] = useState([]);
    const [entrate, setEntrate] = useState([]);

    const [meseSelezionato, setMeseSelezionato] = useState(new Date().getMonth());
    const [annoSelezionato, setAnnoSelezionato] = useState(new Date().getFullYear());

    const nomiMesi = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    const nomiMesiEstesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    const COLORI = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    const decripta = (codice) => {
        try {
            const bytes = CryptoJS.AES.decrypt(codice, utente.uid);
            const testoOriginale = bytes.toString(CryptoJS.enc.Utf8);
            return testoOriginale || "0";
        // eslint-disable-next-line no-unused-vars
        } catch (error) { return "0"; }
    };

    useEffect(() => {
        if (!utente) return;

        const unsubS = onSnapshot(query(collection(db, 'spese'), where('utenteId', '==', utente.uid)), (snap) => {
            let docs = [];
            snap.forEach(d => {
                const data = d.data();
                docs.push({
                    ...data,
                    importo: parseFloat(decripta(data.importo)),
                    categoria: decripta(data.categoria),
                    frequenza: data.frequenza ? decripta(data.frequenza) : 'VARIABILE',
                    scadenza: data.scadenza ? decripta(data.scadenza) : ''
                });
            });
            setSpese(docs);
        });

        const unsubE = onSnapshot(query(collection(db, 'entrate'), where('utenteId', '==', utente.uid)), (snap) => {
            let docs = [];
            snap.forEach(d => {
                const data = d.data();
                docs.push({ ...data, importo: parseFloat(decripta(data.importo)) });
            });
            setEntrate(docs);
        });

        return () => { unsubS(); unsubE(); };
    }, [utente]);

    const filtraDati = (lista, m, a) => lista.filter(item => {
        const dataItem = item.dataInserimento?.toDate() || new Date();
        const meseItem = dataItem.getMonth();
        const annoItem = dataItem.getFullYear();
        const meseTarget = parseInt(m);
        const annoTarget = parseInt(a);

        if (item.frequenza === 'FISSA') {
            const iniziata = (annoItem < annoTarget) || (annoItem === annoTarget && meseItem <= meseTarget);
            let nonScaduta = true;
            if (item.scadenza) {
                const dFine = new Date(item.scadenza);
                nonScaduta = (annoTarget < dFine.getFullYear()) || (annoTarget === dFine.getFullYear() && meseTarget <= dFine.getMonth());
            }
            return iniziata && nonScaduta;
        }
        return meseItem === meseTarget && annoItem === annoTarget;
    });

    const sMeseAttuale = filtraDati(spese, meseSelezionato, annoSelezionato);
    const eMeseAttuale = filtraDati(entrate, meseSelezionato, annoSelezionato);

    const tUscite = sMeseAttuale.reduce((a, b) => a + b.importo, 0);
    const tEntrate = eMeseAttuale.reduce((a, b) => a + b.importo, 0);
    const risparmio = tEntrate - tUscite;

    const sFisse = sMeseAttuale.filter(s => s.frequenza === 'FISSA').reduce((a, b) => a + b.importo, 0);
    const sVariabili = sMeseAttuale.filter(s => s.frequenza === 'VARIABILE').reduce((a, b) => a + b.importo, 0);

    const datiAndamentoAnnuale = nomiMesi.map((mese, index) => {
        const speseMese = filtraDati(spese, index, annoSelezionato).reduce((a, b) => a + b.importo, 0);
        const entrateMese = filtraDati(entrate, index, annoSelezionato).reduce((a, b) => a + b.importo, 0);
        return { name: mese, Uscite: speseMese, Entrate: entrateMese };
    });

    const chartDataTorta = Object.entries(sMeseAttuale.reduce((acc, curr) => {
        acc[curr.categoria] = (acc[curr.categoria] || 0) + curr.importo;
        return acc;
    }, {})).map(([name, value]) => ({ name, value }));

    return (
        <div className="animate-fade-in pb-20 w-full">
            
            {/* BANNER PRIVACY DISCRETO */}
            <div className="flex justify-center mb-6">
                <span className="flex items-center gap-1.5 text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full font-bold uppercase tracking-widest border border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.1)]">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
                    Criptazione End-to-End
                </span>
            </div>

            {/* HEADER (GLASSMORPHISM) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 bg-slate-900/60 p-6 md:p-8 rounded-[2rem] border border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl">
                <div>
                    <h2 className="text-2xl font-black text-slate-100 tracking-tight">Analisi Finanziaria</h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Statistiche e Proiezioni</p>
                </div>

                <div className="flex gap-2 bg-slate-950/50 p-2 rounded-2xl border border-slate-800/50 w-full md:w-auto">
                    <select value={meseSelezionato} onChange={(e) => setMeseSelezionato(e.target.value)} className="flex-1 md:w-auto bg-transparent border-none text-emerald-400 font-bold outline-none cursor-pointer p-1 appearance-none text-center">
                        {nomiMesiEstesi.map((m, i) => <option key={i} value={i} className="bg-slate-900">{m}</option>)}
                    </select>
                    <div className="w-[1px] bg-slate-800 my-1"></div>
                    <select value={annoSelezionato} onChange={(e) => setAnnoSelezionato(e.target.value)} className="flex-1 md:w-auto bg-transparent border-none text-emerald-400 font-bold outline-none cursor-pointer p-1 appearance-none text-center">
                        {[2024, 2025, 2026].map(a => <option key={a} value={a} className="bg-slate-900">{a}</option>)}
                    </select>
                </div>
            </div>

            {/* RIEPILOGO FISSE / VARIABILI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-900/40 p-6 rounded-[2rem] border-y border-r border-l-4 border-l-blue-500 border-slate-800/60 shadow-lg flex justify-between items-center backdrop-blur-sm hover:bg-slate-900/60 transition-colors">
                    <div>
                        <p className="text-blue-400/90 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1.5"><span className="text-sm">📌</span> Costi Fissi</p>
                        <h4 className="text-2xl font-black text-slate-100 tracking-tight">€ {sFisse.toFixed(2)}</h4>
                    </div>
                    <div className="text-right bg-slate-950/50 px-4 py-2 rounded-xl border border-slate-800/50 shadow-inner">
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Incidenza</p>
                        <p className="text-blue-400 font-black text-lg">{tEntrate > 0 ? ((sFisse / tEntrate) * 100).toFixed(0) : 0}%</p>
                    </div>
                </div>
                
                <div className="bg-slate-900/40 p-6 rounded-[2rem] border-y border-r border-l-4 border-l-orange-500 border-slate-800/60 shadow-lg flex justify-between items-center backdrop-blur-sm hover:bg-slate-900/60 transition-colors">
                    <div>
                        <p className="text-orange-400/90 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1.5"><span className="text-sm">☁️</span> Costi Variabili</p>
                        <h4 className="text-2xl font-black text-slate-100 tracking-tight">€ {sVariabili.toFixed(2)}</h4>
                    </div>
                    <div className="text-right bg-slate-950/50 px-4 py-2 rounded-xl border border-slate-800/50 shadow-inner">
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Incidenza</p>
                        <p className="text-orange-400 font-black text-lg">{tEntrate > 0 ? ((sVariabili / tEntrate) * 100).toFixed(0) : 0}%</p>
                    </div>
                </div>
            </div>

            {/* CARDS TOTALI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800/60 shadow-lg flex flex-col justify-center text-center backdrop-blur-sm">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Entrate Totali</p>
                    <h3 className="text-2xl font-black text-emerald-400/90 tracking-tight">€ {tEntrate.toFixed(2)}</h3>
                </div>
                <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-slate-800/60 shadow-lg flex flex-col justify-center text-center backdrop-blur-sm">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Uscite Totali</p>
                    <h3 className="text-2xl font-black text-red-400/90 tracking-tight">€ {tUscite.toFixed(2)}</h3>
                </div>
                <div className="bg-slate-950 p-6 rounded-[2rem] border border-slate-800/50 shadow-inner flex flex-col justify-center text-center relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 relative z-10">Risparmio Netto</p>
                    <h3 className={`text-3xl font-black tracking-tighter relative z-10 ${risparmio >= 0 ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]' : 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.3)]'}`}>
                        € {risparmio.toFixed(2)}
                    </h3>
                </div>
            </div>

            {/* GRAFICO ANDAMENTO ANNUALE */}
            <div className="bg-slate-900/60 p-6 md:p-8 rounded-[2.5rem] border border-slate-800/60 mb-10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">📊</div>
                    <h3 className="text-lg font-bold text-slate-200 tracking-wide">Andamento Annuale {annoSelezionato}</h3>
                </div>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={datiAndamentoAnnuale} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(val) => `€${val}`} />
                            <Tooltip
                                cursor={{ fill: '#1e293b', opacity: 0.4 }}
                                contentStyle={{ backgroundColor: '#020617', borderRadius: '16px', border: '1px solid #1e293b', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                                itemStyle={{ fontWeight: 'bold' }}
                            />
                            <Bar dataKey="Entrate" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            <Bar dataKey="Uscite" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* DISTRIBUZIONE CATEGORIE */}
            <div className="bg-slate-900/60 p-6 md:p-8 rounded-[2.5rem] border border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30">🍕</div>
                        <h3 className="text-lg font-bold text-slate-200 tracking-wide">Distribuzione Categorie</h3>
                    </div>
                </div>
                
                {chartDataTorta.length > 0 ? (
                    <div className="h-80 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={chartDataTorta} 
                                    innerRadius={75} 
                                    outerRadius={105} 
                                    paddingAngle={6} 
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {chartDataTorta.map((e, i) => <Cell key={i} fill={COLORI[i % COLORI.length]} style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.3))' }} />)}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#020617', borderRadius: '16px', border: '1px solid #1e293b', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                                    itemStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                                    formatter={(value) => `€ ${value.toFixed(2)}`}
                                />
                                <Legend 
                                    iconType="circle" 
                                    verticalAlign="bottom" 
                                    wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 bg-slate-950/30 rounded-3xl border border-dashed border-slate-800">
                        <span className="text-4xl mb-3 opacity-30">📉</span>
                        <p className="text-slate-500 font-medium text-sm">Nessuna spesa registrata</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Analisi;