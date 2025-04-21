import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  Day,
  Flashcard,
  FlashcardGenerationRequest,
  QuizGenerationRequest,
  QuizQuestion,
  StudyPlanGenerationRequest,
} from "../types";
import { AppError, Result, safeAsync } from "./errorUtils";

// Initialize the Google Generative AI SDK
const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",
);

// Configuration for the AI model
const MODEL_CONFIG = {
  standard: {
    model: "gemini-2.0-flash-001",
    temperature: 0.2,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
  },
  creative: {
    model: "gemini-2.0-flash-001",
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 2048,
  },
};

// Get the Gemini model with specified configuration
export const getGeminiModel = (
  configType: keyof typeof MODEL_CONFIG = "standard",
) => {
  return genAI.getGenerativeModel({
    model: MODEL_CONFIG[configType].model,
    generationConfig: {
      temperature: MODEL_CONFIG[configType].temperature,
      topK: MODEL_CONFIG[configType].topK,
      topP: MODEL_CONFIG[configType].topP,
      maxOutputTokens: MODEL_CONFIG[configType].maxOutputTokens,
    },
  });
};

// Extract JSON from AI response
const extractJsonFromResponse = <T>(text: string): T => {
  // First try to find JSON array between square brackets
  const jsonArrayMatch = text.match(/\[\s*\{[\s\S]+\}\s*\]/);
  if (jsonArrayMatch) {
    try {
      return JSON.parse(jsonArrayMatch[0]);
    } catch (error) {
      console.error("Error parsing JSON array:", error);
      // Continue to other attempts
    }
  }

  // Look for any JSON object
  const jsonObjectMatch = text.match(/\{\s*"[\s\S]+"\s*:\s*[\s\S]+\}/);
  if (jsonObjectMatch) {
    try {
      return JSON.parse(jsonObjectMatch[0]) as T;
    } catch (error) {
      console.error("Error parsing JSON object:", error);
      // Continue to other attempts
    }
  }

  // Try to extract from markdown code blocks
  const markdownMatch = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (markdownMatch) {
    try {
      return JSON.parse(markdownMatch[1]) as T;
    } catch (error) {
      console.error("Error parsing JSON from markdown:", error);
      // Continue to other attempts
    }
  }

  // Final attempt - sanitize the whole text and try parsing
  try {
    // Remove all text before the first [ or { and after the last ] or }
    const cleanedText = text.replace(/^[^[{]*/, "").replace(/[^\]}]*$/, "");

    if (cleanedText) {
      return JSON.parse(cleanedText) as T;
    }
  } catch (error) {
    console.error("Error parsing cleaned JSON:", error);
  }

  // If all attempts fail, throw a detailed error
  console.error("Failed to extract JSON from:", text);
  throw new AppError(
    "Could not extract valid JSON from the response",
    422,
    "INVALID_AI_RESPONSE",
  );
};

// Generate content with error handling
const generateContent = async <T>(
  prompt: string,
  configType: keyof typeof MODEL_CONFIG = "standard",
): Promise<T> => {
  // Validate API key
  if (
    !process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_API_KEY.trim() === ""
  ) {
    throw new AppError(
      "Google API key is missing or empty. Please check your environment variables.",
      500,
      "MISSING_API_KEY",
    );
  }

  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add a small delay before retries
      if (attempt > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }

      const model = getGeminiModel(configType);

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });

      const response = await result.response;
      const text = response.text();

      if (!text || text.trim() === "") {
        throw new AppError(
          "Empty response received from the AI model",
          422,
          "EMPTY_AI_RESPONSE",
        );
      }

      return extractJsonFromResponse<T>(text);
    } catch (error) {
      console.error(
        `AI generation error (attempt ${attempt + 1}/${maxRetries + 1}):`,
        error,
      );

      // On final attempt, return a properly formatted error
      if (attempt === maxRetries) {
        if (error instanceof AppError) {
          throw error;
        }

        const errorMessage =
          error instanceof Error ? error.message : String(error);

        if (errorMessage.includes("API key")) {
          throw new AppError(
            "Invalid or missing API key. Please check your configuration.",
            401,
            "INVALID_API_KEY",
          );
        } else if (errorMessage.includes("quota")) {
          throw new AppError(
            "API quota exceeded. Please try again later.",
            429,
            "QUOTA_EXCEEDED",
          );
        } else if (errorMessage.includes("JSON")) {
          throw new AppError(
            "Failed to parse the AI response. Please try again with different input.",
            422,
            "INVALID_RESPONSE_FORMAT",
          );
        } else {
          throw new AppError(
            `Failed to generate content: ${errorMessage}`,
            500,
            "AI_GENERATION_ERROR",
          );
        }
      }

      // Continue to next retry attempt
    }
  }

  // This should never execute due to the throw in the final attempt above
  throw new AppError(
    "Failed to generate content after multiple attempts",
    500,
    "UNEXPECTED_ERROR",
  );
};

