import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function summarizeIssue(title: string, description: string, comments: string[]) {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is not set. Skipping AI summarization.");
    return `Summary of ${title}: A community issue with ${comments.length} comments.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an AI assistant for a civic engagement platform. 
      Summarize the following civic issue and community feedback into a concise 3-point action summary for local authorities.
      
      Issue: ${title}
      Description: ${description}
      Community Feedback:
      ${comments.join('\n- ')}
      
      Provide only the 3 bullet points.`,
      config: {
        systemInstruction: "You are a professional civic policy advisor. Be concise and authoritative.",
      }
    });

    return response.text || "Summary unavailable.";
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Failed to generate summary.";
  }
}
