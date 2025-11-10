
import { GoogleGenAI, Type, Modality } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType
    },
  };
};

export const analyzeFacialFeatures = async (imageBase64: string): Promise<string> => {
    const model = 'gemini-2.5-flash';
    const imagePart = fileToGenerativePart(imageBase64, 'image/jpeg');
    const prompt = "Analyze the person in this photo. Describe their facial structure, skin tone, current hair color, and estimated age. Be concise and focus on features relevant for choosing a new hairstyle.";
    
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [imagePart, { text: prompt }] },
    });
    return response.text;
};

export const suggestHairstyle = async (facialFeatures: string): Promise<string> => {
    const model = 'gemini-2.5-pro';
    const prompt = `You are an expert barber and hairstylist. Based on the following facial features: "${facialFeatures}", suggest one cohesive and stylish new hairstyle. Provide a single, detailed description of this hairstyle that can be used to generate it from multiple angles (front, back, sides).`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 },
        }
    });
    
    return response.text.trim();
};

export const describeGeneratedHairstyle = async (imageBase64: string): Promise<string> => {
    const model = 'gemini-2.5-flash';
    const imagePart = fileToGenerativePart(imageBase64, 'image/jpeg');
    const prompt = "Describe only the hairstyle of the person in this image. Be extremely detailed about the style, cut, length on top, fade on the sides, texture, and how it's styled. This description will be used to re-create the exact same hairstyle from different angles.";
    
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [imagePart, { text: prompt }] },
    });
    return response.text;
};


export const generateHairstyleImage = async (prompt: string, imageBase64: string): Promise<string> => {
    const model = 'gemini-2.5-flash-image';
    
    const imagePart = fileToGenerativePart(imageBase64, 'image/jpeg');

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          imagePart,
          { text: prompt },
        ],
      },
      config: {
          responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
      }
    }

    throw new Error("Image generation failed. No images were returned.");
};
