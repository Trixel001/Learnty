import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { RotateCcw, Brain, CheckCircle, Trophy, Calendar, TrendingUp, Timer } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import { 
  calculateSM2, 
  calculateNextReviewDate, 
  getDueCards, 
  getConfidenceText, 
  sortCardsByDueDate,
  type SRSCard 
} from '@/lib/sm2Algorithm'
import { useReviewModal } from '@/hooks/useReviewModal'
import ReviewModal from '@/components/ReviewModal'
import toast from 'react-hot-toast'

export default function Review() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { shouldShowReview, showReviewModal, triggerReview, hideReviewModal } = useReviewModal()
  const [allCards, setAllCards] = useState<SRSCard[]>([])
  const [dueCards, setDueCards] = useState<SRSCard[]>([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [reviewingMode, setReviewingMode] = useState(false)
  const [stats, setStats] = useState({
    totalCards: 0,
    dueToday: 0,
    reviewedToday: 0,
    averageEase: 0
  })

  useEffect(() => {
    if (user) {
      fetchCards()
      fetchTodayStats()
    }
  }, [user])

  const fetchCards = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('srs_cards')
        .select('*')
        .eq('user_id', user?.id)
        .order('next_review', { ascending: true })

      if (error) throw error

      const cards = data || []
      setAllCards(cards)
      
      // Get cards due for review
      const due = getDueCards(cards)
      setDueCards(due)
      
      // Update stats
      const totalEase = cards.reduce((sum, card) => sum + card.ease_factor, 0)
      setStats(prev => ({
        ...prev,
        totalCards: cards.length,
        dueToday: due.length,
        averageEase: cards.length > 0 ? totalEase / cards.length : 0
      }))
    } catch (error) {
      console.error('Error fetching cards:', error)
      toast.error('Failed to load review cards')
    } finally {
      setLoading(false)
    }
  }

  const fetchTodayStats = async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('learning_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('session_type', 'review')
        .gte('created_at', today.toISOString())

      if (error) throw error
      setStats(prev => ({ ...prev, reviewedToday: data?.length || 0 }))
    } catch (error) {
      console.error('Error fetching today stats:', error)
    }
  }

  const handleStartReview = () => {
    if (dueCards.length === 0) {
      toast.error('No cards due for review')
      return
    }
    setReviewingMode(true)
    setCurrentCardIndex(0)
    setShowAnswer(false)
  }

  const handleCardRating = async (quality: number) => {
    const currentCard = dueCards[currentCardIndex]
    if (!currentCard) return

    try {
      // Calculate new SM-2 values
      const sm2Result = calculateSM2(
        quality,
        currentCard.ease_factor,
        currentCard.interval_days,
        currentCard.review_count
      )

      const nextReviewDate = calculateNextReviewDate(sm2Result.interval)

      // Update card in database
      const { error: updateError } = await supabase
        .from('srs_cards')
        .update({
          ease_factor: sm2Result.easeFactor,
          interval_days: sm2Result.interval,
          review_count: sm2Result.repetitions,
          next_review: nextReviewDate.toISOString(),
          confidence_level: quality
        })
        .eq('id', currentCard.id)

      if (updateError) throw updateError

      // Record learning session
      await supabase
        .from('learning_sessions')
        .insert({
          user_id: user?.id,
          milestone_id: currentCard.milestone_id,
          session_type: 'review',
          duration_minutes: 0,
          completion_percentage: 100,
          performance_score: quality * 20
        })

      // Move to next card or finish
      if (currentCardIndex < dueCards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1)
        setShowAnswer(false)
        toast.success('Progress saved!')
      } else {
        // Review session complete
        toast.success('Review session complete!')
        setReviewingMode(false)
        fetchCards()
        fetchTodayStats()
        
        // Trigger review modal after completing the first review session
        triggerReview()
      }
    } catch (error) {
      console.error('Error updating card:', error)
      toast.error('Failed to save progress')
    }
  }

  const currentCard = dueCards[currentCardIndex]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (reviewingMode && currentCard) {
    return (
      <div className="min-h-screen pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border-b border-border px-6 pt-12 pb-8 rounded-b-3xl shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setReviewingMode(false)}
              className="text-muted-foreground text-sm"
            >
              Exit Review
            </button>
            <div className="text-foreground text-sm">
              {currentCardIndex + 1} / {dueCards.length}
            </div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentCardIndex + 1) / dueCards.length) * 100}%` }}
              className="bg-white h-2 rounded-full"
            />
          </div>
        </motion.div>

        {/* Card */}
        <div className="px-6 mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCard.id}
              initial={{ opacity: 0, rotateY: 90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -90 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-3xl p-8 shadow-xl min-h-[400px] flex flex-col justify-center"
            >
              <div className="text-sm text-muted-foreground mb-4 text-center">
                {showAnswer ? 'Answer' : 'Question'}
              </div>
              
              <div className="flex-1 flex items-center justify-center text-center">
                <p className="text-xl font-medium text-foreground">
                  {showAnswer ? currentCard.answer : currentCard.question}
                </p>
              </div>

              {!showAnswer ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAnswer(true)}
                  className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-medium mt-6"
                >
                  Show Answer
                </motion.button>
              ) : (
                <div className="space-y-3 mt-6">
                  <p className="text-sm text-muted-foreground text-center mb-4">How well did you recall this?</p>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <motion.button
                      key={rating}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleCardRating(rating)}
                      className={`w-full py-3 rounded-xl font-medium transition-colors ${
                        rating <= 2
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : rating === 3
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {getConfidenceText(rating)}
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    )
  }

  // Dashboard view
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border-b border-border px-6 pt-12 pb-8 rounded-b-3xl shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
            <RotateCcw className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Spaced Review</h1>
            <p className="text-muted-foreground text-sm">Active recall practice</p>
          </div>
        </div>
      </motion.div>

      <div className="px-6 mt-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-4 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Due Today</span>
            </div>
            <div className="text-3xl font-bold text-primary">{stats.dueToday}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-4 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Reviewed</span>
            </div>
            <div className="text-3xl font-bold text-primary">{stats.reviewedToday}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-4 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total Cards</span>
            </div>
            <div className="text-3xl font-bold text-primary">{stats.totalCards}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-4 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-muted-foreground">Avg Ease</span>
            </div>
            <div className="text-3xl font-bold text-orange-600">{stats.averageEase.toFixed(1)}</div>
          </motion.div>
        </div>

        {/* Start Review Button and Focus Timer */}
        {stats.dueToday > 0 ? (
          <div className="space-y-3">
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartReview}
              className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-medium shadow-lg flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Start Review Session ({stats.dueToday} cards)
            </motion.button>
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/focus')}
              className="w-full bg-primary text-primary-foreground py-3 rounded-2xl font-medium shadow-lg flex items-center justify-center gap-2"
            >
              <Timer className="w-5 h-5" />
              Start with Focus Timer
            </motion.button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 shadow-lg text-center"
          >
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground">No cards due for review right now. Come back later.</p>
          </motion.div>
        )}

        {/* Upcoming Reviews */}
        {allCards.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-foreground mb-4">Upcoming Reviews</h3>
            <div className="space-y-3">
              {sortCardsByDueDate(allCards).slice(0, 5).map((card, index) => {
                const dueDate = new Date(card.next_review)
                const isOverdue = dueDate < new Date()
                
                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {card.question}
                      </p>
                      <p className={`text-xs ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {isOverdue ? 'Overdue' : `Due ${dueDate.toLocaleDateString()}`}
                      </p>
                    </div>
                    {isOverdue && (
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <ReviewModal
          onClose={hideReviewModal}
          sessionType="review"
        />
      )}
    </div>
  )
}
