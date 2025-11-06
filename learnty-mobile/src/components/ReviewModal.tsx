import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, MessageSquare, X, Send, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import toast from 'react-hot-toast'

interface ReviewModalProps {
  onClose: () => void
  sessionType?: 'review' | 'quiz' | 'focus'
}

type SessionTypeInfo = {
  title: string
  description: string
  icon: string
}

const sessionTypeInfo: Record<string, SessionTypeInfo> = {
  review: {
    title: 'Spaced Review Session',
    description: 'Your spaced repetition practice',
    icon: '🧠'
  },
  quiz: {
    title: 'AI Quiz Session',
    description: 'Your knowledge assessment',
    icon: '🤖'
  },
  focus: {
    title: 'Focus Session',
    description: 'Your Pomodoro-style work session',
    icon: '⏱️'
  }
}

export default function ReviewModal({ onClose, sessionType = 'review' }: ReviewModalProps) {
  const { user } = useAuthStore()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) return
    
    setIsSubmitting(true)
    try {
      // Save feedback to localStorage for persistence
      if (user) {
        const feedbackData = {
          rating,
          feedback,
          sessionType,
          timestamp: new Date().toISOString(),
          userId: user.id
        }
        
        const existingFeedback = JSON.parse(
          localStorage.getItem(`learnty_user_feedback_${user.id}`) || '[]'
        )
        existingFeedback.push(feedbackData)
        localStorage.setItem(`learnty_user_feedback_${user.id}`, JSON.stringify(existingFeedback))
        
        // Mark as feedback submitted
        localStorage.setItem(`learnty_feedback_submitted_${user.id}`, 'true')
      }
      
      toast.success('Thank you for your feedback!')
      onClose()
      resetForm()
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setRating(0)
    setHoveredRating(0)
    setFeedback('')
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
      resetForm()
    }
  }

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1
      const isFilled = starValue <= (hoveredRating || rating)
      
      return (
        <motion.button
          key={starValue}
          type="button"
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`transition-all duration-200 ${
            isFilled ? 'text-yellow-400' : 'text-gray-300'
          }`}
        >
          <Star 
            className={`w-8 h-8 sm:w-10 sm:h-10 ${isFilled ? 'fill-current' : ''}`}
          />
        </motion.button>
      )
    })
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl max-w-md w-full mx-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground">Rate your {sessionTypeInfo[sessionType].title.toLowerCase()}</h2>
                <p className="text-sm text-muted-foreground">{sessionTypeInfo[sessionType].description}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-muted rounded-xl transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Rating Section */}
          <div className="mb-6">
            <p className="text-sm font-medium text-foreground mb-3 text-center">
              Rate your learning experience
            </p>
            <div className="flex justify-center gap-2 sm:gap-3">
              {renderStars()}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {rating === 0 ? 'Click to rate' : `${rating} out of 5 stars`}
            </p>
          </div>

          {/* Feedback Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Share your thoughts (optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What did you like? What could be improved?"
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm sm:text-base resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-gray-300 text-foreground rounded-xl font-medium hover:bg-muted transition-all disabled:opacity-50"
            >
              Skip
            </button>
            <motion.button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              whileHover={{ scale: rating > 0 ? 1.02 : 1 }}
              whileTap={{ scale: rating > 0 ? 0.98 : 1 }}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                rating > 0 
                  ? 'bg-primary text-primary-foreground hover:opacity-90' 
                  : 'bg-gray-200 text-muted-foreground'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="text-sm">Submit</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Helpful Tips */}
          <div className="mt-4 p-3 bg-blue-50 rounded-xl">
            <p className="text-xs text-blue-700 text-center">
              Your feedback helps us improve your learning experience!
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
