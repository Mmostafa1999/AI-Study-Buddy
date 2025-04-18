import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Google Generative AI SDK
const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",
);

// Get the Gemini 1.5 Flash model
export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
});

export const generateChatResponse = async (prompt: string): Promise<string> => {
  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating chat response:", error);
    return "Sorry, I encountered an error. Please try again.";
  }
};

export const generateFlashcards = async (
  notes: string,
): Promise<Array<{ question: string; answer: string }>> => {
  try {
    const systemPrompt = `
      You are a helpful AI that creates study flashcards from student notes. 
      Generate a JSON array of flashcard objects with "question" and "answer" properties.
      Create concise, clear questions and comprehensive answers.
      Make sure the output is valid JSON that can be parsed with JSON.parse().
      Generate between 5-10 flashcards depending on the content provided.
      Format: [{"question": "...", "answer": "..."}, ...]
    `;

    const prompt = `${systemPrompt}\n\nNotes:\n${notes}`;

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/\[\s*\{.+\}\s*\]/s);
    if (!jsonMatch) {
      throw new Error("Could not extract valid JSON from the response");
    }

    const parsedFlashcards = JSON.parse(jsonMatch[0]);
    return parsedFlashcards;
  } catch (error) {
    console.error("Error generating flashcards:", error);
    throw new Error("Failed to generate flashcards. Please try again.");
  }
};

export const generateQuiz = async (
  flashcards: Array<{ question: string; answer: string }>,
): Promise<
  Array<{ question: string; options: string[]; correctAnswer: string }>
> => {
  try {
    const systemPrompt = `
      You are a helpful AI that creates multiple-choice quizzes from flashcards.
      For each flashcard, create a quiz question with 4 options where one is the correct answer.
      Generate a JSON array of quiz objects with "question", "options" (array of 4 strings), and "correctAnswer" properties.
      Make sure the output is valid JSON that can be parsed with JSON.parse().
      Format: [{"question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": "..."}, ...]
    `;

    const prompt = `${systemPrompt}\n\nFlashcards:\n${JSON.stringify(flashcards)}`;

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/\[\s*\{.+\}\s*\]/s);
    if (!jsonMatch) {
      throw new Error("Could not extract valid JSON from the response");
    }

    const parsedQuiz = JSON.parse(jsonMatch[0]);
    return parsedQuiz;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz. Please try again.");
  }
};

export const generateStudyPlan = async (
  subjects: string[],
  examDate: string,
  studyHoursPerDay: number,
): Promise<
  Array<{
    day: string;
    tasks: Array<{ subject: string; duration: string; activity: string }>;
  }>
> => {
  try {
    const systemPrompt = `
      You are a helpful AI that creates personalized study plans.
      Generate a study plan from now until the exam date for the given subjects.
      Create a JSON array of daily plan objects with "day" (string date in YYYY-MM-DD format) and "tasks" properties.
      Each task should have "subject", "duration" (e.g. "30 minutes"), and "activity" properties.
      Consider about ${studyHoursPerDay} hours of study time per day.
      Make the plan realistic and achievable, with variety in activities.
      Make sure the output is valid JSON that can be parsed with JSON.parse().
      Format: [{"day": "2023-10-15", "tasks": [{"subject": "...", "duration": "...", "activity": "..."}]}, ...]
    `;

    const prompt = `${systemPrompt}\n\nSubjects: ${subjects.join(", ")}\nExam Date: ${examDate}\nStudy Hours Per Day: ${studyHoursPerDay}`;

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/\[\s*\{.+\}\s*\]/s);
    if (!jsonMatch) {
      throw new Error("Could not extract valid JSON from the response");
    }

    const parsedPlan = JSON.parse(jsonMatch[0]);
    return parsedPlan;
  } catch (error) {
    console.error("Error generating study plan:", error);
    throw new Error("Failed to generate study plan. Please try again.");
  }
};
