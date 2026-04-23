export default async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Usa POST' });

    const { payload } = req.body;
    const apiKey = process.env.GROQ_API_KEY; // Ora usiamo GROQ!

    if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY mancante' });

    const prompt = `Agisci come un coach finanziario esperto. Analizza questi dati del mese dell'utente: ${JSON.stringify(payload)}. 
    Dai un consiglio motivazionale o correttivo basato sulla regola 50/30/20. 
    Sii breve (max 3 righe), amichevole e usa le emoji. Nessun markdown strano.`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama3-8b-8192", // Modello velocissimo e intelligente
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error("Errore Groq:", data.error.message);
            return res.status(500).json({ error: data.error.message });
        }

        const text = data.choices[0].message.content;
        return res.status(200).json({ result: text });

    } catch (error) {
        console.error("Errore Fetch:", error);
        return res.status(500).json({ error: 'Errore interno' });
    }
}