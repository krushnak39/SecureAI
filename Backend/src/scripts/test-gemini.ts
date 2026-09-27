import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

async function main() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: "Explain in one sentence what a SQL injection is.",
  });

  console.log("\n=== GEMINI TEST RESULT ===\n");
  console.log(response.text);
}

main().catch((error) => {
  console.error("\nGEMINI TEST FAILED:");
  console.error(error);
  process.exit(1);
});