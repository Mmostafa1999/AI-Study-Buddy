import { auth, serverAuth } from "@/app/lib/firebase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { addDays, differenceInDays, format } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

// Initialize the Google AI model with API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
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
        // Fallback to client-side auth
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
        { error: "Unauthorized: Invalid token or no authenticated user" },
        { status: 401 },
      );
    }

    // Get request body
    const body = await request.json();
    const { subjects, examDate, hoursPerDay } = body;

    console.log("Request body:", { subjects, examDate, hoursPerDay });

    // Validate inputs
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return NextResponse.json(
        { error: "Bad Request: Subjects are required" },
        { status: 400 },
      );
    }

    if (!examDate) {
      return NextResponse.json(
        { error: "Bad Request: Exam date is required" },
        { status: 400 },
      );
    }

    if (
      !hoursPerDay ||
      isNaN(hoursPerDay) ||
      hoursPerDay < 1 ||
      hoursPerDay > 12
    ) {
      return NextResponse.json(
        { error: "Bad Request: Hours per day must be between 1 and 12" },
        { status: 400 },
      );
    }

    // Calculate days until exam
    const examDateObj = new Date(examDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time component for accurate day comparison

    // Format dates consistently
    const examDateFormatted = format(examDateObj, "yyyy-MM-dd");
    const todayFormatted = format(today, "yyyy-MM-dd");

    console.log("Today:", todayFormatted, "Exam date:", examDateFormatted);

    const daysUntilExam = differenceInDays(examDateObj, today);

    console.log("Days until exam:", daysUntilExam);

    // Allow same-day exams (daysUntilExam = 0)
    if (daysUntilExam < 0) {
      return NextResponse.json(
        { error: "Bad Request: Exam date must not be in the past" },
        { status: 400 },
      );
    }

    // Format subjects for AI prompt
    const subjectsText = subjects
      .map(
        (subject: any) =>
          `- ${subject.name} (Difficulty: ${subject.difficulty}, Importance: ${subject.importance})`,
      )
      .join("\n");

    // Create AI prompt
    const prompt = `
Generate a detailed study plan for a student preparing for exams. Here are the details:

Subjects:
${subjectsText}

Days until exam: ${Math.max(1, daysUntilExam)}
Hours available per day: ${hoursPerDay}

Please create a structured study plan with the following characteristics:
1. Organize by days starting from today (${todayFormatted}) up to the exam date (${examDateFormatted})
2. Each day should have specific tasks for different subjects
3. Each task should specify:
   - Subject name
   - Activity (e.g., "Review calculus concepts", "Solve practice problems", "Read chapter 3")
   - Duration (in minutes)
   - Priority (high, medium, or low)
4. Allocate more time to difficult and important subjects
5. Include occasional breaks
6. Include review sessions for previously studied material
7. Gradually increase focus on high-importance subjects as the exam approaches

Format your response as a structured JSON object without any explanations. The JSON should have the following structure:
{
  "studyPlan": {
    "days": [
      {
        "date": "YYYY-MM-DD",
        "tasks": [
          {
            "subject": "Subject Name",
            "duration": 45,
            "activity": "Specific activity description",
            "priority": "high|medium|low"
          }
        ]
      }
    ]
  }
}
`;

    try {
      // Generate study plan using Gemini API
      console.log("Sending request to Gemini API...");
      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      const aiResponse = response.text();

      if (!aiResponse) {
        console.error("Empty response from AI");
        throw new Error("No response from AI");
      }

      console.log("AI response received, length:", aiResponse.length);

      // Parse the AI response
      // Find the JSON part of the response (Gemini may include additional text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error(
          "Could not find JSON in AI response:",
          aiResponse.substring(0, 100) + "...",
        );
        throw new Error("Could not parse JSON from AI response");
      }

      const jsonString = jsonMatch[0];

      try {
        const studyPlanData = JSON.parse(jsonString);
        console.log("Successfully parsed JSON response");

        // Return the AI-generated study plan
        return NextResponse.json(studyPlanData);
      } catch (parseError) {
        console.error(
          "JSON parse error:",
          parseError,
          "JSON string:",
          jsonString.substring(0, 100) + "...",
        );
        throw new Error("Failed to parse AI response as JSON");
      }
    } catch (error) {
      console.error("Error with AI generation:", error);

      // Fallback to direct call if structured response fails
      // This is a simplified study plan in case of AI failure
      console.log("Using fallback study plan generator");

      // Generate a study plan for each day from today to exam date (inclusive)
      const days = [];
      const numDays = Math.max(1, daysUntilExam + 1); // +1 to include exam day

      for (let i = 0; i < numDays; i++) {
        const date = addDays(today, i);
        const dateString = format(date, "yyyy-MM-dd");

        // Distribute subjects across days
        const dayTasks = subjects.map((subject: any) => ({
          subject: subject.name,
          duration: 60,
          activity: `Study ${subject.name}`,
          priority: subject.importance,
        }));

        days.push({
          date: dateString,
          tasks: dayTasks,
        });
      }

      const fallbackStudyPlan = {
        studyPlan: {
          days: days,
        },
      };

      return NextResponse.json(fallbackStudyPlan);
    }
  } catch (error) {
    console.error("Error generating study plan:", error);
    return NextResponse.json(
      {
        error: "Failed to generate study plan",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
