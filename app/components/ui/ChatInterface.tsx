import { useState, useRef, useEffect, FormEvent, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Message } from 'ai'
import { useChat } from 'ai/react'
import { useAuth } from '../../hooks/useAuth'
import { MessageItem } from './MessageItem'
import { TypingIndicator } from './TypingIndicator'

export interface ChatInterfaceProps {
    fileText?: string
    headerExtra?: ReactNode
    emptyStateMessage?: string
    inputPlaceholder?: string
    initialAnimation?: {
        x?: number
        opacity?: number
        scale?: number
    }
    showSuggestions?: boolean
    suggestions?: string[]
}

export default function ChatInterface({
    fileText,
    headerExtra,
    emptyStateMessage = 'I can explain concepts, solve problems, suggest study techniques, and more.',
    inputPlaceholder = 'Type your question...',
    initialAnimation = { opacity: 0, x: 0 },
    showSuggestions = false,
    suggestions = [
        "What's Ohm's law?",
        "Explain photosynthesis",
        "Help me understand recursion",
        "Tips for better focus"
    ]
}: ChatInterfaceProps) {
    const [isTyping, setIsTyping] = useState(false)
    const [rateLimitInfo, setRateLimitInfo] = useState<{ error: string, remaining: number, retryAt?: Date } | null>(null)
    const [showError, setShowError] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const { user } = useAuth()

    const {
        messages,
        input,
        handleInputChange,
        handleSubmit,
        isLoading,
        error,
    } = useChat({
        api: '/api/ai/chat',
        body: fileText ? {
            fileContext: fileText,
        } : undefined,
        onFinish: () => {
            setIsTyping(false)
        },
        onError: (error) => {
            setIsTyping(false) // Explicitly stop typing animation on error

            // Check if it's a rate limit error (429)
            if (error.message?.includes('429') || error.message?.includes('rate limit')) {
                try {
                    const errorData = JSON.parse(error.message.replace('Error:', '').trim())

                    // Set retry time to 30 seconds from now (based on the rate limit window)
                    const retryAt = new Date(Date.now() + 30000)

                    setRateLimitInfo({
                        error: errorData.error,
                        remaining: errorData.remaining || 0,
                        retryAt: retryAt
                    })

                    // Show error with animation
                    setShowError(true)
                } catch (e) {
                    // If we can't parse the JSON, just show a generic rate limit message
                    setRateLimitInfo({
                        error: "Rate limit exceeded. Please try again later.",
                        remaining: 0,
                        retryAt: new Date(Date.now() + 30000)
                    })
                    setShowError(true)
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
            setShowError(false)
        }
    }, [input])

    // Countdown timer for rate limit
    useEffect(() => {
        if (!rateLimitInfo?.retryAt) return

        const interval = setInterval(() => {
            const now = new Date()
            if (now >= rateLimitInfo.retryAt!) {
                setRateLimitInfo(null)
                setShowError(false)
                clearInterval(interval)
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [rateLimitInfo])

    // Custom submit handler to show typing indicator
    const onSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (input.trim() === '') return

        // Don't submit if rate limited
        if (rateLimitInfo) return

        setIsTyping(true)
        setShowError(false)
        handleSubmit(e)
    }

    const handleSuggestionClick = (suggestion: string) => {
        // Don't allow suggestions if rate limited
        if (rateLimitInfo) return

        handleInputChange({ target: { value: suggestion } } as any)
        setTimeout(() => {
            const event = { preventDefault: () => { } } as FormEvent<HTMLFormElement>
            onSubmit(event)
        }, 100)
    }

    // Helper to format time remaining for rate limit
    const getTimeRemaining = () => {
        if (!rateLimitInfo?.retryAt) return '...'

        const now = new Date()
        const diffMs = rateLimitInfo.retryAt.getTime() - now.getTime()
        if (diffMs <= 0) return 'now'

        const diffSecs = Math.ceil(diffMs / 1000)
        return `${diffSecs} seconds`
    }

    return (
        <motion.div
            initial={initialAnimation}
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
                {headerExtra}
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
                            {emptyStateMessage}
                        </p>

                        {showSuggestions && (
                            <div className="mt-6 grid grid-cols-2 gap-2 w-full max-w-xs">
                                {suggestions.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className={`text-xs p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-colors
                                            ${rateLimitInfo ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                        disabled={!!rateLimitInfo}
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
                <AnimatePresence>
                    {rateLimitInfo && showError && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="flex justify-center"
                        >
                            <div className="max-w-3/4 rounded-lg px-4 py-3 bg-amber-50 text-amber-800 text-sm border border-amber-200 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-amber-600">
                                        <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-medium">Oops! Too many requests.</span>
                                    <button
                                        onClick={() => setShowError(false)}
                                        className="ml-auto text-amber-700 hover:text-amber-900"
                                        aria-label="Dismiss"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-amber-600">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>You can try again in <span className="font-medium">{getTimeRemaining()}</span></span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Other error message */}
                <AnimatePresence>
                    {error && !rateLimitInfo && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex justify-center"
                        >
                            <div className="max-w-3/4 rounded-lg px-4 py-3 bg-red-50 text-red-700 text-sm border border-red-200 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-600">
                                        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-medium">Something went wrong</span>
                                    <button
                                        onClick={() => setShowError(false)}
                                        className="ml-auto text-red-700 hover:text-red-900"
                                        aria-label="Dismiss"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                                <p className="mt-1 text-sm">Please try again or refresh the page.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div ref={messagesEndRef} />
            </div>

            {/* Chat input */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-3">
                <form onSubmit={onSubmit} className="flex space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        placeholder={rateLimitInfo ? "Rate limit reached. Please wait..." : inputPlaceholder}
                        className="flex-1 px-3 py-2 text-sm rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors"
                        disabled={isLoading || !!rateLimitInfo}
                    />
                    <button
                        type="submit"
                        className={`p-2 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all
                            ${isLoading || input.trim() === '' || !!rateLimitInfo
                                ? 'bg-gray-400 cursor-not-allowed opacity-50'
                                : 'bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800'}`}
                        disabled={isLoading || input.trim() === '' || !!rateLimitInfo}
                    >
                        {!!rateLimitInfo ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                        ) : (
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
                        )}
                    </button>
                </form>
                {rateLimitInfo && (
                    <div className="flex items-center justify-center gap-2 mt-2 text-xs text-amber-700 dark:text-amber-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Chat temporarily locked. Available again in {getTimeRemaining()}</span>
                    </div>
                )}
            </div>
        </motion.div>
    )
} 