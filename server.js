const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
// Allow up to 15MB payloads so users can upload high-resolution photos
app.use(express.json({ limit: "15mb" }));

const publicDir = fs.existsSync(path.join(__dirname, "public", "index.html"))
  ? path.join(__dirname, "public")
  : __dirname;

app.use(express.static(publicDir));

const MODELS = ["gemini-3.8-flash", "gemini-3.5-flash-lite"];

const SYSTEM_PROMPT = `You are Adegram AI, an advanced, helpful, and intelligent multimodal AI assistant created and built by Sulaiman Abdul Razaq Adebisi from Offa, Kwara State, Nigeria, who is the CEO of Adegram Studio.
- When asked who built you, who created you, or who Sulaiman is, proudly share that you were built by Sulaiman Abdul Razaq Adebisi from Offa, Kwara State, CEO of Adegram Studio.
- Communicate clearly, warmly, and accurately, using clean Markdown formatting (headings, bullet points, and code blocks) just like Google Gemini.
- You can analyze uploaded images, answer complex questions, write code, brainstorm ideas, and assist with everyday tasks.`;

app.post("/api/chat", async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing in Render Environment Variables.",
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const { message, image, history = [], userName = "User" } = req.body;

    if (!message && !image) {
      return res.status(400).json({ error: "Please enter a message or upload an image." });
    }

    // Build conversation contents including previous turns for Gemini-style memory
    const contents = [];

    for (const turn of history.slice(-10)) {
      if (turn.role && turn.text) {
        contents.push({
          role: turn.role === "user" ? "user" : "model",
          parts: [{ text: turn.text }],
        });
      }
    }

    // Build the current user turn (text + optional image)
    const currentParts = [];
    if (image && image.data && image.mimeType) {
      currentParts.push({
        inlineData: {
          data: image.data,
          mimeType: image.mimeType,
        },
      });
    }
    currentParts.push({
      text: message || "Please analyze and describe this image in detail.",
    });

    contents.push({
      role: "user",
      parts: currentParts,
    });

    let replyText = null;
    let lastError = null;

    for (const modelName of MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction: `${SYSTEM_PROMPT}\nYou are currently chatting with ${userName}.`,
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

    return res.json({ reply: replyText });
  } catch (error) {
    console.error("Server API Error:", error);
    return res.status(500).json({
      error: `Sorry, Adegram AI encountered an issue: ${error.message}. Tell Sulaiman to check the API key or server logs.`,
    });
  }
});

app.use((req, res) => {
  const indexPath = path.join(publicDir, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send("Adegram AI backend is live.");
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Adegram AI server running on port ${PORT}`);
});
