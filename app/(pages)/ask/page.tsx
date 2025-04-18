'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import ChatBox from '../../components/ChatBox'
import { useAuth } from '../../hooks/useAuth'

export default function AskPage() {
    const { user, loading } = useAuth()
    const router = useRouter()

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])

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
                        Ask AI Assistant
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Get answers to your study questions, explanations of concepts, and more
                    </p>
                </div>

                <ChatBox />

                <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    <p>
                        AI responses are generated to help with your studies. Always verify important information
                        with your course materials or instructors.
                    </p>
                </div>
            </motion.div>
        </div>
    )
} 