export const generateChatResponse = async (
  prompt: string,
): Promise<Result<string>> => {
  return safeAsync(async () => {
    const model = getGeminiModel();

    if (
      !process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_API_KEY.trim() === ""
    ) {
      throw new AppError(
        "Google API key is missing or empty. Please check your environment variables.",
        500,
        "MISSING_API_KEY",
      );
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  });
};

export const generateFlashcards = async (
  params: FlashcardGenerationRequest,
): Promise<Result<Flashcard[]>> => {
  return safeAsync(async () => {
    const { notes, subject, language = "English", count = 10 } = params;

    if (!notes || notes.trim() === "") {
      throw new AppError("Notes cannot be empty", 400, "MISSING_NOTES");
    }

    if (!subject || subject.trim() === "") {
      throw new AppError("Subject cannot be empty", 400, "MISSING_SUBJECT");
    }

    const systemPrompt = `
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

    const prompt = `${systemPrompt}\n\nNotes for ${subject}:\n${notes}`;

    const flashcards =
      await generateContent<Array<Omit<Flashcard, "id">>>(prompt);

    // Add IDs to the flashcards
    return flashcards.map((card, index) => ({
      ...card,
      id: `gen-${Date.now()}-${index}`,
    }));
  });
};

export const generateQuiz = async (
  params: QuizGenerationRequest,
): Promise<Result<QuizQuestion[]>> => {
  return safeAsync(async () => {
    const { flashcards, questionCount = flashcards.length } = params;

    const systemPrompt = `
      You are an AI that creates multiple-choice quizzes from flashcards.
      For each flashcard, create a quiz question with 4 options where one is the correct answer.
      Generate a JSON array of quiz objects with "question", "options" (array of 4 strings), and "correctAnswer" properties.
      Limit the number of questions to ${Math.min(questionCount, flashcards.length)}.
      Make sure the output is valid JSON that can be parsed with JSON.parse().
      Format: [{"question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": "..."}, ...]
    `;

    const prompt = `${systemPrompt}\n\nFlashcards:\n${JSON.stringify(flashcards)}`;

    const quizQuestions = await generateContent<
      Array<Omit<QuizQuestion, "id">>
    >(prompt, "creative");

    // Add IDs to the quiz questions
    return quizQuestions.map((question, index) => ({
      ...question,
      id: `gen-${Date.now()}-${index}`,
    }));
  });
};

export const generateStudyPlan = async (
  params: StudyPlanGenerationRequest,
): Promise<Result<Day[]>> => {
  return safeAsync(async () => {
    const { subjects, examDate, hoursPerDay } = params;

    const systemPrompt = `
      You are an AI that creates personalized study plans.
      Generate a study plan from now until the exam date (${examDate}) for the given subjects.
      Create a JSON array of daily plan objects with "date" (string date in YYYY-MM-DD format) and "tasks" properties.
      Each task should have "subject", "duration" (in minutes as a number), "activity", and "priority" (high, medium, or low) properties.
      Consider about ${hoursPerDay} hours of study time per day.
      Make the plan realistic and achievable, with variety in activities.
      Make sure the output is valid JSON that can be parsed with JSON.parse().
      Format: [{"date": "2023-10-15", "tasks": [{"subject": "...", "duration": 30, "activity": "...", "priority": "high"}]}, ...]
    `;

    const subjectsList = subjects
      .map(
        s =>
          `${s.name} (Difficulty: ${s.difficulty}, Importance: ${s.importance})`,
      )
      .join("\n- ");
    const prompt = `${systemPrompt}\n\nSubjects:\n- ${subjectsList}\nExam Date: ${examDate}\nStudy Hours Per Day: ${hoursPerDay}`;

    return await generateContent<Day[]>(prompt);
  });
};
