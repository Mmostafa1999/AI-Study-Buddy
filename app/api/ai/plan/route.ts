import { successResponse } from "@/app/lib/apiService";
import {
  assertAuthenticated,
  assertValidData,
  withErrorHandling,
} from "@/app/lib/errorUtils";
import { generateStudyPlan } from "@/app/lib/gemini";
import { StudyPlanGenerationRequest } from "@/app/types";
import { NextRequest } from "next/server";
import { format, isSameDay } from "date-fns";

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
  const daysResult = await generateStudyPlan(requestBody);
  
  if (!daysResult.success) {
    throw new Error(daysResult.error.message || "Failed to generate study plan");
  }
  
  // Make sure the plan starts from today
  let daysWithTitles = daysResult.data;
  
  // Verify the first day is today
  if (daysWithTitles.length > 0) {
    const firstDay = new Date(daysWithTitles[0].date);
    const todayFormatted = format(today, 'yyyy-MM-dd');
    
    // If the first day is not today, adjust all days
    if (!isSameDay(firstDay, today)) {
      // Map each day to a new day starting from today
      daysWithTitles = daysWithTitles.map((day, index) => {
        const dayDate = new Date(today);
        dayDate.setDate(today.getDate() + index);
        const dayTitle = format(dayDate, "EEEE, MMMM d, yyyy");
        
        return {
          ...day,
          date: format(dayDate, 'yyyy-MM-dd'),
          title: dayTitle
        };
      });
    }
  }
  
  // Format or re-format the titles for consistency
  daysWithTitles = daysWithTitles.map(day => {
    // Parse the date and format it
    const dayDate = new Date(day.date);
    const dayTitle = format(dayDate, "EEEE, MMMM d, yyyy");
    
    return {
      ...day,
      title: dayTitle
    };
  });
  
  // Generate title based on subjects
  const subjectNames = requestBody.subjects.map(s => s.name).join(", ");
  const title = `Study Plan for ${subjectNames}`;
  const description = `Generated plan for ${daysUntilExam} days until exam on ${examDate.toISOString().split('T')[0]}`;
  
  // Return the complete study plan data structure as expected by the client
  const studyPlanData = {
    title,
    description,
    studyPlan: {
      days: daysWithTitles
    },
    subjects: requestBody.subjects,
    examDate: requestBody.examDate,
    hoursPerDay: requestBody.hoursPerDay
  };

  // Return the generated study plan
  return successResponse(studyPlanData);
}

export const POST = withErrorHandling(handler);
