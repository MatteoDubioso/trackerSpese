export default async function handler(req, res) {
    console.log("🪄 [API INSERIMENTO] Richiesta ricevuta!");
    console.log("➡️ Metodo:", req.method);

    // 1. Il "Pre-flight" (Sblocca l'errore 405)
    if (req.method === 'OPTIONS') {
        console.log("✅ [API INSERIMENTO] Risposta OPTIONS ok");
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        console.error(`❌ [API INSERIMENTO] BLOCCO 405: Ricevuto ${req.method}`);
        return res.status(405).json({ error: 'Usa POST' });
    }

    const { action, payload } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        console.error("❌ [API INSERIMENTO] GROQ_API_KEY mancante!");
        return res.status(500).json({ error: 'Chiave API mancante' });
    }

    const prompt = `Sei l'assistente di un'app di finanza. L'utente ha scritto: "${payload}".
    Estrai i dati e restituisci SOLO un JSON valido (senza markdown o altri testi) con questa esatta struttura:
    {
      "importo": numero, 
      "descrizione": "testo breve", 
      "categoria": "Cibo/Trasporti/Bollette/Svago/Spesa/Casa/Conto Deposito", 
      "tipo": "USCITA/ENTRATA/RISPARMIO"
    }`;

    try {
        console.log("⏳ [API INSERIMENTO] Chiamo Groq...");
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error("❌ [API INSERIMENTO] Errore Groq:", data.error.message);
            return res.status(500).json({ error: data.error.message });
        }

        let text = data.choices[0].message.content;
        console.log("🤖 [API INSERIMENTO] Risposta grezza:", text);
        
        // Pulizia del JSON
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return res.status(200).json({ result: text });
    } catch (error) {
        console.error("❌ [API INSERIMENTO] Errore di rete:", error);
        return res.status(500).json({ error: 'Errore AI' });
    }
}