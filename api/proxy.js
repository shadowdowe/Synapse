export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { prompt } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'API key is not configured on the server.' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

        const requestBody = {
            contents: [{
                parts: [{ "text": prompt }]
            }],
            safetySettings: [
                { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE" },
                { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE" },
                { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE" },
                { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE" }
            ]
        };

        const apiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error('Google API Error:', errorText);
            return new Response(JSON.stringify({ error: `Google API Error: ${apiResponse.status}` }), {
                status: apiResponse.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const data = await apiResponse.json();
        
        if (data.promptFeedback && data.promptFeedback.blockReason) {
            return new Response(`Request blocked by API for reason: ${data.promptFeedback.blockReason}`, {
                status: 400,
                headers: { 'Content-Type': 'text/plain' }
            });
        }

        if (!data.candidates || !data.candidates[0].content.parts[0].text) {
             const fallbackText = "AI response is empty or malformed. The content might have been blocked by the API despite safety settings.";
             return new Response(fallbackText, {
                status: 200,
                headers: { 'Content-Type': 'text/plain' }
             });
        }
       
        const responseText = data.candidates[0].content.parts[0].text;
        
        return new Response(responseText, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });

    } catch (error) {
        console.error('Internal Server Error:', error);
        return new Response(JSON.stringify({ error: 'An internal server error occurred.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
              }
