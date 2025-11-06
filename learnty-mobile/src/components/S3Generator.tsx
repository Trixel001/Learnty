import { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, Zap, Target, Clock, CheckCircle, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface S3GeneratorProps {
  book: any
  onSuccess?: () => void
  onClose?: () => void
}

export default function S3Generator({ book, onSuccess, onClose }: S3GeneratorProps) {
  const { user } = useAuthStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [generationResult, setGenerationResult] = useState<any>(null)

  const generateS3LearningPath = async () => {
    setIsGenerating(true)
    setProgress(0)
    setCurrentStep('Initializing S3 methodology...')

    try {
      // Step 1: Check if book chapters exist
      setProgress(20)
      setCurrentStep('Analyzing book structure...')
      
      const { data: chapters, error: chaptersError } = await supabase
        .from('book_chapters')
        .select('*')
        .eq('book_id', book.id)
        .order('chapter_number')

      if (chaptersError) throw chaptersError

      if (!chapters || chapters.length === 0) {
        throw new Error('No chapters found. Please ensure the book has been processed by AI first.')
      }

      // Step 2: Call S3 generation edge function
      setProgress(40)
      setCurrentStep('Generating micro-learning milestones...')

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-s3-milestones`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookId: book.id,
          userId: user?.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to generate learning path')
      }

      const data = await response.json()

      // Step 3: Process results
      setProgress(80)
      setCurrentStep('Creating learning structure...')

      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 1000))

      setProgress(100)
      setCurrentStep('Learning path created!')
      setGenerationResult(data.data)

      // Show success after brief delay
      setTimeout(() => {
        toast.success(`Generated ${data.data.milestonesCreated} learning milestones!`)
        if (onSuccess) onSuccess()
      }, 1000)

    } catch (error) {
      console.error('S3 generation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate learning path')
      setIsGenerating(false)
      setProgress(0)
      setCurrentStep('')
    }
  }

  const s3Benefits = [
    {
      icon: Brain,
      title: 'Cognitive Science Based',
      description: 'Follows proven learning principles for optimal retention'
    },
    {
      icon: Target,
      title: 'Micro-Learning Steps',
      description: 'Breaks complex topics into digestible 15-30 minute sessions'
    },
    {
      icon: Zap,
      title: 'Adaptive Difficulty',
      description: 'Adjusts based on your performance and learning speed'
    },
    {
      icon: Clock,
      title: 'Optimized Timing',
      description: 'Schedules reviews using spaced repetition algorithms'
    }
  ]

  if (generationResult) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-3xl p-8 shadow-xl max-w-2xl w-full"
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
                  {Math.round(generationResult.totalEstimatedMinutes / 60)}h
                </div>
                <div className="text-sm text-muted-foreground">Total Time</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">
                  {generationResult.srsCardsCreated}
                </div>
                <div className="text-sm text-muted-foreground">Study Cards</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600">
                  {generationResult.dependenciesCreated}
                </div>
                <div className="text-sm text-muted-foreground">Dependencies</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/learning-paths'}
              className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-medium flex items-center justify-center gap-2"
            >
              Start Learning Journey
              <ArrowRight className="w-5 h-5" />
            </motion.button>

            {onClose && (
              <button
                onClick={onClose}
                className="w-full text-muted-foreground py-2"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-3xl p-8 shadow-xl max-w-2xl w-full"
    >
      {!isGenerating ? (
        <>
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <Brain className="w-10 h-10 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Generate S3 Learning Path
            </h2>
            <p className="text-muted-foreground">
              Transform "{book.title}" into a structured learning journey using the 
              <span className="font-semibold text-primary"> Small Simple Steps</span> methodology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {s3Benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-muted rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                    <benefit.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground text-xs mt-1">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">What will be created:</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• 3-5 micro-milestones per chapter (15-30 min each)</li>
              <li>• Structured learning objectives and key concepts</li>
              <li>• Adaptive difficulty based on your progress</li>
              <li>• Spaced repetition cards for key concepts</li>
              <li>• Visual progress tracking and achievements</li>
            </ul>
          </div>

          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={generateS3LearningPath}
              className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-medium"
            >
              Generate Learning Path
            </motion.button>

            {onClose && (
              <button
                onClick={onClose}
                className="w-full text-muted-foreground py-2"
              >
                Cancel
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="text-center">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="w-10 h-10 text-primary-foreground" />
            </motion.div>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-4">
            Creating Your Learning Path
          </h2>
          <p className="text-muted-foreground mb-8">{currentStep}</p>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
            <motion.div
              className="bg-primary h-3 rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="text-sm text-muted-foreground">
            This may take 30-60 seconds as we analyze your book and generate personalized milestones...
          </div>
        </div>
      )}
    </motion.div>
  )
}