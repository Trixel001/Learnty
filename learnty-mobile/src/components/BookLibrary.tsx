import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Book, Clock, TrendingUp, Loader2, FileText, RefreshCw, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'

interface BookItem {
  id: string
  title: string
  author: string
  genre: string
  file_url: string
  file_type: string
  upload_date: string
  processing_status: string
  processing_details?: any
  ai_analysis: any
  created_at: string
}

interface BookLibraryProps {
  onBookSelect: (book: BookItem) => void
  refreshTrigger?: number
}

export default function BookLibrary({ onBookSelect, refreshTrigger }: BookLibraryProps) {
  const { user } = useAuthStore()
  const [books, setBooks] = useState<BookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [retryingBooks, setRetryingBooks] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (user?.id) {
      loadBooks()
    }
  }, [user?.id, refreshTrigger])

  const loadBooks = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user?.id)
        .order('upload_date', { ascending: false })

      if (error) throw error
      setBooks(data || [])
    } catch (error) {
      console.error('Error loading books:', error)
    } finally {
      setLoading(false)
    }
  }

  const retryBookProcessing = async (book: BookItem, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent book selection
    
    try {
      setRetryingBooks(prev => new Set(prev).add(book.id))
      
      console.log(`[BookLibrary] Retrying processing for book ${book.id}`)
      
      // Get the book content for reprocessing
      const { data: fileResponse } = await supabase.storage
        .from('learnty-storage')
        .download(book.file_url)
      
      if (!fileResponse) {
        throw new Error('Could not download book file')
      }
      
      // Convert to text (assuming it's already extracted)
      const text = await fileResponse.text()
      
      // Reset status to uploaded and clear any error details
      await supabase
        .from('books')
        .update({ 
          processing_status: 'uploaded',
          processing_details: null,
          ai_analysis: null
        })
        .eq('id', book.id)
      
      // Trigger AI processing
      const { error } = await supabase.functions.invoke('process-book-ai', {
        body: { 
          bookId: book.id, 
          bookText: text 
        }
      })
      
      if (error) {
        console.error('[BookLibrary] Retry processing error:', error)
        // Update status to failed
        await supabase
          .from('books')
          .update({ 
            processing_status: 'failed',
            processing_details: {
              retryError: error.message,
              retryAt: new Date().toISOString()
            }
          })
          .eq('id', book.id)
      }
      
      // Refresh the books list
      await loadBooks()
    } catch (error) {
      console.error('[BookLibrary] Error retrying book processing:', error)
    } finally {
      setRetryingBooks(prev => {
        const newSet = new Set(prev)
        newSet.delete(book.id)
        return newSet
      })
    }
  }

  const isProcessingStuck = (book: BookItem) => {
    if (!['analyzing', 'processing_chapters'].includes(book.processing_status)) {
      return false
    }
    
    // Check if the book has been processing for more than 5 minutes
    const createdAt = new Date(book.created_at).getTime()
    const now = Date.now()
    const fiveMinutes = 5 * 60 * 1000
    
    return (now - createdAt) > fiveMinutes
  }

  const cancelBookProcessing = async (book: BookItem, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent book selection
    
    try {
      setRetryingBooks(prev => new Set(prev).add(book.id))
      
      console.log(`[BookLibrary] Cancelling processing for book ${book.id}`)
      
      // Update book status to cancelled
      await supabase
        .from('books')
        .update({ 
          processing_status: 'failed',
          processing_details: {
            cancelledAt: new Date().toISOString(),
            cancelReason: 'User cancelled stuck analysis'
          }
        })
        .eq('id', book.id)
      
      // Refresh the books list
      await loadBooks()
    } catch (error) {
      console.error('[BookLibrary] Error cancelling book processing:', error)
    } finally {
      setRetryingBooks(prev => {
        const newSet = new Set(prev)
        newSet.delete(book.id)
        return newSet
      })
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-600'
      case 'intermediate':
        return 'bg-primary'
      case 'advanced':
        return 'bg-orange-600'
      default:
        return 'bg-gray-600'
    }
  }

  const getStatusBadge = (book: BookItem) => {
    const { processing_status } = book
    const isRetrying = retryingBooks.has(book.id)
    const stuck = isProcessingStuck(book)
    
    switch (processing_status) {
      case 'completed':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            Ready
          </span>
        )
      case 'analyzing':
        return (
          <div className="flex items-center gap-1">
            <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
              stuck ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
            }`}>
              <Loader2 className="w-3 h-3 animate-spin" />
              {stuck ? 'Stuck' : 'Analyzing'}
            </span>
            {stuck && !isRetrying && (
              <button
                onClick={(e) => cancelBookProcessing(book, e)}
                className="p-1 hover:bg-muted rounded-full transition-colors"
                title="Cancel analysis"
              >
                <RefreshCw className="w-3 h-3 text-orange-600" />
              </button>
            )}
            {isRetrying && (
              <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
            )}
          </div>
        )
      case 'processing_chapters':
        return (
          <div className="flex items-center gap-1">
            <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
              stuck ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'
            }`}>
              <Loader2 className="w-3 h-3 animate-spin" />
              {stuck ? 'Stuck' : 'Chapters'}
            </span>
            {stuck && !isRetrying && (
              <button
                onClick={(e) => cancelBookProcessing(book, e)}
                className="p-1 hover:bg-muted rounded-full transition-colors"
                title="Cancel analysis"
              >
                <RefreshCw className="w-3 h-3 text-orange-600" />
              </button>
            )}
            {isRetrying && (
              <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
            )}
          </div>
        )
      case 'uploaded':
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
            Uploaded
          </span>
        )
      case 'failed':
        return (
          <div className="flex items-center gap-1">
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Failed
            </span>
            {!isRetrying && (
              <button
                onClick={(e) => retryBookProcessing(book, e)}
                className="p-1 hover:bg-muted rounded-full transition-colors"
                title="Retry processing"
              >
                <RefreshCw className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
            {isRetrying && (
              <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
            )}
          </div>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (books.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Book className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">No books yet</h3>
        <p className="text-muted-foreground">
          Upload your first book to start learning
        </p>
      </motion.div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      {books.map((book, index) => {
        const analysis = book.ai_analysis
        const difficulty = analysis?.difficulty || 'intermediate'

        return (
          <motion.button
            key={book.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onBookSelect(book)}
            className="bg-card rounded-2xl p-3 sm:p-4 shadow-lg hover:shadow-xl transition-all text-left"
          >
            {/* Book Cover */}
            <div className={`
              w-full aspect-[3/4] rounded-xl mb-3 sm:mb-4 overflow-hidden
              ${getDifficultyColor(difficulty)}
              flex items-center justify-center relative
            `}>
              <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-white opacity-50" />
              <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
                {getStatusBadge(book)}
              </div>
            </div>

            {/* Book Info */}
            <h3 className="font-bold text-foreground mb-1 line-clamp-2 break-words overflow-hidden text-sm sm:text-base">
              {book.title}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
              by {book.author}
            </p>

            {/* Processing Status Messages */}
            {book.processing_status === 'failed' && (
              <div className="mb-2 sm:mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-700 mb-1">Processing failed</p>
                {book.processing_details?.error && (
                  <p className="text-xs text-red-600">
                    {book.processing_details.error}
                  </p>
                )}
              </div>
            )}
            
            {isProcessingStuck(book) && (
              <div className="mb-2 sm:mb-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-xs text-orange-700">
                  Processing is taking longer than expected. The book is still being analyzed.
                </p>
              </div>
            )}

            {analysis && (
              <div className="space-y-1 sm:space-y-2">
                {/* Topics */}
                {analysis.topics && analysis.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {analysis.topics.slice(0, 2).map((topic: string, i: number) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-muted text-foreground text-xs rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}

                {/* Meta Info */}
                <div className="flex items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                  {analysis.estimatedMinutes && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">{analysis.estimatedMinutes}min</span>
                    </div>
                  )}
                  {difficulty && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-xs">{difficulty}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
