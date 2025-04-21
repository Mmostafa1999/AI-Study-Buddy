// Flashcard types
export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  favorited?: boolean;
}

// Quiz types
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface Quiz {
  id: string;
  userId: string;
  title: string;
  questions: QuizQuestion[];
  createdAt: string;
}

// Study Plan types
export interface Task {
  subject: string;
  duration: number;
  activity: string;
  priority: string;
  completed?: boolean;
  id?: string;
  title?: string;
}

export interface Day {
  date: string;
  tasks: Task[];
}

export interface Subject {
  name: string;
  difficulty: string;
  importance: string;
}

export interface StudyPlan {
  id: string;
  userId: string;
  studyPlan: {
    days: Day[];
  };
  subjects: Subject[];
  examDate: string;
  hoursPerDay: number;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

// AI Generation types
export interface FlashcardGenerationRequest {
  notes: string;
  subject: string;
  language?: string;
  count?: number;
}

export interface StudyPlanGenerationRequest {
  subjects: Subject[];
  examDate: string;
  hoursPerDay: number;
}

export interface QuizGenerationRequest {
  flashcards: Flashcard[];
  questionCount?: number;
}
