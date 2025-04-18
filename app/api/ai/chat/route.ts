import { GoogleGenerativeAI } from "@google/generative-ai";
import { StreamingTextResponse } from "ai";

// Initialize the Google Generative AI SDK
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: Request) {
  try {
    // Verify authentication
    const authToken = req.headers.get("Authorization")?.split("Bearer ")[1];
    if (!authToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse the request body
    const { messages } = await req.json();

    // Get the user's question from the last message
    const lastMessage = messages[messages.length - 1];
    const prompt = lastMessage.content;

    // Prepare system instructions for the AI
    const systemInstruction = `
      You are an AI study assistant for students. You help explain concepts, answer questions,
      and provide educational guidance in a clear and concise manner. Always provide accurate 
      information and when you don't know something, admit it instead of making up answers.
      You can use markdown formatting in your responses to make them more readable.
    `;

    // Create conversation history
    const conversationHistory = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Generate content
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-001",
    });

    const generationConfig = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    };

    // Create a chat session
    const chat = model.startChat({
      history: conversationHistory,
      generationConfig,
    });

    // Send the message and get the response
    const result = await chat.sendMessageStream(
      systemInstruction + "\n\n" + prompt,
    );

    // Convert the AsyncGenerator to a ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    // Return the stream
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error("Error in AI chat endpoint:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
