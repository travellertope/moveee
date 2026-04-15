
const { GoogleGenAI } = require("@google/genai");

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not set");
    return;
  }
  const ai = new GoogleGenAI({ apiKey });
  try {
    const models = await ai.models.list();
    console.log(JSON.stringify(models, null, 2));
  } catch (err) {
    console.error("Error listing models:", err.message);
  }
}

listModels();
