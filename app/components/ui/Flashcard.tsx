'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Flashcard as FlashcardType } from '@/app/types'

interface FlashcardProps {
    flashcard: FlashcardType
    isFlipped: boolean
    onFlip: () => void
    onEdit?: () => void
    onDelete?: () => void
    onToggleFavorite?: () => void
    editable?: boolean
}

export function Flashcard({
    flashcard,
    isFlipped,
    onFlip,
    onEdit,
    onDelete,
    onToggleFavorite,
    editable = false,
}: FlashcardProps) {
    return (
        <div className="w-full max-w-3xl mx-auto" onClick={onFlip}>
            <motion.div
                className="relative w-full aspect-[3/2] cursor-pointer"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* Front */}
                <div
                    className={`absolute inset-0 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md backface-hidden flex flex-col ${isFlipped ? "hidden" : ""
                        }`}
                >
                    <div className="flex-1 flex items-center justify-center">
                        <h3 className="text-xl md:text-2xl font-medium text-gray-900 dark:text-white text-center">
                            {flashcard.question}
                        </h3>
                    </div>
                    <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        Click to reveal answer
                    </div>
                </div>

                {/* Back */}
                <div
                    className={`absolute inset-0 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md backface-hidden flex flex-col ${!isFlipped ? "hidden" : ""
                        }`}
                    style={{ transform: "rotateY(180deg)" }}
                >
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-md md:text-lg text-gray-800 dark:text-gray-200 text-center whitespace-pre-wrap">
                            {flashcard.answer}
                        </p>
                    </div>
                    <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        Click to see question
                    </div>
                </div>
            </motion.div>

            {/* Controls */}
            <div className="mt-4 flex justify-center space-x-2" onClick={(e) => e.stopPropagation()}>
                {onToggleFavorite && (
                    <button
                        onClick={onToggleFavorite}
                        className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${flashcard.favorited ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-500'
                            }`}
                        aria-label={flashcard.favorited ? "Remove from favorites" : "Add to favorites"}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill={flashcard.favorited ? "currentColor" : "none"}
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                            />
                        </svg>
                    </button>
                )}
                {editable && onEdit && (
                    <button
                        onClick={onEdit}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
                        aria-label="Edit flashcard"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                            />
                        </svg>
                    </button>
                )}
                {editable && onDelete && (
                    <button
                        onClick={onDelete}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
                        aria-label="Delete flashcard"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                            />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    )
}

// Add global styles to your CSS file
export const flashcardStyles = `
  .backface-hidden {
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }
` 