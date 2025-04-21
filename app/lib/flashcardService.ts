import { Flashcard, FlashcardGenerationRequest } from "@/app/types";
import { z } from "zod";
import { ApiService } from "./apiService";
import { AppError, Result, safeAsync } from "./errorUtils";

// Validation schema for flashcard
export const flashcardSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  favorited: z.boolean().optional().default(false),
});

export type FlashcardInput = z.infer<typeof flashcardSchema>;

// Extended service with flashcard-specific methods
class FlashcardService extends ApiService<Flashcard> {
  constructor() {
    super("api/flashcards");
  }

  // Generate flashcards from notes using AI
  async generateFromNotes(
    request: FlashcardGenerationRequest,
    token: string,
  ): Promise<Result<Flashcard[]>> {
    this.setAuthToken(token);

    return safeAsync(async () => {
      const response = await fetch("/api/ai/flashcards", {
        method: "POST",
        headers: this.options.headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new AppError(
          `Failed to generate flashcards: ${response.status} ${errorData?.error || ""}`,
          response.status,
        );
      }

      const data = await response.json();
      return data.data.flashcards;
    });
  }

  // Override create to validate flashcard data
  async create(data: Omit<Flashcard, "id">): Promise<Result<string>> {
    const validationResult = flashcardSchema.safeParse(data);

    if (!validationResult.success) {
      return {
        success: false,
        error: {
          message: `Validation failed: ${validationResult.error.message}`,
          statusCode: 400,
          errorCode: "VALIDATION_ERROR",
        },
      };
    }

    return super.create(validationResult.data);
  }

  // Override update to validate flashcard data
  async update(id: string, updates: Partial<Flashcard>): Promise<Result<void>> {
    if (Object.keys(updates).length === 0) {
      return {
        success: false,
        error: {
          message: "No updates provided",
          statusCode: 400,
        },
      };
    }

    const validationResult = flashcardSchema.partial().safeParse(updates);

    if (!validationResult.success) {
      return {
        success: false,
        error: {
          message: `Validation failed: ${validationResult.error.message}`,
          statusCode: 400,
          errorCode: "VALIDATION_ERROR",
        },
      };
    }

    return super.update(id, validationResult.data);
  }
}

// Export singleton instance
export const flashcardService = new FlashcardService();
