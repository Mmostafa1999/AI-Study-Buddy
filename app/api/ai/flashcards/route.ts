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
    const {
      notes,
      subject,
      language = "English",
      count = 10,
    } = await req.json();

    if (!notes || notes.trim() === "") {
      return NextResponse.json(
        { error: "Notes are required" },
        { status: 400 },
      );
    }

    if (!subject || subject.trim() === "") {
      return NextResponse.json(
        { error: "Subject is required" },
        { status: 400 },
      );
    }

    // Limit notes length to prevent abuse
    const MAX_NOTES_LENGTH = 15000; // About 5 pages of text
    const trimmedNotes = notes.slice(0, MAX_NOTES_LENGTH);
    if (notes.length > MAX_NOTES_LENGTH) {
      console.log(
        `Notes truncated from ${notes.length} to ${MAX_NOTES_LENGTH} characters`,
      );
    }

    // Prepare system instructions for the AI
    const systemInstruction = `
      You are an AI assistant that creates study flashcards from student notes about ${subject}.
      Generate ${count} flashcards in the following JSON format:
      [
        {
          "question": "Concise question about a key concept",
          "answer": "Clear, comprehensive answer"
        }
      ]
      Focus on the most important concepts in the notes related to ${subject}.
      Create questions that test understanding rather than just memorization.
      Include a mix of definition questions, concept explanations, and application problems.
      Generate all content in ${language} language.
      Ensure the generated JSON is valid and can be parsed with JSON.parse().
      The output should ONLY contain the JSON array with no additional text or explanation.
    `;

    // Generate content
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-001",
    });

    const generationConfig = {
      temperature: 0.2, // Lower temperature for more consistent, predictable output
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
    };

    const prompt = `${systemInstruction}\n\nNotes for ${subject}:\n${trimmedNotes}`;

    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
      });

      const response = await result.response;
      const text = response.text();

      // Extract JSON from the response
      const jsonMatch = text.match(/\[\s*\{[\s\S]+\}\s*\]/);
      if (!jsonMatch) {
        console.error("Failed to extract JSON from AI response:", text);
        return NextResponse.json(
          {
            error:
              "Failed to generate valid flashcards. Please try again or adjust your notes.",
          },
          { status: 500 },
        );
      }

      try {
        const flashcards = JSON.parse(jsonMatch[0]);
        // Verify the structure of each flashcard
        const validFlashcards = flashcards.filter(
          (card: any) =>
            card &&
            typeof card === "object" &&
            typeof card.question === "string" &&
            typeof card.answer === "string",
        );

        if (validFlashcards.length === 0) {
          return NextResponse.json(
            {
              error:
                "No valid flashcards were generated. Please try again with different notes.",
            },
            { status: 500 },
          );
        }

        return NextResponse.json({ flashcards: validFlashcards });
      } catch (parseError) {
        console.error("Error parsing flashcards JSON:", parseError);
        return NextResponse.json(
          {
            error: "Error parsing the generated flashcards. Please try again.",
          },
          { status: 500 },
        );
      }
    } catch (aiError) {
      console.error("AI generation error:", aiError);
      return NextResponse.json(
        {
          error:
            "Failed to generate flashcards. Please try again with simpler notes or a different subject.",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in flashcards endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
