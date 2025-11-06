import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Sparkles, Target, Clock, CheckCircle, ArrowRight, X, Lightbulb } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface TopicLearningGeneratorProps {
  isOpen?: boolean
  onSuccess?: () => void
  onClose?: () => void
}

export default function TopicLearningGenerator({ isOpen: externalIsOpen, onSuccess, onClose }: TopicLearningGeneratorProps) {
  const { user } = useAuthStore()
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const setIsOpen = externalIsOpen !== undefined ? 
    () => {} : // External control - don't update internal state
    setInternalIsOpen
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [generationResult, setGenerationResult] = useState<any>(null)

  // Form state
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [detailLevel, setDetailLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate')
  const [estimatedHours, setEstimatedHours] = useState(2)
  const [learningGoals, setLearningGoals] = useState('')

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic to learn')
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setCurrentStep('Analyzing your learning request...')

    try {
      // Step 1: Validate input
      setProgress(20)
      setCurrentStep('Planning your learning journey...')

      await new Promise(resolve => setTimeout(resolve, 500))

      // Step 2: Call edge function
      setProgress(40)
      setCurrentStep('Generating personalized milestones...')

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-topic-learning-path`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topic,
          description,
          detailLevel,
          estimatedHours,
          learningGoals,
          userId: user?.id
        })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to generate learning path'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error?.message || errorMessage
        } catch {
          // If response is not JSON, use generic error
          errorMessage = 'Server error. Please try again in a moment.'
        }
        throw new Error(errorMessage)
      }

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        throw new Error('Invalid response from server. Please try again.')
      }

      // Step 3: Process results
      setProgress(80)
      setCurrentStep('Creating your learning structure...')

      await new Promise(resolve => setTimeout(resolve, 800))

      setProgress(100)
      setCurrentStep('Learning path created!')
      setGenerationResult(data.data)

      // Show success after brief delay
      setTimeout(() => {
        toast.success(`Generated ${data.data.milestonesCreated} learning milestones!`)
        setIsOpen(false)
        setIsGenerating(false)
        setProgress(0)
        resetForm()
        if (onSuccess) onSuccess()
      }, 1500)

    } catch (error) {
      console.error('Topic learning generation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate learning path')
      setIsGenerating(false)
      setProgress(0)
      setCurrentStep('')
    }
  }

  const resetForm = () => {
    setTopic('')
    setDescription('')
    setDetailLevel('intermediate')
    setEstimatedHours(2)
    setLearningGoals('')
    setGenerationResult(null)
  }

  const handleClose = () => {
    if (!isGenerating) {
      setIsOpen(false)
      resetForm()
      if (onClose) onClose()
    }
  }

  // Success result view
  if (generationResult) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-3xl p-8 shadow-xl max-w-2xl w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-primary-foreground" />
            </motion.div>

            <h2 className="text-2xl font-bold text-foreground mb-4">
              Learning Path Created!
            </h2>

            <div className="bg-muted rounded-2xl p-6 mb-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary">
                    {generationResult.milestonesCreated}
                  </div>
                  <div className="text-sm text-muted-foreground">Milestones</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">
                    {generationResult.estimatedHours}h
                  </div>
                  <div className="text-sm text-muted-foreground">Total Time</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-pink-600">
                    {generationResult.srsCardsCreated}
                  </div>
                  <div className="text-sm text-muted-foreground">Flashcards</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-600">
                    {generationResult.dependenciesCreated}
                  </div>
                  <div className="text-sm text-muted-foreground">Progression Steps</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              Start Learning <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-2xl font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg"
      >
        <Sparkles className="w-5 h-5" />
        Create Custom Learning Path
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl max-w-lg sm:max-w-xl md:max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-xl sm:rounded-2xl flex items-center justify-center">
                    <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                      Create Learning Path
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Turn any topic into a gamified learning journey
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isGenerating}
                  className="p-2 hover:bg-muted rounded-xl transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {isGenerating ? (
                /* Generation Progress */
                <div className="py-8">
                  <div className="text-center mb-6">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                      <Sparkles className="w-8 h-8 text-primary-foreground" />
                    </motion.div>
                    <p className="text-lg font-semibold text-foreground">{currentStep}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-2">{progress}%</p>
                </div>
              ) : (
                /* Input Form */
                <div className="space-y-6">
                  {/* Topic */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      What do you want to learn? *
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., Machine Learning, Piano Basics, Spanish Conversation..."
                      className="w-full px-4 py-3 border-2 border-border rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      What specifically do you want to know? (Optional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what aspects you're most interested in..."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  {/* Detail Level */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Detail Level
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                      {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setDetailLevel(level)}
                          className={`py-2.5 sm:py-3 px-2 sm:px-3 rounded-xl font-medium text-sm sm:text-base transition-all whitespace-nowrap overflow-hidden text-ellipsis ${
                            detailLevel === level
                              ? 'bg-primary text-primary-foreground shadow-lg'
                              : 'bg-muted text-gray-700 hover:bg-muted/80'
                          }`}
                        >
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Estimated Hours */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      How much time can you dedicate?
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="0.5"
                        value={estimatedHours}
                        onChange={(e) => setEstimatedHours(parseFloat(e.target.value))}
                        className="flex-1"
                      />
                      <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-xl min-w-[100px]">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-primary">{estimatedHours}h</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      We'll create ~{Math.floor(estimatedHours * 2)} milestones
                    </p>
                  </div>

                  {/* Learning Goals */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Your Learning Goals (Optional)
                    </label>
                    <textarea
                      value={learningGoals}
                      onChange={(e) => setLearningGoals(e.target.value)}
                      placeholder="What do you want to achieve? E.g., 'Build a simple project', 'Pass certification exam'..."
                      rows={2}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={!topic.trim() || isGenerating}
                    className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Target className="w-5 h-5" />
                    Generate Learning Path
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
