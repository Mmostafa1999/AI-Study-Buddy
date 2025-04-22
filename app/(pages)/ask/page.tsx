'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import ChatWindow from '../../components/ChatWindow'
import FilePreview from '../../components/FilePreview'
import FileUploader from '../../components/FileUploader'

export default function AskPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [fileText, setFileText] = useState<string>('')
    const [fileName, setFileName] = useState<string>('')
    const [fileSize, setFileSize] = useState<string>('')
    const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false)
    const [activeTab, setActiveTab] = useState<'chat' | 'document'>('chat')

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])

    const handleFileLoad = (text: string, name: string, size: string) => {
        setIsProcessingFile(true)
        // Simulate file processing delay
        setTimeout(() => {
            setFileText(text)
            setFileName(name)
            setFileSize(size)
            setIsProcessingFile(false)
            setActiveTab('document')
        }, 500)
    }

    const handleClearFile = () => {
        setFileText('')
        setFileName('')
        setFileSize('')
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
        <div className="container mx-auto px-4 py-6 pt-16 min-h-[calc(100vh-4rem)] flex flex-col">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col flex-grow pt-8"
            >
                <div className="mb-6 text-center">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Ask AI Assistant
                    </h1>
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Get instant answers to your study questions. Choose to chat directly or upload a document for context.
                    </p>
                </div>

                {/* Mode tabs */}
                <div className="flex justify-center mb-6">
                    <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex w-full max-w-xs shadow-sm">
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`flex-1 px-4 py-2 rounded-md font-medium transition-all text-sm ${activeTab === 'chat'
                                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            <div className="flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                                Chat Only
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('document')}
                            className={`flex-1 px-4 py-2 rounded-md font-medium transition-all text-sm ${activeTab === 'document'
                                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            <div className="flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                With Document
                            </div>
                        </button>
                    </div>
                </div>

                <div className="flex-grow flex flex-col">
                    <AnimatePresence mode="wait">
                        {activeTab === 'chat' && (
                            <motion.div
                                key="chat-only"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="flex-grow max-w-3xl mx-auto w-full"
                            >
                                <div className="h-[calc(100vh-14rem)] md:h-[calc(100vh-16rem)] flex flex-col">
                                    <ChatWindow fileText="" />
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'document' && (
                            <motion.div
                                key="document-mode"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="flex-grow"
                            >
                                {!fileText ? (
                                    <div className="max-w-2xl mx-auto mb-4 flex-grow flex items-center justify-center">
                                        <FileUploader onFileLoad={handleFileLoad} isLoading={isProcessingFile} />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-grow h-[calc(100vh-16rem)] md:h-[calc(100vh-18rem)]">
                                        {/* Left panel - File Preview */}
                                        <div className="h-full min-h-0 flex flex-col">
                                            <FilePreview
                                                fileText={fileText}
                                                fileName={fileName}
                                                fileSize={fileSize}
                                                onClearFile={handleClearFile}
                                            />
                                        </div>

                                        {/* Right panel - Chat */}
                                        <div className="h-full min-h-0 flex flex-col">
                                            <ChatWindow fileText={fileText} />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400 py-4">
                    <p>
                        AI responses are generated to help with your studies. Always verify important information
                        with your course materials or instructors.
                    </p>
                </div>
            </motion.div>
        </div>
    )
} 