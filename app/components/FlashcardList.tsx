'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Flashcard {
    id: string
    question: string
    answer: string
    favorited?: boolean
}

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
    const [filteredFlashcards, setFilteredFlashcards] = useState<Flashcard[]>(flashcards)
    const [searchTerm, setSearchTerm] = useState('')
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

    // Initialize filtered flashcards
    useEffect(() => {
        // Filter flashcards based on search term and favorites filter
        const filterFlashcards = () => {
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

            setFilteredFlashcards(result);
            // Reset current index when filters change
            if (result.length > 0) {
                setCurrentIndex(0);
                setFlipped(false);
            }
        };

        filterFlashcards();
    }, [flashcards, searchTerm, showFavoritesOnly, setFlipped, setCurrentIndex]);

    // Handle shuffling the deck
    const handleShuffle = () => {
        const shuffled = [...filteredFlashcards];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setFilteredFlashcards(shuffled);
        setCurrentIndex(0);
        setFlipped(false);
    };

    // Handle toggling favorite status
    const handleToggleFavorite = () => {
        if (!filteredFlashcards.length || !onToggleFavorite) return;

        const current = filteredFlashcards[currentIndex];
        onToggleFavorite(current.id, !current.favorited);
    };

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

    const handleStartEdit = (id: string) => {
        const flashcard = filteredFlashcards.find((f) => f.id === id)
        if (flashcard) {
            setEditQuestion(flashcard.question)
            setEditAnswer(flashcard.answer)
            setEditMode(id)
        }
    }

    const handleSaveEdit = () => {
        if (editMode && onEdit) {
            onEdit(editMode, { question: editQuestion, answer: editAnswer })
            setEditMode(null)
        }
    }

    const handleCancelEdit = () => {
        setEditMode(null)
    }

    const currentFlashcard = filteredFlashcards[currentIndex]

    return (
        <div className="max-w-3xl mx-auto px-4">
            {/* Search and filters */}
            <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                <div className="flex-1">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search flashcards..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input pl-10 w-full"
                        />
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        className={`btn btn-sm ${showFavoritesOnly ? 'btn-primary' : 'btn-outline'}`}
                        aria-label={showFavoritesOnly ? "Show all flashcards" : "Show only favorites"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill={showFavoritesOnly ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                        {showFavoritesOnly ? "Favorites" : "All"}
                    </button>
                    <button
                        onClick={handleShuffle}
                        className="btn btn-sm btn-outline"
                        aria-label="Shuffle flashcards"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                        </svg>
                        <span className="ml-1 hidden sm:inline">Shuffle</span>
                    </button>
                </div>
            </div>

            {/* Progress indicator */}
            <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    Card {currentIndex + 1} of {filteredFlashcards.length}
                </div>
                <div className="flex-1 mx-4">
                    <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: `${(currentIndex / filteredFlashcards.length) * 100}%` }}
                            animate={{ width: `${((currentIndex + 1) / filteredFlashcards.length) * 100}%` }}
                            className="h-full bg-primary-600 dark:bg-primary-500"
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    {onToggleFavorite && (
                        <button
                            onClick={handleToggleFavorite}
                            className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${currentFlashcard.favorited ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-500'}`}
                            aria-label={currentFlashcard.favorited ? "Remove from favorites" : "Add to favorites"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill={currentFlashcard.favorited ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                            </svg>
                        </button>
                    )}
                    {editable && (
                        <button
                            onClick={() => currentFlashcard && onDelete?.(currentFlashcard.id)}
                            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
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

            {/* Flashcard */}
            <div className="mb-6 perspective">
                <AnimatePresence mode="wait">
                    {editMode === currentFlashcard.id ? (
                        // Edit mode
                        <motion.div
                            key="edit-mode"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
                        >
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Question
                                    </label>
                                    <textarea
                                        value={editQuestion}
                                        onChange={(e) => setEditQuestion(e.target.value)}
                                        className="textarea"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Answer
                                    </label>
                                    <textarea
                                        value={editAnswer}
                                        onChange={(e) => setEditAnswer(e.target.value)}
                                        className="textarea"
                                        rows={5}
                                    />
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <button
                                        onClick={handleCancelEdit}
                                        className="btn btn-outline"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveEdit}
                                        className="btn btn-primary"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        // Flashcard view mode
                        <motion.div
                            key="flashcard"
                            className={`relative w-full h-[300px] cursor-pointer`}
                            onClick={() => setFlipped(!flipped)}
                            initial={false}
                        >
                            <motion.div
                                className="absolute inset-0 w-full h-full rounded-xl bg-white dark:bg-gray-800 shadow-lg flex flex-col justify-center p-6 backface-hidden text-center"
                                animate={{
                                    rotateY: flipped ? 180 : 0,
                                    zIndex: flipped ? 0 : 1,
                                }}
                                transition={{ duration: 0.4 }}
                            >
                                <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    Question
                                </div>
                                <div className="text-xl text-gray-900 dark:text-white">
                                    {currentFlashcard.question}
                                </div>
                                {/* Edit button for question */}
                                {editable && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleStartEdit(currentFlashcard.id)
                                        }}
                                        className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
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
                            </motion.div>

                            <motion.div
                                className="absolute inset-0 w-full h-full rounded-xl bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 dark:bg-gray-800 shadow-lg flex flex-col justify-center p-6 backface-hidden text-center"
                                animate={{
                                    rotateY: flipped ? 0 : -180,
                                    zIndex: flipped ? 1 : 0,
                                }}
                                transition={{ duration: 0.4 }}
                            >
                                <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    Answer
                                </div>
                                <div className="text-xl text-gray-900 dark:text-white">
                                    {currentFlashcard.answer}
                                </div>
                                {/* Edit button for answer */}
                                {editable && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleStartEdit(currentFlashcard.id)
                                        }}
                                        className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
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
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
                    {!editMode && 'Click the card to flip'}
                </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePrevious}
                    className="btn btn-outline flex items-center"
                    disabled={editMode !== null}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5 mr-1"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 19.5L8.25 12l7.5-7.5"
                        />
                    </svg>
                    Previous
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNext}
                    className="btn btn-primary flex items-center"
                    disabled={editMode !== null}
                >
                    Next
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5 ml-1"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.25 4.5l7.5 7.5-7.5 7.5"
                        />
                    </svg>
                </motion.button>
            </div>

            {/* Add CSS for 3D effect */}
            <style jsx global>{`
        .perspective {
          perspective: 1000px;
        }
        .backface-hidden {
          backface-visibility: hidden;
          transform-style: preserve-3d;
        }
      `}</style>
        </div>
    )
} 