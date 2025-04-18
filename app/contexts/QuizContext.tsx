'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

export type QuizQuestion = {
    question: string
    options: string[]
    correctAnswer: string
    explanation?: string
    subject?: string
}

interface QuizContextType {
    isLoading: boolean
    setIsLoading: (loading: boolean) => void
    quiz: QuizQuestion[]
    setQuiz: (quiz: QuizQuestion[]) => void
    currentQuestionIndex: number
    setCurrentQuestionIndex: (index: number) => void
    selectedOption: string | null
    setSelectedOption: (option: string | null) => void
    score: number
    setScore: (score: number) => void
    showResult: boolean
    setShowResult: (show: boolean) => void
    isCorrect: boolean
    setIsCorrect: (correct: boolean) => void
    quizCompleted: boolean
    setQuizCompleted: (completed: boolean) => void
    subjectsForToday: string[]
    setSubjectsForToday: (subjects: string[]) => void
    reset: () => void
}

const QuizContext = createContext<QuizContextType | null>(null)

export const useQuiz = () => {
    const context = useContext(QuizContext)
    if (!context) {
        throw new Error('useQuiz must be used within a QuizProvider')
    }
    return context
}

export const QuizProvider = ({ children }: { children: ReactNode }) => {
    const [isLoading, setIsLoading] = useState(true)
    const [quiz, setQuiz] = useState<QuizQuestion[]>([])
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [selectedOption, setSelectedOption] = useState<string | null>(null)
    const [score, setScore] = useState(0)
    const [showResult, setShowResult] = useState(false)
    const [isCorrect, setIsCorrect] = useState(false)
    const [quizCompleted, setQuizCompleted] = useState(false)
    const [subjectsForToday, setSubjectsForToday] = useState<string[]>([])

    const reset = () => {
        setCurrentQuestionIndex(0)
        setSelectedOption(null)
        setShowResult(false)
        setScore(0)
        setQuizCompleted(false)
    }

    return (
        <QuizContext.Provider
            value={{
                isLoading,
                setIsLoading,
                quiz,
                setQuiz,
                currentQuestionIndex,
                setCurrentQuestionIndex,
                selectedOption,
                setSelectedOption,
                score,
                setScore,
                showResult,
                setShowResult,
                isCorrect,
                setIsCorrect,
                quizCompleted,
                setQuizCompleted,
                subjectsForToday,
                setSubjectsForToday,
                reset
            }}
        >
            {children}
        </QuizContext.Provider>
    )
} 