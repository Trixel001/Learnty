import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft,
  FileText, 
  Clock, 
  TrendingUp, 
  BookOpen, 
  Target,
  ChevronRight,
  Brain,
  MapPin,
  Sparkles,
  Award,
  X
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import toast from 'react-hot-toast'
import S3Generator from '@/components/S3Generator'
import AIFlashcardGenerator from '@/components/AIFlashcardGenerator'
import AIQuizGenerator from '@/components/AIQuizGenerator'

interface Chapter {
  id: string
  chapter_number: number
  title: string
  summary: string
  learning_objectives: string[]
  difficulty_level: string
  estimated_minutes: number
}

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [book, setBook] = useState<any>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showS3Generator, setShowS3Generator] = useState(false)
  const [showAIFlashcards, setShowAIFlashcards] = useState(false)
  const [showAIQuiz, setShowAIQuiz] = useState(false)
  const [existingLearningPath, setExistingLearningPath] = useState<any>(null)
  const [loadingLearningPath, setLoadingLearningPath] = useState(false)

  useEffect(() => {
    if (id) {
      loadBookDetails()
    }
  }, [id])

  const loadBookDetails = async () => {
    try {
      setLoading(true)
      
      // Load book details
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single()

      if (bookError) throw bookError
      setBook(bookData)

      // Load chapters
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('book_chapters')
        .select('*')
        .eq('book_id', id)
        .order('chapter_number', { ascending: true })

      if (chaptersError) throw chaptersError
      setChapters(chaptersData || [])

      // Check for existing learning path
      await checkExistingLearningPath(bookData)
      
    } catch (error) {
      console.error('Error loading book details:', error)
      toast.error('Failed to load book details')
    } finally {
      setLoading(false)
    }
  }

  const checkExistingLearningPath = async (bookData: any) => {
    try {
      setLoadingLearningPath(true)
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('book_id', bookData.id)
        .eq('user_id', user?.id)
        .eq('project_type', 's3_learning_path')
        .single()

      if (error && error.code !== 'PGRST116') {
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

      toast.success('Book reset for reprocessing. AI analysis will start automatically.', { id: 'retry' })
      
      // Refresh the page
      setTimeout(() => {
        loadBookDetails()
      }, 1500)

    } catch (error) {
      console.error('Retry error:', error)
      toast.error('Failed to retry analysis. Please try again.', { id: 'retry' })
    } finally {
      setRetrying(false)
    }
  }

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

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BookOpen },
    { key: 'learn', label: 'Learn (S3)', icon: Brain },
    { key: 'tools', label: 'Study Tools', icon: Sparkles }
  ]

  const analysis = book?.ai_analysis

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <h1 className="text-xl font-bold text-foreground mb-2">Book Not Found</h1>
        <p className="text-muted-foreground mb-4">The book you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/library')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
        >
          Back to Library
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 sm:px-6 pt-8 sm:pt-12 pb-6 sm:pb-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/library')}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary rounded-full flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{book.title}</h1>
            <p className="text-muted-foreground text-sm sm:text-base">by {book.author}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <motion.button
                key={tab.key}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === tab.key 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 mt-4 sm:mt-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Book Info */}
            <div className="flex gap-4">
              <div className="w-32 h-44 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-16 h-16 text-primary-foreground opacity-50" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {book.title}
                </h2>
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
                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Summary
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {analysis.summary}
                </p>
              </div>
            )}

            {/* Error State */}
            {book.processing_status === 'failed' && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                  <X className="w-5 h-5 text-red-600" />
                  AI Analysis Failed
                </h3>
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

            {/* Processing State */}
            {book.processing_status === 'analyzing' && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary animate-pulse" />
                  AI Analysis In Progress
                </h3>
                <p className="text-blue-700 text-sm">
                  Our AI is analyzing your book content. This usually takes 10-30 seconds. The page will update automatically when complete.
                </p>
              </div>
            )}

            {/* Topics */}
            {analysis?.topics && analysis.topics.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground mb-3">Main Topics</h3>
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
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Learning Objectives
                </h3>
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
                <h3 className="font-semibold text-foreground mb-3">
                  Chapters ({chapters.length})
                </h3>
                <div className="space-y-3">
                  {chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="bg-card border border-border rounded-xl p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-foreground">
                          {chapter.chapter_number}. {chapter.title}
                        </h4>
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
          </div>
        )}

        {activeTab === 'learn' && (
          <div className="space-y-6">
            {book.processing_status === 'completed' && analysis && (
              <div className="space-y-4">
                {existingLearningPath ? (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                    <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-green-600" />
                      Learning Path Active
                    </h3>
                    <p className="text-green-700 text-sm mb-3">
                      You have an active learning path for this book ({existingLearningPath.completion_percentage}% complete)
                    </p>
                    <button 
                      onClick={() => navigate('/learn')}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Continue Learning Path
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                      <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-primary" />
                        Create S3 Learning Path
                      </h3>
                      <p className="text-blue-700 text-sm mb-3">
                        Generate an AI-powered learning path from this book's content
                      </p>
                      <button 
                        onClick={() => setShowS3Generator(true)}
                        disabled={loadingLearningPath}
                        className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingLearningPath ? 'Checking...' : 'Create Learning Path'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {book.processing_status !== 'completed' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
                <p className="text-yellow-700">Complete AI analysis first to unlock learning features</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="space-y-6">
            {book.processing_status === 'completed' && analysis ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAIFlashcards(true)}
                  className="p-6 bg-white rounded-2xl shadow-lg border border-border hover:shadow-xl transition-all text-left"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">AI Flashcards</h3>
                      <p className="text-sm text-muted-foreground">Generate flashcards automatically</p>
                    </div>
                  </div>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAIQuiz(true)}
                  className="p-6 bg-white rounded-2xl shadow-lg border border-border hover:shadow-xl transition-all text-left"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">AI Quiz</h3>
                      <p className="text-sm text-muted-foreground">Test your knowledge</p>
                    </div>
                  </div>
                </motion.button>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-center">
                <p className="text-yellow-700">Complete AI analysis first to unlock study tools</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* S3 Generator Modal */}
      {showS3Generator && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-card rounded-3xl">
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Create Learning Path</h3>
              <button
                onClick={() => setShowS3Generator(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-4">
              <S3Generator 
                book={book} 
                onSuccess={() => {
                  setShowS3Generator(false)
                  checkExistingLearningPath(book)
                }}
                onClose={() => setShowS3Generator(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI Flashcards Modal */}
      {showAIFlashcards && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-card rounded-3xl">
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">AI Flashcards</h3>
              <button
                onClick={() => setShowAIFlashcards(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-4">
              <AIFlashcardGenerator 
                bookId={book.id}
                bookContent={book.extracted_text || ''}
                onFlashcardsGenerated={(count) => {
                  toast.success(`Generated ${count} flashcards!`)
                  setShowAIFlashcards(false)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI Quiz Modal */}
      {showAIQuiz && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-card rounded-3xl">
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">AI Quiz</h3>
              <button
                onClick={() => setShowAIQuiz(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-4">
              <AIQuizGenerator 
                bookId={book.id}
                bookTitle={book.title}
                extractedText={book.extracted_text}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
