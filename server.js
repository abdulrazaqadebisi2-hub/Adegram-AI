const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Automatically reads GEMINI_API_KEY from your Render environment variables
const ai = new GoogleGenAI();

// Active Gemini models (ordered by priority for automatic fallback)
const MODELS = ["gemini-3.8-flash", "gemini-3.5-flash-lite"];

const SYSTEM_PROMPT = `You are Adegram AI, a helpful and intelligent assistant built by Sulaiman Abdul Razaq Adebisi (CEO of Adegram Studio, based in Offa, Kwara State, Nigeria). Be clear, friendly, and helpful.`;

app.post("/api/chat", async (req, res) => {
  try {
    // Supports common frontend payload keys (message, prompt, or text)
    const userMessage = req.body.message || req.body.prompt || req.body.text;
    const userName = req.body.userName || "User";

    if (!userMessage) {
      return res.status(400).json({ error: "Message is required." });
    }

    let replyText = null;
    let lastError = null;

    // Try primary model first, fall back to secondary model if unavailable
    for (const modelName of MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: userMessage,
          config: {
            systemInstruction: `${SYSTEM_PROMPT} You are currently chatting with ${userName}.`,
          },
        });

        replyText = response.text;
        if (replyText) break;
      } catch (err) {
        console.error(`Model ${modelName} failed:`, err.message);
        lastError = err;
      }
    }

    if (!replyText) {
      throw lastError || new Error("All Gemini models failed to respond.");
    }

    // Returns both 'reply' and 'response' keys so your existing frontend works seamlessly
    return res.json({
      reply: replyText,
      response: replyText,
    });
  } catch (error) {
    console.error("Server API Error:", error);
    return res.status(500).json({
      error: `Sorry, Adegram AI encountered an issue: ${error.message}. Tell Sulaiman to check the server logs.`,
    });
  }
});

// Fallback route to serve your main HTML page
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Adegram AI server running on port ${PORT}`);
});
