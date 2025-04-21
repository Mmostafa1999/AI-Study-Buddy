import { z } from "zod";

// Basic user and auth related schemas
export const emailSchema = z
  .string()
  .email("Please enter a valid email address");
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");
export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters");

// User profile schema
export const userProfileSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  email: emailSchema,
  photoURL: z.string().url().optional().nullable(),
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

// Flashcard validation schema
export const flashcardSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  favorited: z.boolean().default(false),
  userId: z.string(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});

export type FlashcardInput = Omit<
  z.infer<typeof flashcardSchema>,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

// Study plan validation schema
export const taskSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Task title is required"),
  completed: z.boolean().default(false),
  duration: z.number().min(0).optional(),
});

export const daySchema = z.object({
  date: z.string().or(z.date()),
  title: z.string().min(1, "Day title is required"),
  tasks: z.array(taskSchema).default([]),
});

export const studyPlanSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  days: z.array(daySchema).default([]),
  userId: z.string(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});

export type StudyPlanInput = Omit<
  z.infer<typeof studyPlanSchema>,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

// Quiz question validation schema
export const quizQuestionSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(1, "Question is required"),
  options: z.array(z.string()).min(2, "At least 2 options are required"),
  correctAnswer: z.string().min(1, "Correct answer is required"),
});

export type QuizQuestionInput = Omit<z.infer<typeof quizQuestionSchema>, "id">;

// Quiz validation schema
export const quizSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  questions: z
    .array(quizQuestionSchema)
    .min(1, "At least 1 question is required"),
  userId: z.string(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});

export type QuizInput = Omit<
  z.infer<typeof quizSchema>,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

// Note validation schema
export const noteSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  subject: z.string().min(1, "Subject is required"),
  userId: z.string(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});

export type NoteInput = Omit<
  z.infer<typeof noteSchema>,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

// AI Generation request validation schemas
export const flashcardGenerationSchema = z.object({
  notes: z.string().min(10, "Notes must be at least 10 characters"),
  subject: z.string().min(1, "Subject is required"),
  language: z.string().optional(),
  count: z.number().min(1).max(20).optional(),
});

export const quizGenerationSchema = z.object({
  flashcards: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      }),
    )
    .min(1, "At least one flashcard is required"),
  questionCount: z.number().min(1).optional(),
});

export const studyPlanGenerationSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  dailyHours: z.number().min(1).max(12).optional(),
  topics: z.array(z.string()).min(1, "At least one topic is required"),
});
