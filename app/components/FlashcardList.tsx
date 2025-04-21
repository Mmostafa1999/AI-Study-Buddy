'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flashcard as FlashcardComponent } from './ui/Flashcard'
import { Flashcard } from '@/app/types'

interface FlashcardListProps {
    flashcards: Flashcard[]
    onDelete?: (id: string) => void
    onEdit?: (id: string, updates: { question: string; answer: string }) => void
    onToggleFavorite?: (id: string, favorited: boolean) => void
    editable?: boolean
}

export default function FlashcardList({
    flashcards,
    onDelete,
    onEdit,
    onToggleFavorite,
    editable = false,
}: FlashcardListProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [flipped, setFlipped] = useState(false)
    const [editMode, setEditMode] = useState<string | null>(null)
    const [editQuestion, setEditQuestion] = useState('')
    const [editAnswer, setEditAnswer] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
    const [validationError, setValidationError] = useState("")

    // Filter flashcards based on search term and favorites filter
    const filteredFlashcards = useMemo(() => {
        let result = [...flashcards];

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(card =>
                card.question.toLowerCase().includes(term) ||
                card.answer.toLowerCase().includes(term)
            );
        }

        // Filter by favorites
        if (showFavoritesOnly) {
            result = result.filter(card => card.favorited);
        }

        return result;
    }, [flashcards, searchTerm, showFavoritesOnly]);

    // Get the current flashcard based on the current index
    const currentFlashcard = useMemo(() => {
        return filteredFlashcards.length > 0 ? filteredFlashcards[currentIndex] : null;
    }, [filteredFlashcards, currentIndex]);

    // Reset current index when filters change
    useEffect(() => {
        if (filteredFlashcards.length > 0) {
            setCurrentIndex(0);
            setFlipped(false);
        }
    }, [filteredFlashcards.length]);

    // Handle card navigation
    const handleNext = () => {
        setFlipped(false)
        setTimeout(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % filteredFlashcards.length)
        }, 200)
    }

    const handlePrevious = () => {
        setFlipped(false)
        setTimeout(() => {
            setCurrentIndex(
                (prevIndex) => (prevIndex - 1 + filteredFlashcards.length) % filteredFlashcards.length
            )
        }, 200)
    }



    // Handle toggling favorite status
    const handleToggleFavorite = () => {
        if (!currentFlashcard || !onToggleFavorite) return;
        onToggleFavorite(currentFlashcard.id, !currentFlashcard.favorited);
    };

    // Edit mode handlers
    const handleStartEdit = (id: string) => {
        const flashcard = filteredFlashcards.find((f) => f.id === id)
        if (flashcard) {
            setEditQuestion(flashcard.question)
            setEditAnswer(flashcard.answer)
            setEditMode(id)
        }
    }

    const handleSaveEdit = () => {
        // Validate the form inputs
        const validationErrors = [];

        if (!editQuestion || editQuestion.trim() === '') {
            validationErrors.push('Question cannot be empty');
        }

        if (!editAnswer || editAnswer.trim() === '') {
            validationErrors.push('Answer cannot be empty');
        }

        // If there are validation errors, show them and don't proceed
        if (validationErrors.length > 0) {
            setValidationError(validationErrors.join('. '));
            return;
        }

        // Clear any previous validation errors
        setValidationError('');

        if (editMode && onEdit) {
            onEdit(editMode, { question: editQuestion, answer: editAnswer });
            setEditMode(null);
        }
    }

    const handleCancelEdit = () => {
        setEditMode(null)
    }

    // For empty state
    if (filteredFlashcards.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="h-20 w-20 bg-primary-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-10 h-10 text-primary-600 dark:text-primary-400"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                        />
                    </svg>
                </motion.div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No flashcards found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                    {searchTerm || showFavoritesOnly ?
                        "No flashcards match your current filters." :
                        "Generate flashcards from your notes or create them manually."}
                </p>
                {(searchTerm || showFavoritesOnly) && (
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setShowFavoritesOnly(false);
                        }}
                        className="mt-4 btn btn-outline btn-sm"
                    >
                        Clear Filters
                    </button>
                )}
            </div>
        )
    }

    // Edit mode view
    if (editMode) {
        return (
            <div className="max-w-3xl mx-auto px-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Edit Flashcard
                    </h3>
                    {validationError && (
                        <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                            {validationError}
                        </div>
                    )}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="question" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Question
                            </label>
                            <textarea
                                id="question"
                                rows={3}
                                className={`w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white textarea textarea-bordered ${!editQuestion || editQuestion.trim() === '' ? 'border-red-500' : ''
                                    }`}
                                value={editQuestion}
                                onChange={(e) => setEditQuestion(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="answer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Answer
                            </label>
                            <textarea
                                id="answer"
                                rows={5}
                                className={`w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white textarea textarea-bordered ${!editAnswer || editAnswer.trim() === '' ? 'border-red-500' : ''
                                    }`}
                                value={editAnswer}
                                onChange={(e) => setEditAnswer(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <button
                                type="button"
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                                onClick={handleCancelEdit}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800"
                                onClick={handleSaveEdit}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4">
            {/* Search and filter */}
            <div className="flex flex-wrap gap-2 mb-6 items-center justify-between">
                <div className="relative flex-1 min-w-[200px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                            className="h-5 w-5 text-gray-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                fillRule="evenodd"
                                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Search flashcards..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        className={`inline-flex items-center px-3 py-2 text-sm rounded-md ${showFavoritesOnly
                            ? "bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                            }`}
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-4 w-4 mr-1.5 ${showFavoritesOnly ? "text-yellow-500" : "text-gray-400"
                                }`}
                            fill={showFavoritesOnly ? "currentColor" : "none"}
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                        </svg>
                        Favorites
                    </button>

                </div>
            </div>

            {/* Counter */}
            <div className="text-center mb-4">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {filteredFlashcards.length > 0
                        ? `Card ${currentIndex + 1} of ${filteredFlashcards.length}`
                        : "No cards available"
                    }
                </span>
            </div>

            {/* Flashcard */}
            {currentFlashcard ? (
                <FlashcardComponent
                    flashcard={currentFlashcard}
                    isFlipped={flipped}
                    onFlip={() => setFlipped(!flipped)}
                    onEdit={() => handleStartEdit(currentFlashcard.id)}
                    onDelete={() => onDelete && onDelete(currentFlashcard.id)}
                    onToggleFavorite={handleToggleFavorite}
                    editable={editable}
                />
            ) : (
                <div className="w-full max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md text-center">
                    <p className="text-gray-600 dark:text-gray-400">No flashcard available</p>
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-center space-x-4 mt-8">
                <button
                    className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 ${filteredFlashcards.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={handlePrevious}
                    disabled={filteredFlashcards.length <= 1}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                    Previous
                </button>
                <button
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800 ${filteredFlashcards.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={handleNext}
                    disabled={filteredFlashcards.length <= 1}
                >
                    Next
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 ml-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </button>
            </div>

            {/* Count indicator for small screens */}
            <div className="block sm:hidden text-center mt-4">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {filteredFlashcards.length > 0
                        ? `${currentIndex + 1} / ${filteredFlashcards.length}`
                        : "0 / 0"
                    }
                </span>
            </div>
        </div>
    )
} 