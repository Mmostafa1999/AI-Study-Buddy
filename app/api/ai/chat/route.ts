import { GoogleGenerativeAI } from "@google/generative-ai";
import { StreamingTextResponse } from "ai";
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";
import { NextRequest } from "next/server";

// Set max duration for streaming responses
export const maxDuration = 30;

// Initialize the Google Generative AI SDK
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// Check for environment variables with different possible prefixes
const getEnvVar = (name: string) => {
  const possiblePrefixes = ['STORAGE_', 'KV_', ''];
  for (const prefix of possiblePrefixes) {
    const value = process.env[`${prefix}${name}`];
    if (value) return value;
  }
  return undefined;
};

const KV_URL = getEnvVar('KV_URL') || process.env.UPSTASH_REDIS_REST_URL;
const KV_REST_API_TOKEN = getEnvVar('KV_REST_API_TOKEN') || process.env.UPSTASH_REDIS_REST_TOKEN;
const KV_REST_API_URL = getEnvVar('KV_REST_API_URL') || process.env.UPSTASH_REDIS_REST_URL;

// Log environment variables (omitting sensitive parts)
const envDebug = {
  KV_URL_PREFIX: KV_URL ? KV_URL.slice(0, 15) + "..." : "undefined",
  KV_REST_API_URL: KV_REST_API_URL || "undefined",
  KV_REST_API_TOKEN_EXISTS: !!KV_REST_API_TOKEN,
  NODE_ENV: process.env.NODE_ENV || "unknown",
  UPSTASH_EXISTS: !!process.env.UPSTASH_REDIS_REST_URL
};


// Create Rate limit - 5 requests per 30 seconds
let ratelimit: Ratelimit | null = null;

// Initialize ratelimit only if KV environment variables are available
try {
  if (!KV_URL || !KV_REST_API_TOKEN) {
    console.warn("Rate limiting disabled: Missing KV environment variables");
  } else {
    // Force Upstash connection if KV isn't working
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const { Redis } = require('@upstash/redis');
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      
      ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(5, "30s"),
        analytics: true,
      });
    } else {
      // Default KV approach
      ratelimit = new Ratelimit({
        redis: kv,
        limiter: Ratelimit.fixedWindow(5, "30s"),
        analytics: true,
      });
    }
    
  }
} catch (error) {
  console.error("Failed to initialize rate limiting:", error);
}

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting only if ratelimit is configured
    if (ratelimit) {
      try {
        // Get client IP for rate limiting
        const ip = req.ip ?? "anonymous";
        
        const { success, remaining } = await ratelimit.limit(ip);

        // Return 429 if rate limit exceeded
        if (!success) {
          return new Response(
            JSON.stringify({ 
              error: "Too many requests. Please try again later.",
              remaining
            }), 
            { 
              status: 429, 
              headers: { "Content-Type": "application/json" } 
            }
          );
        }
      } catch (error) {
        console.error("Rate limiting failed:", error);
        // Continue without rate limiting if it fails
      }
    } else {
    }

    // Verify authentication
    const authToken = req.headers.get("Authorization")?.split("Bearer ")[1];
    if (!authToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse the request body
    const body = await req.json();
    const { messages, fileContext } = body;

    // Get the user's question from the last message
    const lastMessage = messages[messages.length - 1];
    const prompt = lastMessage.content;

    // Prepare system instructions for the AI
    let systemInstruction = `
      You are an AI study assistant for students. You help explain concepts, answer questions,
      and provide educational guidance in a clear and concise manner. Always provide accurate 
      information and when you don't know something, admit it instead of making up answers.
      You can use markdown formatting in your responses to make them more readable.
    `;

    // Add document context if provided
    if (fileContext && fileContext.trim() !== '') {
      systemInstruction += `\n\nThe user has uploaded a document. Here is the content of that document for reference:\n\n${fileContext}\n\nWhen the user asks questions, they may be referring to content in this document.`;
    }

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
