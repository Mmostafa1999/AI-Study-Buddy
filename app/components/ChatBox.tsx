'use client'

import ChatInterface from './ui/ChatInterface'

export default function ChatBox() {
    return (
        <div className="h-[80vh] max-h-[800px]">
            <ChatInterface
                initialAnimation={{ opacity: 0, scale: 0.8 }}
                showSuggestions={true}
            />
        </div>
    )
} 