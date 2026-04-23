import { useState, useEffect } from 'react';
import { db } from './firebase';
import CryptoJS from 'crypto-js';
import {
    collection, addDoc, query, where, orderBy,
    onSnapshot, doc, deleteDoc, Timestamp, updateDoc
} from 'firebase/firestore';

function Dashboard({ utente }) {
    // --- STATI FORM ---
    const [tipo, setTipo] = useState('USCITA'); // 'USCITA' | 'RISPARMIO' | 'ENTRATA'
    const [frequenza, setFrequenza] = useState('VARIABILE');
    const [importo, setImporto] = useState('');
    const [descrizione, setDescrizione] = useState('');
    const [categoria, setCategoria] = useState('🍕 Cibo');
    const [categoriaPersonalizzata, setCategoriaPersonalizzata] = useState('');
    const [emojiSelezionata, setEmojiSelezionata] = useState('📌');
    const [dataSpesa, setDataSpesa] = useState(new Date().toISOString().split('T')[0]);
    const [dataFine, setDataFine] = useState('');
    const [caricamento, setCaricamento] = useState(false);
const [testoNaturale, setTestoNaturale] = useState('');
const [caricamentoAI, setCaricamentoAI] = useState(false);
    // --- STATI DATI ---
    const [spese, setSpese] = useState([]);
    const [entrate, setEntrate] = useState([]);
    const [risparmi, setRisparmi] = useState([]); // NUOVO STATO RISPARMI
    const [spesaInModifica, setSpesaInModifica] = useState(null);
    const [meseSelezionato, setMeseSelezionato] = useState(new Date().getMonth());
    const [annoSelezionato, setAnnoSelezionato] = useState(new Date().getFullYear());

    // --- COSTANTI ---
    const nomiMesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    const listaEmoji = ['💰', '🍕', '🛒', '🚗', '🏠', '📱', '💡', '🎁', '💊', '👕', '✈️', '🎮', '🍺', '⛽', '🐾', '🏋️', '🎬', '🛠️', '🏦', '📈', '🐷'];

    // --- LOGICA CRIPTAZIONE & FORMATTAZIONE ---
    const cripta = (testo) => CryptoJS.AES.encrypt(testo.toString(), utente.uid).toString();
    
    const decripta = (codice) => {
        try {
            const bytes = CryptoJS.AES.decrypt(codice, utente.uid);
            const testo = bytes.toString(CryptoJS.enc.Utf8);
            return testo || "";
        // eslint-disable-next-line no-unused-vars
        } catch (e) { return "Errore"; }
    };

    const formattaEuro = (valore) => {
        return valore.toLocaleString('it-IT', { 
            style: 'currency', 
            currency: 'EUR',
            minimumFractionDigits: 2 
        });
    };

const compilaConAI = async () => {
    if(!testoNaturale) return;
    setCaricamentoAI(true);
    try {
        const res = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'PARSE_EXPENSE', payload: testoNaturale })
        });
        const data = await res.json();
        const info = JSON.parse(data.result); // Trasforma il testo in oggetto Javascript

        // Autocompila i campi del form!
        setTipo(info.tipo);
        setImporto(info.importo.toString().replace('.', ','));
        setDescrizione(info.descrizione);
        setCategoria(info.categoria);
        setTestoNaturale(''); // Pulisce la barra
    } catch (err) {
        alert("Ops, l'AI non ha capito bene la frase!");
    } finally {
        setCaricamentoAI(false);
    }
};

    const formattaInputNumerico = (valore) => {
        if (!valore) return 0;
        const pulito = valore.toString().replace(',', '.').trim();
        return parseFloat(pulito) || 0;
    };

    const ottieniEmoji = (stringa) => {
        const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
        const match = stringa?.match(emojiRegex);
        return match ? match[0] : '📝';
    };

    // --- CARICAMENTO DATI ---
    useEffect(() => {
        if (!utente) return;

        const unsubSpese = onSnapshot(query(collection(db, 'spese'), where('utenteId', '==', utente.uid), orderBy('dataInserimento', 'desc')), (snapshot) => {
            let array = [];
            snapshot.forEach((d) => {
                const data = d.data();
                array.push({
                    id: d.id,
                    ...data,
                    tipoMovimento: 'USCITA',
                    importo: parseFloat(decripta(data.importo)) || 0,
                    descrizione: decripta(data.descrizione),
                    categoria: decripta(data.categoria),
                    frequenza: data.frequenza ? decripta(data.frequenza) : 'VARIABILE',
                    scadenza: data.scadenza ? decripta(data.scadenza) : ''
                });
            });
            setSpese(array);
        });

        const unsubEntrate = onSnapshot(query(collection(db, 'entrate'), where('utenteId', '==', utente.uid), orderBy('dataInserimento', 'desc')), (snapshot) => {
            let array = [];
            snapshot.forEach((d) => {
                const data = d.data();
                array.push({
                    id: d.id,
                    ...data,
                    tipoMovimento: 'ENTRATA',
                    importo: parseFloat(decripta(data.importo)) || 0,
                    descrizione: decripta(data.descrizione),
                    categoria: decripta(data.categoria)
                });
            });
            setEntrate(array);
        });

        const unsubRisparmi = onSnapshot(query(collection(db, 'risparmi'), where('utenteId', '==', utente.uid), orderBy('dataInserimento', 'desc')), (snapshot) => {
            let array = [];
            snapshot.forEach((d) => {
                const data = d.data();
                array.push({
                    id: d.id,
                    ...data,
                    tipoMovimento: 'RISPARMIO',
                    importo: parseFloat(decripta(data.importo)) || 0,
                    descrizione: decripta(data.descrizione),
                    categoria: decripta(data.categoria),
                    frequenza: data.frequenza ? decripta(data.frequenza) : 'VARIABILE',
                    scadenza: data.scadenza ? decripta(data.scadenza) : ''
                });
            });
            setRisparmi(array);
        });

        return () => { unsubSpese(); unsubEntrate(); unsubRisparmi(); };
    }, [utente]);

    // --- FILTRO ---
    const filtraDati = (lista) => lista.filter(item => {
        const dInizio = item.dataInserimento?.toDate() || new Date();
        const mInizio = dInizio.getMonth();
        const aInizio = dInizio.getFullYear();
        const mTarget = parseInt(meseSelezionato);
        const aTarget = parseInt(annoSelezionato);

        if (item.frequenza === 'FISSA') {
            const iniziata = (aInizio < aTarget) || (aInizio === aTarget && mInizio <= mTarget);
            let nonScaduta = true;
            if (item.scadenza) {
                const dFine = new Date(item.scadenza);
                nonScaduta = (aTarget < dFine.getFullYear()) || (aTarget === dFine.getFullYear() && mTarget <= dFine.getMonth());
            }
            return iniziata && nonScaduta;
        }
        return mInizio === mTarget && aInizio === aTarget;
    });

    const speseFiltrate = filtraDati(spese);
    const entrateFiltrate = filtraDati(entrate);
    const risparmiFiltrati = filtraDati(risparmi);

    const totaleSpese = speseFiltrate.reduce((acc, s) => acc + (s.importo || 0), 0);
    const totaleEntrate = entrateFiltrate.reduce((acc, s) => acc + (s.importo || 0), 0);
    const totaleRisparmi = risparmiFiltrati.reduce((acc, s) => acc + (s.importo || 0), 0);
    
    // Quello che ti rimane in tasca da spendere liberamente
    const liquiditaNetta = totaleEntrate - totaleSpese - totaleRisparmi;

    // Gestione intelligente delle categorie nel form in base al tipo
    const catSpese = [...new Set(['🍕 Cibo', '🚗 Trasporti', '💡 Bollette', '🎉 Svago', '🛒 Spesa', '🏠 Casa', ...spese.map(s => s.categoria)])];
    const catRisparmi = [...new Set(['🏦 Conto Deposito', '🐷 Salvadanaio', '📈 Investimenti', '₿ Crypto', ...risparmi.map(s => s.categoria)])];
    const opzioniCategorie = tipo === 'RISPARMIO' ? catRisparmi : catSpese;

    // --- SALVATAGGIO ---
    const salvaSpesa = async (e) => {
        e.preventDefault();
        setCaricamento(true);
        
        const importoPulito = formattaInputNumerico(importo);
        let collezione = 'spese';
        let categoriaFinale = categoria;

        if (tipo === 'ENTRATA') {
            collezione = 'entrate';
            categoriaFinale = '💰 Entrata';
        } else if (tipo === 'RISPARMIO') {
            collezione = 'risparmi';
            categoriaFinale = categoria === 'CREA_NUOVA' ? `${emojiSelezionata} ${categoriaPersonalizzata}` : categoria;
        } else {
            categoriaFinale = categoria === 'CREA_NUOVA' ? `${emojiSelezionata} ${categoriaPersonalizzata}` : categoria;
        }

        const datiDaSalvare = {
            importo: cripta(importoPulito),
            descrizione: cripta(descrizione),
            categoria: cripta(categoriaFinale),
            frequenza: cripta(frequenza),
            scadenza: dataFine ? cripta(dataFine) : '',
            utenteId: utente.uid,
            dataInserimento: Timestamp.fromDate(new Date(dataSpesa))
        };

        try {
            if (spesaInModifica) {
                await updateDoc(doc(db, collezione, spesaInModifica.id), datiDaSalvare);
                setSpesaInModifica(null);
            } else {
                await addDoc(collection(db, collezione), datiDaSalvare);
            }
            
            // Reset form
            setImporto(''); 
            setDescrizione(''); 
            setCategoria(tipo === 'RISPARMIO' ? '🏦 Conto Deposito' : '🍕 Cibo'); 
            setFrequenza('VARIABILE'); 
            setDataFine('');
            setDataSpesa(new Date().toISOString().split('T')[0]);
        } catch (err) { console.error(err); } finally { setCaricamento(false); }
    };

    return (
        <div className="animate-fade-in pb-20 w-full max-w-7xl mx-auto px-4">

            {/* BANNER PRIVACY DISCRETO */}
            <div className="flex justify-center mb-6">
                <span className="flex items-center gap-1.5 text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full font-bold uppercase tracking-widest border border-emerald-500/20 shadow-[0_0_15px_rgba(52,211,153,0.1)]">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
                    Criptazione End-to-End
                </span>
            </div>

            {/* HEADER TOTALI AGGIORNATO */}
            <div className="flex flex-col gap-6 mb-12 bg-slate-900/60 p-6 md:p-8 rounded-[2rem] border border-slate-800 shadow-xl backdrop-blur-xl">
                
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    {/* SELETTORE DATA */}
                    <div className="flex flex-col gap-2 w-full lg:w-auto">
                        <p className="text-[10px] text-slate-500 font-bold uppercase ml-2 tracking-widest">Periodo</p>
                        <div className="flex gap-2 bg-slate-950/50 p-2 rounded-2xl border border-slate-800/50">
                            <select value={meseSelezionato} onChange={(e) => setMeseSelezionato(e.target.value)} className="bg-transparent border-none text-emerald-400 font-bold outline-none cursor-pointer p-1">
                                {nomiMesi.map((m, i) => <option key={i} value={i} className="bg-slate-900">{m}</option>)}
                            </select>
                            <div className="w-[1px] bg-slate-800 my-1"></div>
                            <select value={annoSelezionato} onChange={(e) => setAnnoSelezionato(e.target.value)} className="bg-transparent border-none text-emerald-400 font-bold outline-none cursor-pointer p-1">
                                {[2024, 2025, 2026].map(a => <option key={a} value={a} className="bg-slate-900">{a}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* TOTALI CON RISPARMIO E LIQUIDITÀ */}
                    <div className="grid grid-cols-2 md:flex w-full lg:w-auto gap-4 md:gap-8 justify-between lg:justify-end items-center">
                        <div className="text-right">
                            <p className="text-slate-500 uppercase text-[10px] font-bold tracking-widest mb-1">Entrate</p>
                            <h2 className="text-lg md:text-xl font-bold text-emerald-400/90 tracking-tight">{formattaEuro(totaleEntrate)}</h2>
                        </div>
                        <div className="hidden md:block w-[1px] h-10 bg-slate-800"></div>
                        <div className="text-right">
                            <p className="text-slate-500 uppercase text-[10px] font-bold tracking-widest mb-1">Uscite</p>
                            <h2 className="text-lg md:text-xl font-bold text-red-400/90 tracking-tight">{formattaEuro(totaleSpese)}</h2>
                        </div>
                        <div className="hidden md:block w-[1px] h-10 bg-slate-800"></div>
                        <div className="text-right">
                            <p className="text-blue-400/80 uppercase text-[10px] font-bold tracking-widest mb-1 flex items-center justify-end gap-1"><span className="text-xs"></span> Accantonato</p>
                            <h2 className="text-lg md:text-xl font-bold text-blue-400 tracking-tight">{formattaEuro(totaleRisparmi)}</h2>
                        </div>
                        <div className="col-span-2 md:col-span-1 bg-slate-950 p-4 rounded-2xl px-6 border border-slate-800/50 shadow-inner flex flex-col justify-center text-right min-w-[140px] mt-2 md:mt-0">
                            <p className="text-slate-500 uppercase text-[10px] font-bold tracking-widest mb-1">Liquidità Rimasta</p>
                            <h2 className={`text-xl md:text-2xl font-black tracking-tighter ${liquiditaNetta >= 0 ? 'text-slate-100' : 'text-red-400'}`}>
                                {formattaEuro(liquiditaNetta)}
                            </h2>
                        </div>
                    </div>
                </div>
            </div>
  {/* MAGIC INPUT AI */}
<div className="bg-slate-900/60 p-6 rounded-[2rem] border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)] backdrop-blur-xl mb-6 relative overflow-hidden">
    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl"></div>
    <h3 className="text-xs font-bold text-emerald-400 mb-3 flex items-center gap-2 uppercase tracking-widest">
        <span>✨</span> Inserimento Magico
    </h3>
    <div className="flex gap-3">
        <input
            type="text"
            value={testoNaturale}
            onChange={(e) => setTestoNaturale(e.target.value)}
            placeholder="Es. 'Ho speso 15€ per la pizza'"
            className="flex-1 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 outline-none focus:border-emerald-500/50 transition-all text-sm"
            onKeyDown={(e) => e.key === 'Enter' && compilaConAI()}
        />
        <button
            onClick={compilaConAI}
            disabled={caricamentoAI || !testoNaturale}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold px-5 rounded-xl transition-all shadow-lg active:scale-95"
        >
            {caricamentoAI ? '⏳...' : 'Genera'}
        </button>
    </div>
</div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                {/* COLONNA FORM (STICKY) */}
                <div className="lg:col-span-5 lg:sticky lg:top-28">
                    <div className="bg-slate-900/60 p-6 md:p-8 rounded-[2rem] border border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl">
                        <h3 className="text-lg font-bold text-white mb-6 text-center tracking-wide">
                            {spesaInModifica ? 'Modifica Movimento' : 'Nuovo Movimento'}
                        </h3>

                        {/* TOGGLE TIPO A 3 VIE */}
                        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800/50 mb-8 relative">
                            <button type="button" onClick={() => { setTipo('USCITA'); setSpesaInModifica(null); setCategoria('🍕 Cibo'); }} className={`flex-1 py-3 rounded-xl font-bold text-[10px] tracking-wider transition-all z-10 ${tipo === 'USCITA' ? 'text-red-400' : 'text-slate-500 hover:text-slate-300'}`}>USCITA</button>
                            <button type="button" onClick={() => { setTipo('RISPARMIO'); setSpesaInModifica(null); setCategoria('🏦 Conto Deposito'); }} className={`flex-1 py-3 rounded-xl font-bold text-[10px] tracking-wider transition-all z-10 ${tipo === 'RISPARMIO' ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>RISPARMIO</button>
                            <button type="button" onClick={() => { setTipo('ENTRATA'); setSpesaInModifica(null); }} className={`flex-1 py-3 rounded-xl font-bold text-[10px] tracking-wider transition-all z-10 ${tipo === 'ENTRATA' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>ENTRATA</button>
                            
                            {/* Sfondo Toggle Animato (3 posizioni) */}
                            <div className={`absolute top-1.5 bottom-1.5 w-[calc(33.33%-5px)] bg-slate-800 rounded-xl transition-all duration-300 ease-out shadow-sm 
                                ${tipo === 'USCITA' ? 'left-1.5' : tipo === 'RISPARMIO' ? 'left-[calc(33.33%+1.5px)]' : 'left-[calc(66.66%-1.5px)]'}`}>
                            </div>
                        </div>

                        <form onSubmit={salvaSpesa} className="flex flex-col gap-5">
                            
                            {/* DATE */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-slate-500 font-bold uppercase ml-2 tracking-widest">Inizio</label>
                                    <input type="date" required value={dataSpesa} onChange={(e) => setDataSpesa(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-950 border-none ring-1 ring-slate-800 text-slate-200 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" />
                                </div>
                                {frequenza === 'FISSA' && (
                                    <div className="space-y-1.5 animate-fade-in">
                                        <label className="text-[10px] text-indigo-400/80 font-bold uppercase ml-2 tracking-widest">Scadenza (Opz.)</label>
                                        <input type="date" value={dataFine} onChange={(e) => setDataFine(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-950/50 border-none ring-1 ring-indigo-500/30 text-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all" />
                                    </div>
                                )}
                            </div>

                            {/* IMPORTO */}
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xl">€</span>
                                <input 
                                    type="text" 
                                    inputMode="decimal"
                                    required 
                                    value={importo} 
                                    onChange={(e) => setImporto(e.target.value)} 
                                    className={`w-full pl-12 p-5 rounded-2xl bg-slate-950 border-none ring-1 ring-slate-800 text-3xl font-black outline-none transition-all 
                                        ${tipo === 'ENTRATA' ? 'text-emerald-400 focus:ring-2 focus:ring-emerald-500/50' 
                                        : tipo === 'RISPARMIO' ? 'text-blue-400 focus:ring-2 focus:ring-blue-500/50' 
                                        : 'text-slate-100 focus:ring-2 focus:ring-red-500/50'}`} 
                                    placeholder="0,00" 
                                />
                            </div>

                            {/* DESCRIZIONE */}
                            <input type="text" required value={descrizione} onChange={(e) => setDescrizione(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-950 border-none ring-1 ring-slate-800 text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" placeholder="Di cosa si tratta?" />

                            {(tipo === 'USCITA' || tipo === 'RISPARMIO') && (
                                <>
                                    {/* FREQUENZA */}
                                    <div className="flex gap-3">
                                        <button type="button" onClick={() => setFrequenza('VARIABILE')} className={`flex-1 py-3 px-4 rounded-2xl text-[11px] font-bold tracking-widest transition-all ring-1 outline-none ${frequenza === 'VARIABILE' ? 'bg-slate-800 text-white ring-slate-600 shadow-md' : 'bg-transparent text-slate-500 ring-slate-800 hover:ring-slate-600'}`}>
                                            ☁️ VARIABILE
                                        </button>
                                        <button type="button" onClick={() => setFrequenza('FISSA')} className={`flex-1 py-3 px-4 rounded-2xl text-[11px] font-bold tracking-widest transition-all ring-1 outline-none ${frequenza === 'FISSA' ? 'bg-indigo-500/10 text-indigo-400 ring-indigo-500/30 shadow-md' : 'bg-transparent text-slate-500 ring-slate-800 hover:ring-indigo-500/30'}`}>
                                            📌 FISSA
                                        </button>
                                    </div>

                                    {/* CATEGORIA (Dinamica) */}
                                    <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-950 border-none ring-1 ring-slate-800 text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer appearance-none">
                                        {opzioniCategorie.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                                        <option value="CREA_NUOVA" className="font-bold text-emerald-400 bg-slate-900">➕ Nuova Categoria...</option>
                                    </select>

                                    {/* EMOJI PICKER */}
                                    {categoria === 'CREA_NUOVA' && (
                                        <div className="p-5 bg-slate-950/50 rounded-2xl ring-1 ring-emerald-500/30 space-y-4 animate-fade-in shadow-inner">
                                            <p className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-widest text-center">Scegli un'icona</p>
                                            <div className="grid grid-cols-6 gap-2">
                                                {listaEmoji.map(emo => (
                                                    <button key={emo} type="button" onClick={() => setEmojiSelezionata(emo)} className={`text-xl p-2 rounded-xl transition-all flex items-center justify-center ${emojiSelezionata === emo ? 'bg-emerald-500/20 ring-1 ring-emerald-500 scale-110 shadow-lg' : 'bg-slate-900 hover:bg-slate-800'}`}>{emo}</button>
                                                ))}
                                            </div>
                                            <input type="text" required value={categoriaPersonalizzata} onChange={(e) => setCategoriaPersonalizzata(e.target.value)} className="w-full p-4 rounded-xl bg-slate-900 border-none ring-1 ring-slate-700 text-slate-200 outline-none focus:ring-1 focus:ring-emerald-500 mt-2" placeholder="Nome categoria" />
                                        </div>
                                    )}
                                </>
                            )}

                            {/* SUBMIT BUTTON COLORATO IN BASE AL TIPO */}
                            <button type="submit" disabled={caricamento} className={`mt-4 w-full py-4 rounded-2xl font-bold tracking-widest text-sm transition-all shadow-lg active:scale-[0.98] 
                                ${tipo === 'ENTRATA' ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20' 
                                : tipo === 'RISPARMIO' ? 'bg-blue-500 text-white hover:bg-blue-400 shadow-blue-500/20'
                                : 'bg-slate-200 text-slate-900 hover:bg-white shadow-white/10'}`}>
                                {caricamento ? 'ELABORAZIONE...' : (spesaInModifica ? 'AGGIORNA MOVIMENTO' : 'SALVA MOVIMENTO')}
                            </button>

                            {/* ANNULLA MODIFICA */}
                            {spesaInModifica && (
                                <button type="button" onClick={() => { setSpesaInModifica(null); setImporto(''); setDescrizione(''); setCategoria('🍕 Cibo'); setDataFine(''); }} className="py-2 text-xs font-bold tracking-widest uppercase text-slate-500 hover:text-slate-300 transition-colors">
                                    Annulla Modifica
                                </button>
                            )}
                        </form>
                    </div>
                </div>

                {/* COLONNA LISTA */}
                <div className="lg:col-span-7 space-y-4 mt-8 lg:mt-0">
                    <div className="flex items-center justify-between px-2 mb-6">
                        <h3 className="text-lg font-bold text-slate-200 tracking-wide">Movimenti di {nomiMesi[meseSelezionato]}</h3>
                        <span className="text-xs font-bold text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">{speseFiltrate.length + entrateFiltrate.length + risparmiFiltrati.length} elementi</span>
                    </div>

                    <div className="flex flex-col gap-3">
                        {/* UNISCE SPESE, ENTRATE E RISPARMI */}
                        {[...speseFiltrate, ...entrateFiltrate, ...risparmiFiltrati].sort((a, b) => b.dataInserimento?.toDate() - a.dataInserimento?.toDate()).map(s => (
                            <div key={s.id} className="flex items-center justify-between p-4 bg-slate-900/40 rounded-[1.5rem] border border-slate-800/60 group hover:border-slate-700 hover:bg-slate-900/60 transition-all backdrop-blur-sm shadow-sm">

                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 flex items-center justify-center bg-slate-950 rounded-[1.2rem] text-2xl border border-slate-800/50 shadow-inner group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
                                        {ottieniEmoji(s.categoria)}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <h4 className="font-bold text-slate-200 text-sm md:text-base leading-tight capitalize truncate max-w-[150px] sm:max-w-[200px]">{s.descrizione}</h4>
                                        <div className="flex flex-wrap items-center gap-1.5 text-[8px] xs:text-[9px] sm:text-[10px] font-bold tracking-widest uppercase">
                                            <span className={s.tipoMovimento === 'RISPARMIO' ? 'text-blue-400' : 'text-slate-500'}>{s.categoria}</span>
                                            <span className="text-slate-700">•</span>
                                            <span className="text-slate-400">{s.dataInserimento?.toDate().toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</span>

                                            {s.frequenza === 'FISSA' && (
                                                <>
                                                    <span className="text-slate-700 hidden sm:inline">•</span>
                                                    <span className="text-indigo-400/80 bg-indigo-500/10 px-1.5 py-0.5 rounded-md border border-indigo-500/20 text-[7px] xs:text-[8px] sm:text-[9px] leading-tight">
                                                        {s.scadenza ? `Fino al ${new Date(s.scadenza).toLocaleDateString('it-IT', { month: 'short', year: '2-digit' })}` : '📌 Fissa'}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-4">
                                    <span className={`whitespace-nowrap font-black text-base sm:text-lg tracking-tight 
                                        ${s.tipoMovimento === 'ENTRATA' ? 'text-emerald-400' 
                                        : s.tipoMovimento === 'RISPARMIO' ? 'text-blue-400' 
                                        : 'text-slate-200'}`}>
                                        {s.tipoMovimento === 'ENTRATA' ? '+ ' : s.tipoMovimento === 'RISPARMIO' ? '↓ ' : '- '}
                                        {formattaEuro(s.importo)}
                                    </span>

                                    {/* AZIONI (Modifica / Elimina) */}
                                    <div className="flex bg-slate-950 border border-slate-800 rounded-xl overflow-hidden 
                                            opacity-100 translate-x-0 
                                            lg:opacity-0 lg:group-hover:opacity-100 
                                            lg:translate-x-2 lg:group-hover:translate-x-0 
                                            transition-all duration-300">
                                        <button onClick={() => {
                                            setSpesaInModifica({ id: s.id, tipoMovimento: s.tipoMovimento }); // Ora salvo anche il tipo per capire cosa modificare
                                            setTipo(s.tipoMovimento);
                                            setImporto(s.importo.toString().replace('.', ','));
                                            setDescrizione(s.descrizione); setCategoria(s.categoria);
                                            setFrequenza(s.frequenza || 'VARIABILE');
                                            setDataSpesa(s.dataInserimento?.toDate().toISOString().split('T')[0]);
                                            if (s.scadenza) setDataFine(s.scadenza); else setDataFine('');
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }} className="p-2.5 text-slate-500 hover:text-emerald-400 hover:bg-slate-900 transition-colors" title="Modifica">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                        </button>
                                        <div className="w-[1px] bg-slate-800"></div>
                                        <button onClick={() => { 
                                            if (window.confirm("Sei sicuro di voler eliminare questo movimento?")) {
                                                const collName = s.tipoMovimento === 'ENTRATA' ? 'entrate' : s.tipoMovimento === 'RISPARMIO' ? 'risparmi' : 'spese';
                                                deleteDoc(doc(db, collName, s.id));
                                            }
                                        }} className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 transition-colors" title="Elimina">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                    </div>
                                </div>

                            </div>
                        ))}

                        {(speseFiltrate.length + entrateFiltrate.length + risparmiFiltrati.length) === 0 && (
                            <div className="flex flex-col items-center justify-center py-24 px-4 bg-slate-900/20 rounded-[2rem] border border-dashed border-slate-800 text-center">
                                <span className="text-4xl mb-4 opacity-50">🍃</span>
                                <p className="text-slate-400 font-medium">Nessun movimento trovato</p>
                                <p className="text-slate-500 text-sm mt-1">Registra la tua prima spesa per iniziare.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;