export default async function handler(req, res) {
    // Gestione CORS pre-flight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Richiesta non valida. Usa POST.' });
    }

    const { action, payload } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Configurazione mancante: GEMINI_API_KEY non trovata su Vercel.' });
    }

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const prompt = `Sei l'assistente di un'app di finanza. L'utente ha scritto: "${payload}".
    Estrai i dati e restituisci SOLO un JSON valido (senza markdown o altri testi) con questa esatta struttura:
    {
      "importo": numero, 
      "descrizione": "testo breve", 
      "categoria": "Cibo/Trasporti/Bollette/Svago/Spesa/Casa/Conto Deposito", 
      "tipo": "USCITA/ENTRATA/RISPARMIO"
    }`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        let text = data.candidates[0].content.parts[0].text;
        
        // Pulisce la risposta da eventuali tag markdown ```json
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return res.status(200).json({ result: text });
    } catch (error) {
        return res.status(500).json({ error: 'Errore durante la comunicazione con Gemini' });
    }
}