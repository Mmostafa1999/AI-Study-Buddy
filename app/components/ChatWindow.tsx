'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useChat } from 'ai/react'
import { useAuth } from '../hooks/useAuth'
import { MessageItem } from './ui/MessageItem'
import { TypingIndicator } from './ui/TypingIndicator'

interface ChatWindowProps {
    fileText?: string
}

export default function ChatWindow({ fileText }: ChatWindowProps) {
    const [isTyping, setIsTyping] = useState(false)
    const [rateLimitInfo, setRateLimitInfo] = useState<{ error: string, remaining: number } | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const { user } = useAuth()
    const isChatOnly = !fileText

    const {
        messages,
        input,
        handleInputChange,
        handleSubmit,
        isLoading,
        error,
    } = useChat({
        api: '/api/ai/chat',
        body: {
            fileContext: fileText || '',
        },
        onFinish: () => {
            setIsTyping(false)
        },
        onError: (error) => {
            // Check if it's a rate limit error (429)
            if (error.message?.includes('429') || error.message?.includes('rate limit')) {
                try {
                    const errorData = JSON.parse(error.message.replace('Error:', '').trim())
                    setRateLimitInfo({
                        error: errorData.error,
                        remaining: errorData.remaining || 0
                    })
                } catch (e) {
                    // If we can't parse the JSON, just show a generic rate limit message
                    setRateLimitInfo({
                        error: "Rate limit exceeded. Please try again later.",
                        remaining: 0
                    })
                }
            }
        },
        headers: {
            'Authorization': `Bearer ${user?.uid || ''}`,
        },
    })

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Reset rate limit info when user types a new message
    useEffect(() => {
        if (input.trim() !== '') {
            setRateLimitInfo(null)
        }
    }, [input])

    // Custom submit handler to show typing indicator
    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (input.trim() === '') return
        setIsTyping(true)
        setRateLimitInfo(null)
        handleSubmit(e)
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: isChatOnly ? 0 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg h-full"
        >
            {/* Chat header */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4 mr-2 text-primary-600 dark:text-primary-400"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                        />
                    </svg>
                    AI Study Assistant
                </h2>
                {fileText && (
                    <div className="ml-6 mt-1 text-xs text-green-600 dark:text-green-400 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 mr-1">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                        Using uploaded document as context
                    </div>
                )}
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                            className="h-16 w-16 bg-primary-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-8 h-8 text-primary-600 dark:text-primary-400"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                                />
                            </svg>
                        </motion.div>
                        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
                            Ask me anything about your studies
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                            {fileText
                                ? "I can help explain any part of your uploaded document. Try asking specific questions about it!"
                                : "I can explain concepts, solve problems, suggest study techniques, and more."}
                        </p>

                        {isChatOnly && (
                            <div className="mt-6 grid grid-cols-2 gap-2 w-full max-w-xs">
                                {[
                                    "What's Ohm's law?",
                                    "Explain photosynthesis",
                                    "Help me understand recursion",
                                    "Tips for better focus"
                                ].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => {
                                            handleInputChange({ target: { value: suggestion } } as any);
                                            setTimeout(() => {
                                                const event = { preventDefault: () => { } } as React.FormEvent<HTMLFormElement>;
                                                handleSubmit(event);
                                            }, 100);
                                        }}
                                        className="text-xs p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    messages.map((message) => (
                        <MessageItem key={message.id} message={message} />
                    ))
                )}

                {/* Typing indicator */}
                <TypingIndicator isTyping={isTyping} />

                {/* Rate limit error message */}
                {rateLimitInfo && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-center"
                    >
                        <div className="max-w-3/4 rounded-lg px-3 py-2 bg-red-100 text-red-600 text-xs border border-red-200 shadow-sm">
                            <div className="flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                                </svg>
                                <span className="font-medium">{rateLimitInfo.error}</span>
                            </div>
                            <p className="mt-1 ml-5 text-xs">Please wait a moment before sending another message.</p>
                        </div>
                    </motion.div>
                )}

                {/* Other error message */}
                {error && !rateLimitInfo && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-center"
                    >
                        <div className="max-w-3/4 rounded-lg px-3 py-2 bg-red-100 text-red-600 text-xs">
                            Error: {error.message || 'Something went wrong. Please try again.'}
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Chat input */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-3">
                <form onSubmit={onSubmit} className="flex space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        placeholder={fileText ? "Type your question about the document..." : "Type your question..."}
                        className="flex-1 px-3 py-2 text-sm rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        disabled={isLoading || !!rateLimitInfo}
                    />
                    <button
                        type="submit"
                        className={`p-2 rounded-full bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-primary-700 dark:hover:bg-primary-800 transition-colors ${isLoading || input.trim() === '' || !!rateLimitInfo ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        disabled={isLoading || input.trim() === '' || !!rateLimitInfo}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                            />
                        </svg>
                    </button>
                </form>
                {rateLimitInfo && (
                    <div className="text-center mt-1 text-xs text-gray-500">
                        Input disabled due to rate limit. Please wait a moment.
                    </div>
                )}
            </div>
        </motion.div>
    )
} 