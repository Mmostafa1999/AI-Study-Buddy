# AI Study Buddy

A full-stack Next.js 14 application that helps students create study plans, generate flashcards, and quiz themselves using AI.

## Features

- **AI-Generated Study Plans**: Create personalized study plans based on subjects, difficulty levels, and exam dates
- **Flashcards**: Generate and manage flashcards for any subject
- **Quizzes**: Convert flashcards into interactive quizzes
- **AI Chat**: Get help with studying through an AI-powered chat interface
- **Authentication**: Secure user authentication with Firebase

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Firebase
- **AI**: Google's Gemini API (gemini-1.5-flash)
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Styling**: Tailwind CSS with DaisyUI components

## Project Structure

```
├── app/
│   ├── (pages)/         # Route groups for different pages
│   ├── api/             # API routes (serverless functions)
│   │   ├── ai/          # AI-related endpoints
│   │   ├── flashcards/  # Flashcard management endpoints
│   │   └── study-plans/ # Study plan endpoints
│   ├── components/      # React components
│   │   ├── ui/          # Reusable UI components
│   │   └── ...          # Feature-specific components
│   ├── contexts/        # React context providers
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and services
│   └── types/           # TypeScript type definitions
├── public/              # Static assets
├── .env.local           # Environment variables
└── ...                  # Configuration files
```

## Architecture Improvements

The codebase has been refactored to follow best practices:

1. **Type System**: Centralized type definitions in `app/types/index.ts`
2. **Error Handling**: Consistent error handling with custom error classes and utility functions
3. **API Response Standardization**: Standard format for all API responses
4. **Component Reusability**: Breaking down large components into smaller reusable ones
5. **Clean Code**: Removed code duplication and improved readability
6. **Separation of Concerns**: Service layers to separate business logic from UI
7. **Consistent Styling**: Utility functions for styling with class-variance-authority

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (see `.env.example`)
4. Run the development server:
   ```bash
   npm run dev
   ```

## Authentication

The application uses Firebase Authentication with multiple methods:
- Email/Password
- Google Sign-In
- GitHub Sign-In

User sessions are persisted, and protected routes require authentication.

## AI Integration

The application integrates with Google's Gemini API for several AI features:
- Study plan generation
- Flashcard creation
- Quiz generation
- AI-powered chat assistance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 