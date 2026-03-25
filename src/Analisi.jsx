import { useState, useEffect } from 'react';
import { db } from './firebase';
import CryptoJS from 'crypto-js';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function Analisi({ utente }) {
    const [spese, setSpese] = useState([]);
    const [entrate, setEntrate] = useState([]);

    const [meseSelezionato, setMeseSelezionato] = useState(new Date().getMonth());
    const [annoSelezionato, setAnnoSelezionato] = useState(new Date().getFullYear());

    const nomiMesi = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    const nomiMesiEstesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    const COLORI = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    // --- LOGICA DECRIPTAZIONE ---
    const decripta = (codice) => {
        if (!codice) return "";
        try {
            const bytes = CryptoJS.AES.decrypt(codice, utente.uid);
            const testo = bytes.toString(CryptoJS.enc.Utf8);
            return testo || "";
        // eslint-disable-next-line no-unused-vars
        } catch (error) { return "Errore"; }
    };

    // --- RIMOZIONE EMOJI PER PDF ---
    const rimuoviEmoji = (stringa) => {
        if (!stringa) return '';
        return stringa.replace(/(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g, '').trim();
    };

    // --- CARICAMENTO DATI ---
    useEffect(() => {
        if (!utente) return;

        // SCARICA E DECRIPTA LE SPESE
        const unsubS = onSnapshot(query(collection(db, 'spese'), where('utenteId', '==', utente.uid)), (snap) => {
            let docs = [];
            snap.forEach(d => {
                const data = d.data();
                docs.push({
                    id: d.id,
                    ...data,
                    importo: parseFloat(decripta(data.importo)) || 0,
                    categoria: decripta(data.categoria),
                    descrizione: decripta(data.descrizione),
                    frequenza: data.frequenza ? decripta(data.frequenza) : 'VARIABILE',
                    scadenza: data.scadenza ? decripta(data.scadenza) : ''
                });
            });
            setSpese(docs);
        });

        // SCARICA E DECRIPTA LE ENTRATE
        const unsubE = onSnapshot(query(collection(db, 'entrate'), where('utenteId', '==', utente.uid)), (snap) => {
            let docs = [];
            snap.forEach(d => {
                const data = d.data();
                docs.push({ 
                    id: d.id,
                    ...data, 
                    importo: parseFloat(decripta(data.importo)) || 0,
                    categoria: decripta(data.categoria),
                    descrizione: decripta(data.descrizione)
                });
            });
            setEntrate(docs);
        });

        return () => { unsubS(); unsubE(); };
    }, [utente]);

    // --- LOGICA FILTRI ---
    const filtraDati = (lista, m, a, soloAnno = false) => lista.filter(item => {
        const dataItem = item.dataInserimento?.toDate() || new Date();
        const meseItem = dataItem.getMonth();
        const annoItem = dataItem.getFullYear();
        const meseTarget = parseInt(m);
        const annoTarget = parseInt(a);

        if (item.frequenza === 'FISSA') {
            const iniziata = soloAnno ? (annoItem <= annoTarget) : ((annoItem < annoTarget) || (annoItem === annoTarget && meseItem <= meseTarget));
            let nonScaduta = true;
            if (item.scadenza) {
                const dFine = new Date(item.scadenza);
                nonScaduta = soloAnno ? (annoTarget <= dFine.getFullYear()) : ((annoTarget < dFine.getFullYear()) || (annoTarget === dFine.getFullYear() && meseTarget <= dFine.getMonth()));
            }
            return iniziata && nonScaduta;
        }
        
        if (soloAnno) return annoItem === annoTarget;
        return meseItem === meseTarget && annoItem === annoTarget;
    });

    const sMeseAttuale = filtraDati(spese, meseSelezionato, annoSelezionato);
    const eMeseAttuale = filtraDati(entrate, meseSelezionato, annoSelezionato);

    const tUscite = sMeseAttuale.reduce((a, b) => a + b.importo, 0);
    const tEntrate = eMeseAttuale.reduce((a, b) => a + b.importo, 0);
    const risparmio = tEntrate - tUscite;

    const sFisse = sMeseAttuale.filter(s => s.frequenza === 'FISSA').reduce((a, b) => a + b.importo, 0);
    const sVariabili = sMeseAttuale.filter(s => s.frequenza === 'VARIABILE').reduce((a, b) => a + b.importo, 0);

    // --- CALCOLI COACH 50/30/20 ---
    const targetBisogni = tEntrate * 0.50;
    const targetDesideri = tEntrate * 0.30;
    const targetRisparmio = tEntrate * 0.20;

    const percBisogni = tEntrate > 0 ? (sFisse / tEntrate) * 100 : 0;
    const percDesideri = tEntrate > 0 ? (sVariabili / tEntrate) * 100 : 0;
    const percRisparmio = tEntrate > 0 ? (risparmio / tEntrate) * 100 : 0;

    const datiAndamentoAnnuale = nomiMesi.map((mese, index) => {
        const speseMese = filtraDati(spese, index, annoSelezionato).reduce((a, b) => a + b.importo, 0);
        const entrateMese = filtraDati(entrate, index, annoSelezionato).reduce((a, b) => a + b.importo, 0);
        return { name: mese, Uscite: speseMese, Entrate: entrateMese };
    });

    const chartDataTorta = Object.entries(sMeseAttuale.reduce((acc, curr) => {
        acc[curr.categoria] = (acc[curr.categoria] || 0) + curr.importo;
        return acc;
    }, {})).map(([name, value]) => ({ name, value }));

    // --- FUNZIONE GENERAZIONE PDF PREMIUM ---
    const generaPDF = (tipoReport) => {
        const doc = new jsPDF();
        const isAnnuale = tipoReport === 'ANNO';
        
        const speseExport = filtraDati(spese, meseSelezionato, annoSelezionato, isAnnuale);
        const entrateExport = filtraDati(entrate, meseSelezionato, annoSelezionato, isAnnuale);

        const totaleE = entrateExport.reduce((a, b) => a + b.importo, 0);
        const totaleU = speseExport.reduce((a, b) => a + b.importo, 0);
        const netto = totaleE - totaleU;

        // 1. Intestazione Scura
        doc.setFillColor(15, 23, 42); 
        doc.rect(0, 0, 210, 40, 'F'); 

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text("TRACKER SPESE", 14, 20);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(148, 163, 184); 
        const periodo = isAnnuale ? `Report Annuale: ${annoSelezionato}` : `Report Mensile: ${nomiMesiEstesi[meseSelezionato]} ${annoSelezionato}`;
        doc.text(periodo, 14, 28);

        // 2. Sezione Riepilogo Totali
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text("Riepilogo Finanziario", 14, 52);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);

        doc.text("Entrate Totali:", 14, 62);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129); 
        doc.text(`+ € ${totaleE.toFixed(2)}`, 14, 68);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text("Uscite Totali:", 75, 62);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(239, 68, 68); 
        doc.text(`- € ${totaleU.toFixed(2)}`, 75, 68);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text("Risparmio Netto:", 135, 62);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(netto >= 0 ? 16 : 239, netto >= 0 ? 185 : 68, netto >= 0 ? 129 : 68);
        doc.text(`€ ${netto.toFixed(2)}`, 135, 68);

        doc.setDrawColor(226, 232, 240); 
        doc.line(14, 76, 196, 76);

        // 3. Preparazione Dati Tabella
        const tuttiIMovimenti = [
            ...speseExport.map(s => ({ ...s, tipo: 'Uscita' })),
            ...entrateExport.map(e => ({ ...e, tipo: 'Entrata', frequenza: 'SINGOLA' }))
        ].sort((a, b) => b.dataInserimento?.toDate() - a.dataInserimento?.toDate());

        const colonneTabella = ["Data", "Tipo", "Categoria", "Descrizione", "Freq.", "Importo"];
        const righeTabella = tuttiIMovimenti.map(m => [
            m.dataInserimento?.toDate().toLocaleDateString('it-IT') || '',
            m.tipo,
            rimuoviEmoji(m.categoria),
            rimuoviEmoji(m.descrizione),
            m.frequenza === 'VARIABILE' || m.frequenza === 'SINGOLA' ? 'Var.' : 'Fissa',
            `€ ${m.importo.toFixed(2)}`
        ]);

        // 4. Tabella Automatica
        autoTable(doc, {
            startY: 84,
            head: [colonneTabella],
            body: righeTabella,
            theme: 'striped',
            headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold', halign: 'center' },
            alternateRowStyles: { fillColor: [248, 250, 252] }, 
            styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, textColor: [51, 65, 85] },
            columnStyles: {
                0: { halign: 'center', cellWidth: 26 }, 
                1: { halign: 'center', cellWidth: 22 }, 
                2: { cellWidth: 35 }, 
                3: { cellWidth: 'auto' }, 
                4: { halign: 'center', cellWidth: 18 },
                5: { halign: 'right', fontStyle: 'bold', cellWidth: 25 } 
            },
            didParseCell: function(data) {
                if (data.section === 'body' && data.column.index === 5) {
                    if (data.row.raw[1] === 'Entrata') {
                        data.cell.styles.textColor = [16, 185, 129];
                    } else {
                        data.cell.styles.textColor = [239, 68, 68];
                    }
                }
            }
        });

        // 5. Piè di pagina
        const pageCount = doc.internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184); 
            doc.text(
                `Generato da TrackerSpese il ${new Date().toLocaleDateString('it-IT')} - Pagina ${i} di ${pageCount}`, 
                14, 
                285 
            );
        }

        // 6. Download
        const nomeFile = isAnnuale 
            ? `Report_TrackerSpese_${annoSelezionato}.pdf` 
            : `Report_TrackerSpese_${nomiMesiEstesi[meseSelezionato]}_${annoSelezionato}.pdf`;
            
        doc.save(nomeFile);
    };

    return (
        <div className="animate-fade-in pb-20 w-full max-w-7xl mx-auto">
            
            {/* HEADER CON BOTTONI PDF */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 bg-slate-900/60 p-6 md:p-8 rounded-[2rem] border border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl">
                <div>
                    <h2 className="text-2xl font-black text-slate-100 tracking-tight">Analisi Finanziaria</h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Esporta in PDF</p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center w-full lg:w-auto">
                    <div className="flex gap-2 w-full md:w-auto">
                        <button onClick={() => generaPDF('MESE')} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-widest py-3 px-5 rounded-xl border border-rose-500/20 transition-all active:scale-95 shadow-lg group">
                            <span className="text-lg group-hover:-translate-y-0.5 transition-transform">📕</span> Mese
                        </button>
                        <button onClick={() => generaPDF('ANNO')} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest py-3 px-5 rounded-xl border border-blue-500/20 transition-all active:scale-95 shadow-lg group">
                            <span className="text-lg group-hover:-translate-y-0.5 transition-transform">📘</span> Anno
                        </button>
                    </div>

                    <div className="hidden md:block w-[1px] h-8 bg-slate-800 mx-2"></div>

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
            </div>

            {/* SEZIONE COACH 50/30/20 */}
            <div className="bg-slate-900/60 p-6 md:p-8 rounded-[2.5rem] border border-slate-800/60 mb-10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-bold text-slate-200 tracking-wide flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">🎯</div>
                        Coach Finanziario (50/30/20)
                    </h3>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800">
                        Budget Mensile
                    </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {/* Bisogni (50%) */}
                    <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800/50 shadow-inner relative overflow-hidden">
                        <div className="flex justify-between items-end mb-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Obiettivo (50%)</span>
                                <span className="text-slate-300 font-black text-lg">€ {targetBisogni.toFixed(2)}</span>
                            </div>
                            <div className="flex flex-col text-right">
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Spesa Attuale</span>
                                <span className={`font-black text-lg ${sFisse > targetBisogni ? 'text-red-400' : 'text-blue-400'}`}>
                                    € {sFisse.toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 mb-2">
                            <div className={`h-full transition-all duration-1000 ${percBisogni > 50 ? 'bg-red-500' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'}`} style={{ width: `${Math.min(percBisogni, 100)}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                            <span>Affitto, bollette, spesa base</span>
                            <span className="font-bold">{percBisogni.toFixed(1)}%</span>
                        </div>
                    </div>

                    {/* Desideri (30%) */}
                    <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800/50 shadow-inner relative overflow-hidden">
                        <div className="flex justify-between items-end mb-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Obiettivo (30%)</span>
                                <span className="text-slate-300 font-black text-lg">€ {targetDesideri.toFixed(2)}</span>
                            </div>
                            <div className="flex flex-col text-right">
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Spesa Attuale</span>
                                <span className={`font-black text-lg ${sVariabili > targetDesideri ? 'text-red-400' : 'text-purple-400'}`}>
                                    € {sVariabili.toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 mb-2">
                            <div className={`h-full transition-all duration-1000 ${percDesideri > 30 ? 'bg-red-500' : 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]'}`} style={{ width: `${Math.min(percDesideri, 100)}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                            <span>Svago, cene fuori, hobby</span>
                            <span className="font-bold">{percDesideri.toFixed(1)}%</span>
                        </div>
                    </div>

                    {/* Risparmio (20%) */}
                    <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800/50 shadow-inner relative overflow-hidden">
                        <div className="flex justify-between items-end mb-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Da mettere via (20%)</span>
                                <span className="text-slate-300 font-black text-lg">€ {targetRisparmio.toFixed(2)}</span>
                            </div>
                            <div className="flex flex-col text-right">
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Risparmiato</span>
                                <span className={`font-black text-lg ${risparmio < targetRisparmio ? 'text-orange-400' : 'text-emerald-400'}`}>
                                    € {risparmio.toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 mb-2">
                            <div className={`h-full transition-all duration-1000 ${percRisparmio >= 20 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-orange-500'}`} style={{ width: `${Math.max(0, Math.min(percRisparmio, 100))}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                            <span>Investimenti e imprevisti</span>
                            <span className="font-bold">{percRisparmio.toFixed(1)}%</span>
                        </div>
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
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 relative z-10">Risparmio Netto Mensile</p>
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