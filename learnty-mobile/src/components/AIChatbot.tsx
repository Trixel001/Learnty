import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIChatbotProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right'
  isOpen?: boolean
  onClose?: () => void
  onOpen?: () => void
}

export default function AIChatbot({ 
  position = 'bottom-right', 
  isOpen: externalIsOpen, 
  onClose,
  onOpen 
}: AIChatbotProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  
  // Properly handle controlled vs uncontrolled state
  const isControlled = externalIsOpen !== undefined
  const isOpen = isControlled ? externalIsOpen : internalIsOpen
  
  const handleOpen = () => {
    if (isControlled) {
      onOpen?.()
    } else {
      setInternalIsOpen(true)
    }
  }
  
  const handleClose = () => {
    if (isControlled) {
      onClose?.()
    } else {
      setInternalIsOpen(false)
    }
  }

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your learning assistant. I can help you understand concepts, explain features, and guide you through your learning journey. How can I help you today?",
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    // Validate environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl) {
      toast.error('Configuration error: Missing Supabase URL')
      console.error('VITE_SUPABASE_URL is not defined')
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const session = await supabase.auth.getSession()
      const accessToken = session?.data?.session?.access_token
      
      if (!accessToken) {
        throw new Error('Please sign in to use the AI assistant')
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/ai-chatbot`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: inputMessage,
            conversationHistory: messages.slice(-6) // Send last 6 messages for context
          })
        }
      )

      if (!response.ok) {
        let errorMessage = 'Failed to get response from AI'
        
        // Safely try to parse error response
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          try {
            const errorData = await response.json()
            errorMessage = errorData?.error?.message || errorData?.message || errorMessage
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError)
          }
        } else {
          // Non-JSON error response
          errorMessage = `Server error (${response.status}): ${response.statusText}`
        }
        
        throw new Error(errorMessage)
      }

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Failed to parse chatbot response:', parseError)
        throw new Error('Invalid response from AI. Please try again.')
      }
      
      // Safe access to nested response data
      const responseContent = data?.data?.response
      if (!responseContent) {
        throw new Error('AI response is empty. Please try again.')
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to get AI response'
      toast.error(errorMsg)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I couldn't process that request. Please try again.",
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Responsive positioning based on props
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-24 sm:bottom-24 left-4 sm:left-6'
      case 'top-right':
        return 'top-4 sm:top-6 right-4 sm:right-6'
      case 'bottom-right':
      default:
        // Position above the 4-tab nav which is at bottom-0
        return 'bottom-24 right-4 sm:right-6'
    }
  }

  // Chat window positioning to avoid going off-screen
  const getChatWindowClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-40 sm:bottom-40 left-4 sm:left-6'
      case 'top-right':
        return 'top-16 sm:top-20 right-4 sm:right-6'
      case 'bottom-right':
      default:
        // Position window above the chatbot button (which is at bottom-24)
        return 'bottom-40 right-4 sm:right-6'
    }
  }

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleOpen}
            className={`fixed ${getPositionClasses()} z-40 w-12 h-12 sm:w-14 sm:h-14 bg-primary rounded-full shadow-lg flex items-center justify-center`}
          >
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed ${getChatWindowClasses()} z-50 w-[90vw] sm:w-[400px] md:w-[450px] max-w-md h-[65vh] sm:h-[550px] md:h-[600px] max-h-[80vh] bg-card rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden`}
          >
            {/* Header */}
            <div className="bg-primary px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm sm:text-base">AI Learning Assistant</h3>
                  <p className="text-white/80 text-xs hidden sm:block">Always here to help</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-muted">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-foreground shadow-md'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-3 h-3 text-primary" />
                        <span className="text-xs font-medium text-primary">AI Assistant</span>
                      </div>
                    )}
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                    <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-white/70' : 'text-muted-foreground'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-card rounded-2xl px-4 py-3 shadow-md">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-3 sm:p-4 bg-card">
              <div className="flex items-end gap-2">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  disabled={isLoading}
                  className="flex-1 resize-none border border-border rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 max-h-24 sm:max-h-32 disabled:opacity-50"
                  rows={1}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="w-9 h-9 sm:w-10 sm:h-10 bg-primary rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
