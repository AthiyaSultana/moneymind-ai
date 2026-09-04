const { GoogleGenAI } = require("@google/genai");

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured");
}

const ai = new GoogleGenAI({
  apiKey,
});

async function generateJournalResponse(history, retries = 3, delay = 1000) {
  console.log("========== GEMINI REQUEST ==========");
  console.log("Messages in conversation:", history.length);
  console.log("Time:", new Date().toISOString());
  console.log("====================================");

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: history,
      });

      console.log("========== GEMINI SUCCESS ==========");

      return response.text;
    } catch (error) {
      console.warn(
        `Attempt ${attempt} failed with status ${
          error.status || "unknown"
        }: ${error.message}`
      );

      if (error.status === 503 && attempt < retries) {
        console.log(`Retrying in ${delay}ms...`);

        await new Promise((resolve) =>
          setTimeout(resolve, delay)
        );

        delay *= 2;
      } else {
        console.error("========== JOURNAL ERROR ==========");
        throw error;
      }
    }
  }
}

module.exports = {
  generateJournalResponse,
};