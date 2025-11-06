import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface BookLoaderProps {
  fullscreen?: boolean
}

export default function BookLoader({ fullscreen = false }: BookLoaderProps) {
  const [displayText, setDisplayText] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const fullText = 'Learnty'
  
  useEffect(() => {
    let currentIndex = 0
    let typingInterval: NodeJS.Timeout
    
    const typeText = () => {
      typingInterval = setInterval(() => {
        if (isTyping) {
          // Typing phase
          if (currentIndex <= fullText.length) {
            setDisplayText(fullText.slice(0, currentIndex))
            currentIndex++
          } else {
            // Pause before erasing
            setTimeout(() => setIsTyping(false), 1000)
            clearInterval(typingInterval)
          }
        } else {
          // Erasing phase
          if (currentIndex > 0) {
            currentIndex--
            setDisplayText(fullText.slice(0, currentIndex))
          } else {
            // Pause before typing again
            setTimeout(() => setIsTyping(true), 500)
            clearInterval(typingInterval)
          }
        }
      }, isTyping ? 150 : 100) // Type slower, erase faster
    }
    
    typeText()
    
    return () => clearInterval(typingInterval)
  }, [isTyping])

  const content = (
    <div className="flex flex-col items-center justify-center">
      {/* Typing/Erasing Animation - Responsive sizes */}
      <div className="flex items-center">
        <span 
          className="font-bold text-primary text-xl sm:text-2xl md:text-3xl"
        >
          {displayText}
        </span>
        <motion.span
          className="text-xl sm:text-2xl md:text-3xl text-primary ml-0.5 sm:ml-1"
          animate={{ opacity: [1, 0, 1] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: 'linear'
          }}
        >
          |
        </motion.span>
      </div>

      {/* Animated dots - Smaller and responsive */}
      <div className="flex gap-1 sm:gap-1.5 mt-2 sm:mt-3">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
    </div>
  )

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        {content}
      </div>
    )
  }

  return content
}

// Add gradient animation to global styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `
  document.head.appendChild(style)
}
