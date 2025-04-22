'use client'

import ChatInterface from './ui/ChatInterface'

interface ChatWindowProps {
    fileText?: string
}

export default function ChatWindow({ fileText }: ChatWindowProps) {
    return (
        <ChatInterface
            fileText={fileText}
            headerExtra={fileText && (
                <div className="ml-6 mt-1 text-xs text-green-600 dark:text-green-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 mr-1">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    Using uploaded document as context
                </div>
            )}
            initialAnimation={{ opacity: 0, x: fileText ? 20 : 0 }}
            inputPlaceholder={fileText ? "Type your question about the document..." : "Type your question..."}
            emptyStateMessage={fileText
                ? "I can help explain any part of your uploaded document. Try asking specific questions about it!"
                : "I can explain concepts, solve problems, suggest study techniques, and more."}
            showSuggestions={!fileText}
        />
    )
} 