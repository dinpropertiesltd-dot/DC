
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const geminiService = {
  // 1. Text Chat
  async sendMessage(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = []) {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: "You are Aether, a helpful and sophisticated AI assistant. You provide concise, accurate, and professional information.",
      }
    });
    return response.text;
  },

  // 2. Image Generation
  async generateImage(prompt: string, aspectRatio: string = "1:1") {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned");
  },

  // 3. Video Generation
  async generateVideo(prompt: string) {
    const ai = getAI();
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    // Polling is handled by the component for better UI updates
    return operation;
  },

  async getOperationStatus(operationId: any) {
    const ai = getAI();
    return await ai.operations.getVideosOperation({ operation: operationId });
  },

  // 4. Text to Speech
  async generateSpeech(text: string, voice: string = 'Kore') {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say naturally: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio returned");
    return base64Audio;
  }
};
