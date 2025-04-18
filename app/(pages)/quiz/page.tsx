'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import { useQuiz } from '../../contexts/QuizContext'
import { Calendar, CheckCircle2, XCircle, RefreshCw, LoadingSpinner } from '../../components/Icons'
import Link from 'next/link'

export default function QuizPage() {
    const { user, loading: authLoading } = useAuth()
    const router = useRouter()
    const {
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
    } = useQuiz()

    const [showExplanation, setShowExplanation] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/sign-in')
        }
    }, [user, authLoading, router])

    // Define fetchDailyQuiz with useCallback
    const fetchDailyQuiz = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)
            reset()

            const token = await user?.getIdToken()
            const response = await fetch('/api/ai/daily-quiz', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                const errorData = await response.json()
                if (response.status === 404) {
                    if (errorData.error === "No study plans found") {
                        throw new Error("You don't have any study plans yet. Create a study plan to get personalized quizzes.")
                    } else if (errorData.error === "No tasks scheduled for today") {
                        throw new Error("You don't have any tasks scheduled for today. Check your study plan.")
                    } else {
                        throw new Error(errorData.error || "No quiz is available for today")
                    }
                }
                throw new Error(errorData.error || 'Failed to fetch quiz')
            }

            const data = await response.json()

            if (data.quiz && Array.isArray(data.quiz) && data.quiz.length > 0) {
                setQuiz(data.quiz)
                setSubjectsForToday(data.subjectsForToday || [])
            } else {
                throw new Error('No quiz questions available')
            }
        } catch (error) {
            console.error('Error fetching daily quiz:', error)
            setError(error instanceof Error ? error.message : 'An error occurred')
        } finally {
            setIsLoading(false)
        }
    }, [user, reset, setIsLoading, setError, setQuiz, setSubjectsForToday])

    // Fetch the daily quiz when the component mounts
    useEffect(() => {
        if (user) {
            fetchDailyQuiz()
        }
    }, [user])

    const handleOptionSelect = (option: string) => {
        if (selectedOption) return // Prevent changing answer after selection

        setSelectedOption(option)
        const currentQuestion = quiz[currentQuestionIndex]
        const correct = option === currentQuestion.correctAnswer
        setIsCorrect(correct)
        setShowResult(true)

        if (correct) {
            setScore(score + 1)
        }
    }

    const handleNextQuestion = () => {
        if (currentQuestionIndex < quiz.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1)
            setSelectedOption(null)
            setShowResult(false)
            setShowExplanation(false)
        } else {
            setQuizCompleted(true)
        }
    }

    const restartQuiz = () => {
        reset()
        fetchDailyQuiz()
    }

    const toggleExplanation = () => {
        setShowExplanation(!showExplanation)
    }

    // Loading state
    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center space-y-4">
                    {/* <LoadingSpinner className="h-12 w-12 mx-auto animate-spin text-primary" /> */}
                    <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                        {/* {isLoading ? 'Generating your daily quiz...' : 'Loading...'} */}
                    </p>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 pt-24">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            No Quiz Available
                        </h2>
                        <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                            {error}
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link href="/study-plan" className="btn btn-primary">
                                <Calendar className="mr-2 h-4 w-4" />
                                Create Study Plan
                            </Link>
                            <button onClick={fetchDailyQuiz} className="btn btn-outline">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Not logged in
    if (!user) {
        return null // Will redirect to login
    }

    // No quiz questions
    if (quiz.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8 pt-24">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            No Quiz Available
                        </h2>
                        <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                            There are no quiz questions available for today. This might be because you don't have a study plan or there are no tasks scheduled for today.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link href="/study-plan" className="btn btn-primary">
                                <Calendar className="mr-2 h-4 w-4" />
                                Create Study Plan
                            </Link>
                            <button onClick={fetchDailyQuiz} className="btn btn-outline">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const currentQuestion = quiz[currentQuestionIndex]

    return (
        <div className="container mx-auto px-4 py-8 pt-24">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Daily Quiz
                    </h1>
                    {subjectsForToday.length > 0 && (
                        <p className="text-gray-600 dark:text-gray-400">
                            Today's subjects: {subjectsForToday.join(', ')}
                        </p>
                    )}
                </div>

                {quizCompleted ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
                    >
                        <div className="text-center mb-8">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-4"
                            >
                                <CheckCircle2 className="h-12 w-12" />
                            </motion.div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Quiz Completed!
                            </h2>
                            <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
                                Your score: {score} out of {quiz.length}
                                {' '}
                                ({Math.round((score / quiz.length) * 100)}%)
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {score === quiz.length
                                    ? 'Perfect score! Excellent work!'
                                    : score >= Math.ceil(quiz.length * 0.7)
                                        ? 'Great job! Keep up the good work!'
                                        : 'Keep practicing. You\'ll improve next time!'}
                            </p>
                        </div>

                        <div className="space-y-6 mb-8">
                            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                                Review Questions:
                            </h3>
                            {quiz.map((q, index) => (
                                <div
                                    key={index}
                                    className={`p-4 rounded-lg border ${q.correctAnswer === q.options.find(opt => opt === q.correctAnswer)
                                        ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/10'
                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                        }`}
                                >
                                    <p className="font-medium mb-2">
                                        {index + 1}. {q.question}
                                    </p>
                                    <p className="text-green-700 dark:text-green-400 text-sm mb-1">
                                        Correct answer: {q.correctAnswer}
                                    </p>
                                    {q.explanation && (
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                                            {q.explanation}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={restartQuiz}
                                className="btn btn-primary"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Restart Quiz
                            </motion.button>
                            <Link href="/study-plan" className="btn btn-outline">
                                <Calendar className="mr-2 h-4 w-4" />
                                View Study Plan
                            </Link>
                        </div>
                    </motion.div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentQuestionIndex}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
                        >
                            {/* Progress bar */}
                            <div className="mb-6">
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    <span>Question {currentQuestionIndex + 1} of {quiz.length}</span>
                                    <span>Score: {score}</span>
                                </div>
                                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-primary-600 dark:bg-primary-500"
                                        initial={{ width: `${((currentQuestionIndex) / quiz.length) * 100}%` }}
                                        animate={{ width: `${((currentQuestionIndex + 1) / quiz.length) * 100}%` }}
                                        transition={{ duration: 0.5 }}
                                    ></motion.div>
                                </div>
                            </div>

                            {/* Subject tag */}
                            {currentQuestion.subject && (
                                <div className="mb-3">
                                    <span className="px-2 py-1 text-xs font-medium rounded-md bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                                        {currentQuestion.subject}
                                    </span>
                                </div>
                            )}

                            {/* Question */}
                            <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
                                {currentQuestion.question}
                            </h2>

                            {/* Options */}
                            <div className="space-y-3 mb-6">
                                {currentQuestion.options.map((option, index) => (
                                    <motion.button
                                        key={index}
                                        whileHover={selectedOption === null ? { scale: 1.01 } : {}}
                                        whileTap={selectedOption === null ? { scale: 0.99 } : {}}
                                        onClick={() => handleOptionSelect(option)}
                                        className={`w-full py-3 px-4 rounded-lg border text-left transition-colors ${selectedOption === option
                                            ? option === currentQuestion.correctAnswer
                                                ? 'bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:border-green-500 dark:text-green-100'
                                                : 'bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:border-red-500 dark:text-red-100'
                                            : selectedOption !== null && option === currentQuestion.correctAnswer
                                                ? 'bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:border-green-500 dark:text-green-100'
                                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
                                            }`}
                                        disabled={selectedOption !== null}
                                    >
                                        <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                                        {selectedOption === option && option === currentQuestion.correctAnswer && (
                                            <CheckCircle2 className="h-5 w-5 inline-block ml-2 text-green-600 dark:text-green-400" />
                                        )}
                                        {selectedOption === option && option !== currentQuestion.correctAnswer && (
                                            <XCircle className="h-5 w-5 inline-block ml-2 text-red-600 dark:text-red-400" />
                                        )}
                                    </motion.button>
                                ))}
                            </div>

                            {/* Result message */}
                            {showResult && (
                                <>
                                    <div className={`mb-3 p-4 rounded-lg ${isCorrect
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-100'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-100'
                                        }`}>
                                        <p className="font-medium flex items-start">
                                            {isCorrect ? (
                                                <><CheckCircle2 className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" /> Correct! Well done.</>
                                            ) : (
                                                <><XCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" /> Incorrect. The correct answer is "{currentQuestion.correctAnswer}".</>
                                            )}
                                        </p>
                                    </div>

                                    {/* Explanation */}
                                    {currentQuestion.explanation && (
                                        <motion.div
                                            animate={showExplanation ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden mb-4"
                                        >
                                            {showExplanation && (
                                                <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700/50">
                                                    <h4 className="font-medium mb-1 text-gray-900 dark:text-white">Explanation:</h4>
                                                    <p className="text-gray-700 dark:text-gray-300">{currentQuestion.explanation}</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {/* Explanation toggle */}
                                    {currentQuestion.explanation && (
                                        <div className="mb-3">
                                            <button
                                                onClick={toggleExplanation}
                                                className="text-primary-600 dark:text-primary-400 font-medium flex items-center text-sm hover:underline"
                                            >
                                                {showExplanation ? 'Hide explanation' : 'Show explanation'}
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Navigation */}
                            <div className="flex justify-end">
                                <motion.button
                                    whileHover={selectedOption ? { scale: 1.05 } : {}}
                                    whileTap={selectedOption ? { scale: 0.95 } : {}}
                                    onClick={handleNextQuestion}
                                    disabled={!selectedOption}
                                    className={`btn ${selectedOption ? 'btn-primary' : 'btn-outline opacity-50 cursor-not-allowed'
                                        }`}
                                >
                                    {currentQuestionIndex < quiz.length - 1 ? 'Next Question' : 'See Results'}
                                </motion.button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    )
} 