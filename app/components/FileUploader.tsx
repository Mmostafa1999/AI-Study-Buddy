'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as mammoth from 'mammoth'

interface FileUploaderProps {
    onFileLoad: (fileText: string, fileName: string, fileSize: string) => void
    isLoading: boolean
}

export default function FileUploader({ onFileLoad, isLoading }: FileUploaderProps) {
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(false)

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0])
        }
    }

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0])
        }
    }

    const processFile = async (file: File) => {
        // Check file type
        const allowedTypes = [
            'application/pdf',
            'text/plain',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword'
        ]

        if (!allowedTypes.includes(file.type)) {
            alert('Please upload a PDF, TXT, or DOCX file')
            return
        }

        // Format file size
        const fileSize = formatFileSize(file.size)

        try {
            if (file.type.includes('wordprocessingml.document') || file.type === 'application/msword') {
                // For DOCX files, use mammoth
                const text = await extractTextFromDocx(file)
                onFileLoad(text, file.name, fileSize)
            } else if (file.type === 'application/pdf') {
                // For PDF files, check if it's likely a binary PDF that can't be read as text
                try {
                    const text = await extractTextFromTxt(file)

                    // Check if it contains PDF binary markers or looks like binary content
                    if (text.includes('%PDF') && (text.includes('endobj') || text.includes('stream') || text.includes('xref'))) {
                        // This is likely a binary PDF file with non-extractable text
                        onFileLoad(
                            "This PDF file contains binary data that cannot be properly extracted as text. " +
                            "Please use a PDF with selectable text content or convert your PDF to text format first.",
                            file.name,
                            fileSize
                        )
                    } else {
                        onFileLoad(text, file.name, fileSize)
                    }
                } catch (err) {
                    throw new Error("Failed to read PDF file")
                }
            } else {
                // For TXT files
                const text = await extractTextFromTxt(file)
                onFileLoad(text, file.name, fileSize)
            }
        } catch (err) {
            console.error('Error processing file:', err)
            alert('Error processing file. Please try again.')
        }
    }

    const extractTextFromDocx = async (file: File): Promise<string> => {
        return new Promise(async (resolve, reject) => {
            try {
                // Convert the File to an ArrayBuffer
                const arrayBuffer = await file.arrayBuffer()

                // Use mammoth to extract text
                const result = await mammoth.extractRawText({ arrayBuffer })
                resolve(result.value)
            } catch (error) {
                reject(error)
            }
        })
    }

    const extractTextFromTxt = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()

            reader.onload = (e) => {
                if (e.target?.result) {
                    resolve(e.target.result.toString())
                } else {
                    reject(new Error('Failed to read text file'))
                }
            }

            reader.onerror = () => {
                reject(new Error('Error reading file'))
            }

            reader.readAsText(file)
        })
    }

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' bytes'
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
        else return (bytes / 1048576).toFixed(1) + ' MB'
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className="w-full">
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging
                            ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10 shadow-lg scale-[1.02]'
                            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 hover:shadow-md'
                        }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileInputChange}
                        accept=".pdf,.txt,.docx,.doc"
                        disabled={isLoading}
                    />

                    <div className="flex flex-col items-center justify-center">
                        {isLoading ? (
                            <>
                                <div className="w-16 h-16 relative mb-4">
                                    <div className="w-full h-full rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin dark:border-primary-800 dark:border-t-primary-400"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="h-8 w-8 bg-white dark:bg-gray-800 rounded-full"></div>
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14"></path>
                                            <path d="M12 5v14"></path>
                                        </svg>
                                    </div>
                                </div>
                                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Processing document...</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">This may take a moment</p>
                            </>
                        ) : (
                            <>
                                <div className="mb-4 p-4 bg-primary-50 dark:bg-gray-800 rounded-full">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="w-12 h-12 text-primary-600 dark:text-primary-400"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                                        />
                                    </svg>
                                </div>

                                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                                    Upload your document
                                </h3>
                                <p className="text-base text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                                    Drag and drop your file here, or click this area to browse
                                </p>

                                <div className="flex flex-wrap justify-center gap-3 mb-4">
                                    {["PDF", "TXT", "DOCX"].map((format) => (
                                        <div key={format} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-md text-xs font-medium text-gray-600 dark:text-gray-300">
                                            {format}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        triggerFileInput();
                                    }}
                                    className="mt-2 px-4 py-2 bg-primary-100 hover:bg-primary-200 dark:bg-primary-900/30 dark:hover:bg-primary-800/40 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium transition-colors"
                                >
                                    Browse Files
                                </button>
                            </>
                        )}
                    </div>

                    {isDragging && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 flex items-center justify-center bg-primary-500/10 dark:bg-primary-600/20 backdrop-blur-[1px] rounded-xl z-10"
                        >
                            <div className="text-center bg-white dark:bg-gray-800 px-6 py-4 rounded-lg shadow-lg">
                                <div className="w-12 h-12 mx-auto bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                    </svg>
                                </div>
                                <p className="text-lg font-medium text-gray-900 dark:text-white">Drop your file here</p>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    )
} 