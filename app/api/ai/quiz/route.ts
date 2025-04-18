import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// Initialize the Google Generative AI SDK
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const authToken = req.headers.get("Authorization")?.split("Bearer ")[1];
    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    const { flashcards } = await req.json();

    if (!flashcards || !Array.isArray(flashcards) || flashcards.length === 0) {
      return NextResponse.json(
        { error: "Valid flashcards are required" },
        { status: 400 },
      );
    }

    // Prepare system instructions for the AI
    const systemInstruction = `
      You are an AI assistant that creates multiple-choice quizzes from flashcards.
      For each flashcard, create a quiz question with 4 options where one is the correct answer.
      Generate a quiz in the following JSON format:
      [
        {
          "question": "The quiz question based on the flashcard",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "The correct option (must be exactly the same text as one of the options)",
          "explanation": "Brief explanation of why the answer is correct"
        }
      ]
      Ensure the generated JSON is valid and can be parsed with JSON.parse().
      The output should ONLY contain the JSON array with no additional text or explanation.
      Make sure the options are plausible but only one is correct.
    `;

    // Generate content
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });

    const generationConfig = {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    };

    const prompt = `${systemInstruction}\n\nFlashcards:\n${JSON.stringify(flashcards)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/\[\s*\{[\s\S]+\}\s*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        {
          error: "Failed to generate valid quiz",
        },
        { status: 500 },
      );
    }

    try {
      const quiz = JSON.parse(jsonMatch[0]);

      // Validate quiz structure
      const isValidQuiz = quiz.every(
        (item: any) =>
          typeof item.question === "string" &&
          Array.isArray(item.options) &&
          item.options.length === 4 &&
          typeof item.correctAnswer === "string" &&
          item.options.includes(item.correctAnswer),
      );

      if (!isValidQuiz) {
        return NextResponse.json(
          {
            error: "Generated quiz has invalid structure",
          },
          { status: 500 },
        );
      }

      return NextResponse.json({ quiz });
    } catch (parseError) {
      console.error("Error parsing quiz JSON:", parseError);
      return NextResponse.json(
        {
          error: "Error parsing the generated quiz",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in quiz endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
