import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'

export interface ReviewModalState {
  shouldShowReview: boolean
  showReviewModal: boolean
  triggerReview: () => void
  hideReviewModal: () => void
  resetReviewState: () => void
}

/**
 * Custom hook to manage review modal state and trigger logic
 * Ensures the review modal only appears once after the first completed learning session
 */
export function useReviewModal(): ReviewModalState {
  const { user } = useAuthStore()
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)

  // Check if user has already submitted feedback on component mount
  useEffect(() => {
    if (user) {
      const feedbackSubmitted = localStorage.getItem(`learnty_feedback_submitted_${user.id}`)
      setHasSubmittedFeedback(feedbackSubmitted === 'true')
    }
  }, [user])

  // Show review modal automatically if conditions are met
  const showReviewAutomatically = () => {
    if (user && !hasSubmittedFeedback && !showReviewModal) {
      // Small delay to ensure the completion UI has rendered
      setTimeout(() => {
        setShowReviewModal(true)
      }, 1500)
    }
  }

  // Manually trigger review modal
  const triggerReview = () => {
    if (user && !hasSubmittedFeedback && !showReviewModal) {
      setShowReviewModal(true)
    }
  }

  // Hide review modal
  const hideReviewModal = () => {
    setShowReviewModal(false)
  }

  // Mark feedback as submitted
  const handleFeedbackSubmitted = () => {
    if (user) {
      localStorage.setItem(`learnty_feedback_submitted_${user.id}`, 'true')
      setHasSubmittedFeedback(true)
    }
  }

  // Reset review state (for testing or debugging)
  const resetReviewState = () => {
    if (user) {
      localStorage.removeItem(`learnty_feedback_submitted_${user.id}`)
      setHasSubmittedFeedback(false)
    }
    setShowReviewModal(false)
  }

  return {
    shouldShowReview: !hasSubmittedFeedback,
    showReviewModal,
    triggerReview: showReviewAutomatically, // Default behavior is to show automatically
    hideReviewModal,
    resetReviewState
  }
}