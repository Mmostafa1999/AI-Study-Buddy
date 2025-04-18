import { auth, db, serverAuth } from "@/app/lib/firebase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { format } from "date-fns";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

// Mark the route as dynamic to prevent static generation errors
export const dynamic = "force-dynamic";

// Initialize the Google Generative AI SDK
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: No token provided" },
        { status: 401 },
      );
    }

    const token = authHeader.split("Bearer ")[1];
    let uid;

    try {
      // Try serverAuth first, fall back to regular auth if needed
      try {
        const decodedToken = await serverAuth.verifyIdToken(token);
        uid = decodedToken.uid;
      } catch (serverAuthError) {
        console.log("Server auth failed, trying client auth:", serverAuthError);

        // Fallback to client-side auth if available
        if (auth.currentUser) {
          uid = auth.currentUser.uid;
        } else {
          throw new Error("No authenticated user found");
        }
      }

      if (!uid) {
        throw new Error("Failed to verify token or get user ID");
      }
    } catch (error) {
      console.error("Error verifying token:", error);
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 },
      );
    }

    // Get today's date in YYYY-MM-DD format
    const today = format(new Date(), "yyyy-MM-dd");

    // Fetch the user's active study plans
    const studyPlansQuery = query(
      collection(db, "studyPlans"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc"),
    );

    const studyPlansSnapshot = await getDocs(studyPlansQuery);

    if (studyPlansSnapshot.empty) {
      return NextResponse.json(
        { error: "No study plans found" },
        { status: 404 },
      );
    }

    // Find a study plan that has tasks for today
    let todaysTasks = [];
    let studyPlanData = null;

    for (const doc of studyPlansSnapshot.docs) {
      const plan = doc.data();

      // Find if this plan has tasks for today
      const dayPlan = plan.studyPlan?.days?.find(
        (day: any) => day.date === today,
      );

      if (dayPlan && dayPlan.tasks && dayPlan.tasks.length > 0) {
        todaysTasks = dayPlan.tasks;
        studyPlanData = plan;
        break;
      }
    }

    if (!todaysTasks.length) {
      return NextResponse.json(
        { error: "No tasks scheduled for today" },
        { status: 404 },
      );
    }

    // Extract subject information from today's tasks
    const subjects = todaysTasks.map((task: any) => task.subject);
    const uniqueSubjects = Array.from(new Set(subjects));

    // Get relevant flashcards for these subjects
    const flashcardsQuery = query(
      collection(db, "flashcards"),
      where("userId", "==", uid),
      where("subject", "in", uniqueSubjects),
    );

    const flashcardsSnapshot = await getDocs(flashcardsQuery);

    const flashcards = flashcardsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        question: data.question,
        answer: data.answer,
        subject: data.subject,
      };
    });

    // If no flashcards found, generate questions based on the study tasks
    if (flashcards.length === 0) {
      // Create a system prompt for generating a quiz directly from tasks
      const tasksInfo = todaysTasks
        .map(
          (task: any) => `Subject: ${task.subject}, Activity: ${task.activity}`,
        )
        .join("\n");

      const systemInstruction = `
        You are an AI assistant that creates multiple-choice quizzes based on a student's study plan.
        Today the student is studying the following subjects and activities:
        ${tasksInfo}
        
        Based on these study topics, create a quiz with 5 challenging multiple-choice questions.
        For each question, create 4 options where only one is the correct answer.
        
        Generate a quiz in the following JSON format:
        [
          {
            "question": "A challenging question about the topic",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "The correct option (must be exactly the same text as one of the options)",
            "explanation": "Brief explanation of why the answer is correct",
            "subject": "The subject this question relates to"
          }
        ]
        
        Ensure the generated JSON is valid and can be parsed with JSON.parse().
        The output should ONLY contain the JSON array with no additional text or explanation.
        Make the questions challenging but fair, covering the key concepts from the study plan.
      `;

      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-001",
      });

      const generationConfig = {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      };

      const result = await model.generateContent(systemInstruction);
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

        return NextResponse.json({ quiz, subjectsForToday: uniqueSubjects });
      } catch (parseError) {
        console.error("Error parsing quiz JSON:", parseError);
        return NextResponse.json(
          {
            error: "Error parsing the generated quiz",
          },
          { status: 500 },
        );
      }
    } else {
      // Generate quiz from flashcards
      const systemInstruction = `
        You are an AI assistant that creates multiple-choice quizzes from flashcards.
        For each flashcard, create a quiz question with 4 options where one is the correct answer.
        Generate a quiz with at most 10 questions in the following JSON format:
        [
          {
            "question": "The quiz question based on the flashcard",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "The correct option (must be exactly the same text as one of the options)",
            "explanation": "Brief explanation of why the answer is correct",
            "subject": "The subject this question relates to"
          }
        ]
        Ensure the generated JSON is valid and can be parsed with JSON.parse().
        The output should ONLY contain the JSON array with no additional text or explanation.
        Make sure the options are plausible but only one is correct.
      `;

      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-001",
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

        return NextResponse.json({ quiz, subjectsForToday: uniqueSubjects });
      } catch (parseError) {
        console.error("Error parsing quiz JSON:", parseError);
        return NextResponse.json(
          {
            error: "Error parsing the generated quiz",
          },
          { status: 500 },
        );
      }
    }
  } catch (error) {
    console.error("Error in daily quiz endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
