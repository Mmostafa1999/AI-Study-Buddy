'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface TypingIndicatorProps {
  isTyping: boolean
}

export function TypingIndicator({ isTyping }: TypingIndicatorProps) {
  return (
    <AnimatePresence>
      {isTyping && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="flex justify-start"
        >
          <div className="max-w-[85%] rounded-2xl px-3 py-2 shadow-sm bg-gray-100 dark:bg-gray-700">
            <div className="flex space-x-1">
              <motion.div
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  repeatType: 'loop',
                  delay: 0,
                }}
                className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-300"
              />
              <motion.div
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  repeatType: 'loop',
                  delay: 0.2,
                }}
                className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-300"
              />
              <motion.div
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  repeatType: 'loop',
                  delay: 0.4,
                }}
                className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-300"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 