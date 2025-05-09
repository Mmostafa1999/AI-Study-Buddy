import { StudyPlan } from "@/app/types";
import { z } from "zod";
import { ApiService } from "./apiService";
import { Result } from "./errorUtils";

// Validation schema for study plan task
const taskSchema = z.object({
  subject: z.string(),
  duration: z.number().min(0),
  activity: z.string(),
  priority: z.string(),
  id: z.string().optional(),
  title: z.string().optional(),
  completed: z.boolean().optional(),
});

// Validation schema for study plan day
const daySchema = z.object({
  date: z
    .string()
    .or(z.date())
    .transform(val => (val instanceof Date ? val.toISOString() : val)),
  title: z.string().min(1, "Day title is required"),
  tasks: z.array(taskSchema).default([]),
});

// Subject schema
const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  difficulty: z.string(),
  importance: z.string(),
});

// Full study plan schema matching the expected type
export const studyPlanSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  studyPlan: z.object({
    days: z.array(daySchema).default([]),
  }),
  subjects: z.array(subjectSchema).default([]),
  examDate: z.string(),
  hoursPerDay: z.number().min(1),
  userId: z.string(),
  createdAt: z
    .string()
    .or(z.date())
    .transform(val => (val instanceof Date ? val.toISOString() : val)),
});

export type StudyPlanInput = z.infer<typeof studyPlanSchema>;

// Create service with study plan-specific methods
class StudyPlanService extends ApiService<StudyPlan> {
  constructor() {
    super("api/study-plans");
  }

  // Improved fetchById with better error handling
  async fetchById(id: string): Promise<Result<StudyPlan>> {
    try {
      const response = await fetch(this.getUrl(id), {
        headers: this.options.headers,
        cache: 'no-store'
      });

      if (!response.ok) {
        console.error(`Failed to fetch study plan with ID ${id}: ${response.status}`);
        return {
          success: false,
          error: {
            message: `Failed to fetch study plan: ${response.statusText}`,
            statusCode: response.status
          }
        };
      }

      const data = await response.json();
      
      // Check which response format we have
      const plan = data.data || data.plan;
      
      if (!plan) {
        console.error("Response format is incorrect:", data);
        return {
          success: false,
          error: {
            message: "Invalid API response format",
            statusCode: 500
          }
        };
      }
      
      return {
        success: true,
        data: plan
      };
    } catch (error) {
      console.error("Error in StudyPlanService.fetchById:", error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Unknown error occurred",
          statusCode: 500
        }
      };
    }
  }

  // Override create to validate study plan data
  async create(data: Omit<StudyPlan, "id">): Promise<Result<string>> {
    const validationResult = studyPlanSchema.safeParse(data);

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

  // Override update to validate study plan data
  async update(id: string, updates: Partial<StudyPlan>): Promise<Result<void>> {
    if (Object.keys(updates).length === 0) {
      return {
        success: false,
        error: {
          message: "No updates provided",
          statusCode: 400,
        },
      };
    }

    const validationResult = studyPlanSchema.partial().safeParse(updates);

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
export const studyPlanService = new StudyPlanService();
