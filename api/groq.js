export default async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Usa POST' });

    const { action, payload } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY mancante' });

    const prompt = `Sei l'assistente di un'app di finanza. L'utente ha scritto: "${payload}".
    Estrai i dati e restituisci SOLO un JSON valido (senza markdown o altri testi) con questa esatta struttura:
    {
      "importo": numero, 
      "descrizione": "testo breve", 
      "categoria": "Cibo/Trasporti/Bollette/Svago/Spesa/Casa/Conto Deposito", 
      "tipo": "USCITA/ENTRATA/RISPARMIO"
    }`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
model: "llama-3.1-8b-instant",                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();
        let text = data.choices[0].message.content;
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return res.status(200).json({ result: text });
    } catch (error) {
        return res.status(500).json({ error: 'Errore AI' });
    }
}