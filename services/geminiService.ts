
import { GoogleGenAI } from "@google/genai";

export const generateCaption = async (imageDataBase64: string, style: string = "modern & direkt"): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageDataBase64.split(',')[1] || imageDataBase64,
            },
          },
          {
            text: `Generate a short, heartwarming 5-word caption for this photo that would look great in a physical photo book. 
            Tone/Style: ${style}. 
            Use German if the image looks like it's from Germany, otherwise English. 
            Return only the caption text.`
          }
        ]
      }
    });
    return response.text?.trim() || "A moment to remember";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Beautiful memories";
  }
};

export const generateTitleSuggestions = async (recipient: string, recipientName: string, senderName: string): Promise<string[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Generate 3 short, creative, and heartwarming titles for a photo book in German. 
    Recipient type: ${recipient}
    Recipient name: ${recipientName}
    Sender name: ${senderName}
    The titles should be emotional and modern. Return exactly 3 titles separated by a semicolon. Do not include numbers or bullet points.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    const text = response.text || "";
    const suggestions = text.split(';').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(s => s.length > 0);
    
    // Fallback if AI fails or format is weird
    if (suggestions.length < 3) {
      return [
        `Abenteuer mit ${recipientName}`,
        `Unsere schönsten Momente`,
        `Für dich, ${recipientName}`
      ];
    }
    return suggestions.slice(0, 3);
  } catch (error) {
    console.error("Gemini Title Error:", error);
    return ["Unsere Geschichte", "Momente für die Ewigkeit", `Für ${recipientName}`];
  }
};
