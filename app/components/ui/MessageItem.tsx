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
        className={`max-w-3/4 rounded-lg px-4 py-2 ${isUser
          ? 'bg-primary-600 text-white'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
          }`}
      >
        {message.role === 'assistant' ? (
          <div className="prose dark:prose-invert prose-sm">
            <Markdown>{message.content}</Markdown>
          </div>
        ) : (
          <div>{message.content}</div>
        )}
      </div>
    </motion.div>
  )
} 