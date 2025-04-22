'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface FilePreviewProps {
    fileText: string
    fileName: string
    fileSize: string
    onClearFile: () => void
}

export default function FilePreview({ fileText, fileName, fileSize, onClearFile }: FilePreviewProps) {
    const [isCopied, setIsCopied] = useState(false)

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy text: ', err)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg h-full"
        >
            {/* File header */}
            <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col overflow-hidden">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center truncate">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4 mr-2 flex-shrink-0 text-primary-600 dark:text-primary-400"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                            />
                        </svg>
                        <span className="truncate">{fileName}</span>
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-6 truncate">{fileSize}</p>
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                    <button
                        onClick={() => copyToClipboard(fileText)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Copy all text"
                    >
                        {isCopied ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                            </svg>
                        )}
                    </button>
                    <button
                        onClick={onClearFile}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Clear file"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* File content */}
            <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200"
                >
                    {fileText.startsWith("This PDF file contains binary data") ? (
                        <div className="flex flex-col items-center justify-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-amber-500 mb-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                            <p className="text-amber-700 dark:text-amber-300 text-base font-medium mb-2">PDF Not Readable</p>
                            <p className="text-center text-sm">{fileText}</p>
                            <div className="mt-3 bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 w-full max-w-md">
                                <p className="font-semibold mb-1 text-sm text-gray-700 dark:text-gray-300">Alternatives:</p>
                                <ul className="list-disc list-inside space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                    <li>Use a PDF with selectable text</li>
                                    <li>Convert your PDF to text first using an online tool</li>
                                    <li>Try uploading a TXT or DOCX file instead</li>
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="max-h-full overflow-y-auto">
                            {fileText.split('\n').map((line, index) => (
                                <div key={index} className="py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                    {line || ' '}
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    )
} 