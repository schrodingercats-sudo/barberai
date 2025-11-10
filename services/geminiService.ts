
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

export const suggestHairstyles = async (facialFeatures: string): Promise<{ styleName: string; description: string; }[]> => {
    const model = 'gemini-2.5-pro';
    const prompt = `You are an expert barber and hairstylist. Based on the following facial features: "${facialFeatures}", suggest four varied and distinct new hairstyles. For each hairstyle, provide a short, catchy style name (e.g., "Classic Taper Fade", "Textured Crop Top") and a detailed description that can be used to generate it from multiple angles.`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 },
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    hairstyles: {
                        type: Type.ARRAY,
                        description: 'A list of 4 hairstyle suggestions.',
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                styleName: {
                                    type: Type.STRING,
                                    description: 'A short, catchy name for the hairstyle.',
                                },

                                description: {
                                    type: Type.STRING,
                                    description: 'A detailed description of the hairstyle for image generation.',
                                },
                            },
                            required: ["styleName", "description"]
                        }
                    }
                },
                required: ["hairstyles"]
            }
        }
    });
    
    const jsonResponse = JSON.parse(response.text);
    if (!jsonResponse.hairstyles || jsonResponse.hairstyles.length < 4) {
        throw new Error("AI failed to suggest enough hairstyles.");
    }

    return jsonResponse.hairstyles.slice(0, 4);
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
