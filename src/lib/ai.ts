/*
 * Install the Generative AI SDK
 *
 * $ npm install @google/generative-ai
 */

import {
  GoogleGenerativeAI,
} from "@google/generative-ai";

const API_KEY = "AIzaSyDDXlQpW8oRdKN7CDHqCWrwQNhlFCklCs8";

const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

export async function AIChat(userPrompt: any) {
  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    const response = await chatSession.sendMessage(
      `Summarize the following text by extracting the main ideas and key points:\n\n"${userPrompt}"\n\nProvide the summary in a clear and concise paragraph format.`
    );
    return response.response.text();
  } catch (error) {
    console.error("Error during AI chat:", error);
    return "An error occurred while communicating with the AI.";
  }
}
