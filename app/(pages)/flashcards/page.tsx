'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import FlashcardList from '../../components/FlashcardList'
import { db } from '../../lib/firebase'
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore'

interface Flashcard {
    id: string
    question: string
    answer: string
    favorited?: boolean
}

export default function FlashcardsPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'view' | 'create'>('view')
    const [flashcards, setFlashcards] = useState<Flashcard[]>([])
    const [notes, setNotes] = useState('')
    const [subject, setSubject] = useState('')
    const [language, setLanguage] = useState('English')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])

    // Load user's flashcards from Firestore
    useEffect(() => {
        const loadFlashcards = async () => {
            if (!user) return

            try {
                setIsLoading(true)
                const flashcardsRef = collection(db, 'flashcards')
                const q = query(flashcardsRef, where('userId', '==', user.uid))
                const querySnapshot = await getDocs(q)

                const loadedFlashcards: Flashcard[] = []
                querySnapshot.forEach((doc) => {
                    const data = doc.data()
                    loadedFlashcards.push({
                        id: doc.id,
                        question: data.question,
                        answer: data.answer,
                        favorited: data.favorited || false
                    })
                })

                setFlashcards(loadedFlashcards)
            } catch (err) {
                console.error('Error loading flashcards:', err)
                setError('Failed to load your flashcards')
            } finally {
                setIsLoading(false)
            }
        }

        if (user) {
            loadFlashcards()
        }
    }, [user])

    const generateFlashcards = async () => {
        if (!notes.trim()) {
            setError('Please enter your notes')
            return
        }

        if (!subject.trim()) {
            setError('Please enter a subject')
            return
        }

        try {
            setIsLoading(true)
            setError(null)

            const response = await fetch('/api/ai/flashcards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await user?.getIdToken()}`
                },
                body: JSON.stringify({
                    notes,
                    subject,
                    language,
                    count: 10 // Generate 10 flashcards
                })
            })

            let responseData;
            try {
                responseData = await response.json();
                console.log("API Response data:", responseData);
            } catch (parseError) {
                console.error("Error parsing API response:", parseError);
                throw new Error("Failed to parse server response");
            }

            // First check if the response was successful
            if (!response.ok) {
                const errorMessage = responseData.error || 'Failed to generate flashcards';
                console.error('API error response:', responseData);
                throw new Error(errorMessage);
            }

            // Check for error in the response
            if (responseData.error) {
                console.error('Error in response:', responseData.error);
                throw new Error(responseData.error);
            }

            // Extract flashcards from the response data structure
            // The API wraps the data in a 'data' property
            const flashcardsData = responseData.data?.flashcards;

            // Check if flashcards data is valid before proceeding
            if (!flashcardsData) {
                console.error("Missing flashcards data in response:", responseData);
                throw new Error('No flashcards data received from the server');
            }

            if (!Array.isArray(flashcardsData)) {
                console.error("Flashcards data is not an array:", flashcardsData);
                throw new Error('Invalid flashcards format received from the server');
            }

            if (flashcardsData.length === 0) {
                console.error("Empty flashcards array received");
                throw new Error('No flashcards were generated. Try with different notes or subject.');
            }

            // Save flashcards to Firestore
            const newFlashcards: Flashcard[] = []

            for (const card of flashcardsData) {
                // Validate each flashcard has required fields
                if (!card.question || !card.answer) {
                    console.warn('Skipping invalid flashcard without question or answer', card)
                    continue
                }

                // Add to Firestore
                const docRef = await addDoc(collection(db, 'flashcards'), {
                    userId: user?.uid,
                    subject,
                    language,
                    question: card.question,
                    answer: card.answer,
                    favorited: false,
                    createdAt: new Date()
                })

                newFlashcards.push({
                    id: docRef.id,
                    question: card.question,
                    answer: card.answer,
                    favorited: false
                })
            }

            if (newFlashcards.length === 0) {
                throw new Error('Failed to save any valid flashcards')
            }

            setFlashcards([...newFlashcards, ...flashcards])
            setSuccess(`${newFlashcards.length} flashcards generated successfully!`)
            setActiveTab('view')

            // Reset form
            setNotes('')
            setSubject('')
        } catch (err) {
            console.error('Error generating flashcards:', err)
            setError(err instanceof Error ? err.message : 'Error generating flashcards. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteFlashcard = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'flashcards', id))
            setFlashcards(flashcards.filter(card => card.id !== id))
        } catch (err) {
            console.error('Error deleting flashcard:', err)
            setError('Failed to delete flashcard')
        }
    }

    const handleEditFlashcard = async (id: string, updates: { question: string; answer: string }) => {
        try {
            await updateDoc(doc(db, 'flashcards', id), updates)
            setFlashcards(
                flashcards.map(card => (card.id === id ? { ...card, ...updates } : card))
            )
        } catch (err) {
            console.error('Error updating flashcard:', err)
            setError('Failed to update flashcard')
        }
    }

    const handleToggleFavorite = async (id: string, favorited: boolean) => {
        try {
            await updateDoc(doc(db, 'flashcards', id), { favorited })
            setFlashcards(
                flashcards.map(card => (card.id === id ? { ...card, favorited } : card))
            )
        } catch (err) {
            console.error('Error toggling favorite status:', err)
            setError('Failed to update favorite status')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-pulse text-center">
                    <div className="h-12 w-12 mx-auto rounded-full bg-primary-200 dark:bg-primary-800 mb-4"></div>
                    <div className="h-4 w-24 mx-auto bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        )
    }

    if (!user) {
        return null // Will redirect to login
    }

    return (
        <div className="container mx-auto px-4 py-8 pt-24">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-4xl mx-auto"
            >
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Flashcards
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Generate and study with AI-powered flashcards
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8">
                    <button
                        className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab === 'view'
                            ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-400 dark:border-primary-400'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        onClick={() => setActiveTab('view')}
                    >
                        View Flashcards
                    </button>
                    <button
                        className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab === 'create'
                            ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-400 dark:border-primary-400'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        onClick={() => setActiveTab('create')}
                    >
                        Create Flashcards
                    </button>
                </div>

                {/* Error and success messages */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm"
                        >
                            {error}
                            <button
                                onClick={() => setError(null)}
                                className="float-right"
                                aria-label="Dismiss error"
                            >
                                ×
                            </button>
                        </motion.div>
                    )}

                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm"
                        >
                            {success}
                            <button
                                onClick={() => setSuccess(null)}
                                className="float-right"
                                aria-label="Dismiss message"
                            >
                                ×
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* View Flashcards Tab */}
                {activeTab === 'view' && (
                    <div>
                        <FlashcardList
                            flashcards={flashcards}
                            editable={true}
                            onDelete={handleDeleteFlashcard}
                            onEdit={handleEditFlashcard}
                            onToggleFavorite={handleToggleFavorite}
                        />
                    </div>
                )}

                {/* Create Flashcards Tab */}
                {activeTab === 'create' && (
                    <div>
                        <div className="space-y-6">
                            <div>
                                <label
                                    htmlFor="subject"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                >
                                    Subject
                                </label>
                                <input
                                    id="subject"
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="e.g., Biology, History, Mathematics"
                                    className="input w-full"
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="language"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                >
                                    Language
                                </label>
                                <select
                                    id="language"
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="input w-full"
                                    disabled={isLoading}
                                >
                                    <option value="English">English</option>
                                    <option value="Spanish">Spanish</option>
                                    <option value="French">French</option>
                                    <option value="German">German</option>
                                    <option value="Italian">Italian</option>
                                    <option value="Portuguese">Portuguese</option>
                                    <option value="Chinese">Chinese</option>
                                    <option value="Japanese">Japanese</option>
                                    <option value="Korean">Korean</option>
                                    <option value="Arabic">Arabic</option>
                                    <option value="Russian">Russian</option>
                                </select>
                            </div>

                            <div className="relative">
                                <label
                                    htmlFor="notes"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                >
                                    Your Notes
                                </label>
                                <div className="relative">
                                    <textarea
                                        id="notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Enter your notes here and our AI will generate flashcards in your selected language..."
                                        className="textarea min-h-[200px] w-full"
                                        disabled={isLoading}
                                    />
                                    {notes && (
                                        <button
                                            type="button"
                                            onClick={() => setNotes('')}
                                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                            aria-label="Clear notes"
                                            disabled={isLoading}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <motion.button
                                    onClick={generateFlashcards}
                                    disabled={isLoading}
                                    className={`btn btn-primary ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {isLoading ? (
                                        <>
                                            <svg
                                                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                ></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            Generating...
                                        </>
                                    ) : (
                                        'Generate Flashcards'
                                    )}
                                </motion.button>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    )
}