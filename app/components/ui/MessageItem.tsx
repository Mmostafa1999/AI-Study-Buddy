'use client'

import { motion } from 'framer-motion'
import Markdown from 'react-markdown'
import { Message } from 'ai'

interface MessageItemProps {
  message: Message
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-sm ${isUser
          ? 'bg-primary-600 text-white'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
          }`}
      >
        {message.role === 'assistant' ? (
          <div className="prose dark:prose-invert prose-sm max-w-none">
            <Markdown>{message.content}</Markdown>
          </div>
        ) : (
          <div className="text-sm">{message.content}</div>
        )}
      </div>
    </motion.div>
  )
} 