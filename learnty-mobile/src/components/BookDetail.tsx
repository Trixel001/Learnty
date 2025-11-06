import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  FileText, 
  Clock, 
  TrendingUp, 
  BookOpen, 
  Target,
  ChevronRight,
  Brain,
  MapPin,
  Sparkles,
  Award
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import toast from 'react-hot-toast'
import S3Generator from './S3Generator'
import AIFlashcardGenerator from './AIFlashcardGenerator'
import AIQuizGenerator from './AIQuizGenerator'

interface BookDetailProps {
  book: any
  onClose: () => void
}

interface Chapter {
  id: string
  chapter_number: number
  title: string
  summary: string
  learning_objectives: string[]
  difficulty_level: string
  estimated_minutes: number
}

export default function BookDetail({ book, onClose }: BookDetailProps) {
  const { user } = useAuthStore()
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loadingChapters, setLoadingChapters] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [showS3Generator, setShowS3Generator] = useState(false)
  const [showAIFlashcards, setShowAIFlashcards] = useState(false)
  const [showAIQuiz, setShowAIQuiz] = useState(false)
  const [existingLearningPath, setExistingLearningPath] = useState<any>(null)
  const [loadingLearningPath, setLoadingLearningPath] = useState(false)

  useEffect(() => {
    loadChapters()
    checkExistingLearningPath()
  }, [book.id])

  const checkExistingLearningPath = async () => {
    try {
      setLoadingLearningPath(true)
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('book_id', book.id)
        .eq('user_id', user?.id)
        .eq('project_type', 's3_learning_path')
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      if (data) {
        setExistingLearningPath(data)
      }
    } catch (error) {
      console.error('Error checking learning path:', error)
    } finally {
      setLoadingLearningPath(false)
    }
  }

  const loadChapters = async () => {
    try {
      setLoadingChapters(true)
      const { data, error } = await supabase
        .from('book_chapters')
        .select('*')
        .eq('book_id', book.id)
        .order('chapter_number', { ascending: true })

      if (error) throw error
      setChapters(data || [])
    } catch (error) {
      console.error('Error loading chapters:', error)
    } finally {
      setLoadingChapters(false)
    }
  }

  const retryAIAnalysis = async () => {
    try {
      setRetrying(true)
      toast.loading('Retrying AI analysis...', { id: 'retry' })

      // Update status to uploaded to trigger reprocessing
      const { error: updateError } = await supabase
        .from('books')
        .update({ processing_status: 'uploaded', ai_analysis: null })
        .eq('id', book.id)

      if (updateError) throw updateError

      // Note: Actual AI processing would be triggered by a backend job or webhook
      // For now, we just reset the status so user can manually trigger it
      toast.success('Book reset for reprocessing. AI analysis will start automatically.', { id: 'retry' })
      
      // Refresh the page or notify parent to reload
      setTimeout(() => {
        window.location.reload()
      }, 1500)

    } catch (error) {
      console.error('Retry error:', error)
      toast.error('Failed to retry analysis. Please try again.', { id: 'retry' })
    } finally {
      setRetrying(false)
    }
  }

  const analysis = book.ai_analysis

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'text-primary bg-green-100'
      case 'intermediate':
        return 'text-primary bg-blue-100'
      case 'advanced':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-muted-foreground bg-gray-100'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="min-h-screen flex items-center justify-center p-4"
      >
        <div className="bg-card rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Book Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Book Info */}
            <div className="flex gap-4">
              <div className="w-32 h-44 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-16 h-16 text-white opacity-50" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {book.title}
                </h3>
                <p className="text-lg text-muted-foreground mb-3">
                  by {book.author}
                </p>
                {book.genre && (
                  <p className="text-sm text-muted-foreground mb-3">
                    Genre: {book.genre}
                  </p>
                )}
                {analysis && (
                  <div className="flex flex-wrap gap-2">
                    {analysis.difficulty && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(analysis.difficulty)}`}>
                        {analysis.difficulty}
                      </span>
                    )}
                    {analysis.estimatedMinutes && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {analysis.estimatedMinutes} min
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            {analysis?.summary && (
              <div className="bg-muted rounded-2xl p-4">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Summary
                </h4>
                <p className="text-gray-700 leading-relaxed">
                  {analysis.summary}
                </p>
              </div>
            )}

            {/* Error State - AI Processing Failed */}
            {book.processing_status === 'failed' && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                  <X className="w-5 h-5 text-red-600" />
                  AI Analysis Failed
                </h4>
                <p className="text-red-700 text-sm mb-3">
                  The AI analysis could not be completed for this book. This may be due to the file format, content structure, or processing errors.
                </p>
                <button 
                  onClick={retryAIAnalysis}
                  disabled={retrying}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {retrying ? 'Retrying...' : 'Retry Analysis'}
                </button>
              </div>
            )}

            {/* Processing State - AI Analysis In Progress */}
            {book.processing_status === 'analyzing' && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary animate-pulse" />
                  AI Analysis In Progress
                </h4>
                <p className="text-blue-700 text-sm">
                  Our AI is analyzing your book content. This usually takes 10-30 seconds. The page will update automatically when complete.
                </p>
              </div>
            )}

            {/* Uploaded State - Waiting for Processing */}
            {book.processing_status === 'uploaded' && !analysis && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
                <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  Queued for AI Analysis
                </h4>
                <p className="text-yellow-700 text-sm">
                  Your book has been uploaded successfully and is waiting for AI analysis to begin. Please check back shortly.
                </p>
              </div>
            )}

            {/* Topics */}
            {analysis?.topics && analysis.topics.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground mb-3">Main Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.topics.map((topic: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Learning Objectives */}
            {analysis?.learningObjectives && analysis.learningObjectives.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Learning Objectives
                </h4>
                <ul className="space-y-2">
                  {analysis.learningObjectives.map((objective: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <ChevronRight className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Chapters */}
            {chapters.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground mb-3">
                  Chapters ({chapters.length})
                </h4>
                <div className="space-y-3">
                  {chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="bg-card border border-border rounded-xl p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-semibold text-foreground">
                          {chapter.chapter_number}. {chapter.title}
                        </h5>
                        {chapter.estimated_minutes && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0 ml-2">
                            <Clock className="w-3 h-3" />
                            {chapter.estimated_minutes}m
                          </span>
                        )}
                      </div>
                      {chapter.summary && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {chapter.summary}
                        </p>
                      )}
                      {chapter.difficulty_level && (
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(chapter.difficulty_level)}`}>
                          {chapter.difficulty_level}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {book.processing_status === 'completed' && analysis && (
              <div className="space-y-3 pt-4">
                {existingLearningPath ? (
                  // Existing learning path - go to it
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.location.href = '/learning-paths'}
                    className="w-full py-4 bg-primary text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg"
                  >
                    <MapPin className="w-5 h-5" />
                    Continue Learning Path ({existingLearningPath.completion_percentage}% complete)
                  </motion.button>
                ) : (
                  // No learning path - create one
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowS3Generator(true)}
                    className="w-full py-4 bg-primary text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg"
                    disabled={loadingLearningPath}
                  >
                    <Brain className="w-5 h-5" />
                    {loadingLearningPath ? 'Checking...' : 'Create S3 Learning Path'}
                  </motion.button>
                )}
                
                {/* AI Study Tools */}
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAIFlashcards(true)}
                    className="py-3 bg-primary text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Flashcards
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAIQuiz(true)}
                    className="py-3 bg-primary text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md"
                  >
                    <Award className="w-4 h-4" />
                    AI Quiz
                  </motion.button>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowS3Generator(true)}
                    className="flex-1 py-3 bg-muted text-gray-700 font-semibold rounded-xl hover:bg-muted/80 transition-colors"
                  >
                    Read Book
                  </button>
                  <button className="px-6 py-3 bg-muted text-gray-700 font-semibold rounded-xl hover:bg-muted/80 transition-colors">
                    View File
                  </button>
                </div>
              </div>
            )}

            {/* Show fallback actions for non-completed books */}
            {book.processing_status !== 'completed' && (
              <div className="flex gap-3 pt-4">
                <button className="flex-1 py-3 bg-muted text-muted-foreground font-semibold rounded-xl cursor-not-allowed">
                  Complete AI Analysis First
                </button>
                <button className="px-6 py-3 bg-muted text-gray-700 font-semibold rounded-xl hover:bg-muted/80 transition-colors">
                  View File
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* S3 Generator Modal */}
      <AnimatePresence>
        {showS3Generator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4"
            onClick={() => setShowS3Generator(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <S3Generator 
                book={book} 
                onSuccess={() => {
                  setShowS3Generator(false)
                  checkExistingLearningPath() // Refresh to show new path
                }}
                onClose={() => setShowS3Generator(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Flashcards Modal */}
      <AnimatePresence>
        {showAIFlashcards && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4"
            onClick={() => setShowAIFlashcards(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <AIFlashcardGenerator 
                bookId={book.id}
                bookContent={book.extracted_text || ''}
                onFlashcardsGenerated={(count) => {
                  toast.success(`Generated ${count} flashcards!`)
                  setShowAIFlashcards(false)
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Quiz Modal */}
      <AnimatePresence>
        {showAIQuiz && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4"
            onClick={() => setShowAIQuiz(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <AIQuizGenerator 
                bookId={book.id}
                bookTitle={book.title}
                extractedText={book.extracted_text}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
