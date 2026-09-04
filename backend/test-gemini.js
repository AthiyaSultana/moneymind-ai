require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function test() {
  try {
    console.log("Testing journal-style prompt...");

    const message = "A budget built around a 45000 rupees";

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
    });

    console.log("SUCCESS:");
    console.log(response.text);
  } catch (error) {
    console.error("FAILED:");
    console.error("Status:", error.status);
    console.error("Message:", error.message);
  }
}

test();