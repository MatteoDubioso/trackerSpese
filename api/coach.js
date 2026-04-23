export default async function handler(req, res) {
    // 1. Log iniziale: capiamo se la funzione viene almeno chiamata
    console.log("🚀 [API COACH] Inizio esecuzione della funzione!");
    console.log("➡️ Metodo della richiesta:", req.method);

    if (req.method === 'OPTIONS') {
        console.log("✅ [API COACH] Risposta pre-flight OPTIONS inviata con successo");
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        console.error(`❌ [API COACH] BLOCCO 405: Ricevuto metodo ${req.method} invece di POST`);
        return res.status(405).json({ error: 'Metodo non consentito.' });
    }

    // 2. Verifichiamo cosa sta arrivando da React
    console.log("📦 [API COACH] Body ricevuto:", req.body);

    const { payload } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // 3. Verifichiamo se Vercel sta leggendo la chiave segreta
    if (!apiKey) {
        console.error("❌ [API COACH] ERRORE: La GEMINI_API_KEY non è configurata su Vercel!");
        return res.status(500).json({ error: 'Chiave API non configurata.' });
    } else {
        // Stampiamo solo i primi 5 caratteri della chiave per sicurezza
        console.log("🔑 [API COACH] API Key trovata. Inizia con:", apiKey.substring(0, 5) + "...");
    }

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const prompt = `Agisci come un coach finanziario esperto. Analizza questi dati del mese dell'utente: ${JSON.stringify(payload)}. 
    Dai un consiglio motivazionale o correttivo basato sulla regola 50/30/20. 
    Sii breve (max 3 righe), amichevole e usa le emoji.`;

    try {
        console.log("⏳ [API COACH] Contattando i server di Google Gemini...");
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        
        // 4. Verifichiamo se Google ci ha risposto con un errore (es. chiave invalida)
        if (data.error) {
            console.error("❌ [API COACH] ERRORE DA GOOGLE:", data.error.message);
            return res.status(500).json({ error: data.error.message });
        }

        const text = data.candidates[0].content.parts[0].text;
        console.log("✅ [API COACH] Risposta di Gemini ricevuta con successo!");

        return res.status(200).json({ result: text });
    } catch (error) {
        console.error("❌ [API COACH] ERRORE GRAVE DURANTE LA FETCH:", error);
        return res.status(500).json({ error: 'Errore interno del coach' });
    }
}