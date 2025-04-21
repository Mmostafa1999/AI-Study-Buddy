import { successResponse } from "@/app/lib/apiService";
import {
  assertAuthenticated,
  assertValidData,
  withErrorHandling,
} from "@/app/lib/errorUtils";
import { generateStudyPlan } from "@/app/lib/gemini";
import { StudyPlanGenerationRequest } from "@/app/types";
import { NextRequest } from "next/server";

async function handler(req: NextRequest) {
  // Verify authentication
  const authToken = req.headers.get("Authorization")?.split("Bearer ")[1];
  assertAuthenticated(authToken);

  // Parse and validate the request body
  const requestBody = (await req.json()) as StudyPlanGenerationRequest;
  assertValidData(requestBody, ["subjects", "examDate", "hoursPerDay"]);

  // Calculate days until exam
  const today = new Date();
  const examDate = new Date(requestBody.examDate);
  const daysUntilExam = Math.ceil(
    (examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysUntilExam < 1) {
    throw new Error("Exam date must be in the future");
  }

  // Generate study plan
  const days = await generateStudyPlan(requestBody);

  // Return the generated study plan
  return successResponse({ days });
}

export const POST = withErrorHandling(handler);
