import {
  errorResponse,
  sanitizeInput,
  successResponse,
  validateRequestBody,
  validateToken,
} from "@/app/lib/apiService";
import { generateFlashcards } from "@/app/lib/gemini";
import { FlashcardGenerationRequest } from "@/app/types";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Validate authentication token
    const tokenValidation = validateToken(req);
    if (!tokenValidation.isValid) {
      return errorResponse(tokenValidation.message || "Unauthorized", 401);
    }

    // Parse and validate request body
    const requestBody = (await req.json()) as FlashcardGenerationRequest;
    const validation = validateRequestBody(requestBody, ["notes", "subject"]);

    if (!validation.isValid) {
      return errorResponse(
        `Missing required fields: ${validation.missingFields.join(", ")}`,
      );
    }

    // Sanitize input
    const sanitizedNotes = sanitizeInput(requestBody.notes);

  

    // Generate flashcards
    const flashcardsResult = await generateFlashcards({
      ...requestBody,
      notes: sanitizedNotes,
    });

    // Check if generation was successful
    if (!flashcardsResult.success) {
      throw new Error(
        flashcardsResult.error.message || "Failed to generate flashcards",
      );
    }

    const flashcards = flashcardsResult.data;

    // Ensure each flashcard has required fields
    const validFlashcards = flashcards.filter(
      card => card && typeof card === "object" && card.question && card.answer,
    );
    

    if (validFlashcards.length === 0) {
      throw new Error("No valid flashcards could be generated");
    }

    // Create response with the expected structure
    const responseData = { flashcards: validFlashcards };

    // Return the generated flashcards
    return successResponse(responseData);
  } catch (error) {
    console.error("Error in flashcards endpoint:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    return errorResponse(errorMessage, 500);
  }
}
