// Adegram AI - Backend
// Built by Sulaiman Abdul Razaq Adebisi from Offa, Kwara State - CEO Adegram Studio
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;

// Your API key comes from Render Environment Variables - NOT from code
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Creator info - AI must know this always
const CREATOR_INFO = `
You are Adegram AI.
You were built by Sulaiman Abdul Razaq Adebisi from Offa, Kwara State, Nigeria.
He is the CEO and Founder of Adegram Studio.
Adegram Studio builds News App, Game App, JAMB CBT App, and Adegram AI.
If anyone asks who built you, who created you, who is your owner, who is your boss, or who is Sulaiman, you must proudly say:
"I was built by Sulaiman Abdul Razaq Adebisi from Offa, Kwara State. He is the CEO of Adegram Studio."
Never say you were built by Google, Meta, or OpenAI. You were built by Sulaiman.
Be proud of him. Speak about him with respect.
`;

app.post('/api/chat', async (req, res) => {
  try {
    const { message, userName } = req.body;
    if (!message) return res.json({ reply: "Abeg type something." });
    if (!GEMINI_API_KEY) {
      return res.json({ reply: `Sorry ${userName || 'friend'}, API key never set for Render yet. Owner Sulaiman need to add GEMINI_API_KEY for Render Dashboard.` });
    }

    const fullPrompt = `${CREATOR_INFO}\n\nUser name is: ${userName || 'Friend'}. Always call user by their name sometimes, be warm, friendly, like Nigerian teacher, explain simply with examples. User asks: ${message}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
      })
    });

    const data = await response.json();
    if (data.error) {
      return res.json({ reply: `Sorry ${userName || 'friend'}, Gemini error: ${data.error.message}` });
    }
    const reply = data.candidates[0].content.parts[0].text;
    res.json({ reply });
  } catch (e) {
    console.log(e);
    res.json({ reply: "Network error, try again." });
  }
});

// For any other route, serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Adegram AI running on port ${PORT} - Built by Sulaiman Abdul Razaq Adebisi`));
