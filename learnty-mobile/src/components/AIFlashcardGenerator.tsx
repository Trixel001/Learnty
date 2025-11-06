import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Brain, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface AIFlashcardGeneratorProps {
  bookId: string
  bookContent: string
  onFlashcardsGenerated: (count: number) => void
}

export default function AIFlashcardGenerator({ 
  bookId, 
  bookContent, 
  onFlashcardsGenerated 
}: AIFlashcardGeneratorProps) {
  const [generating, setGenerating] = useState(false)
  const [count, setCount] = useState(10)
  const [progress, setProgress] = useState('')

  const handleGenerate = async () => {
    if (!bookContent || bookContent.length < 100) {
      toast.error('Insufficient content to generate flashcards')
      return
    }

    setGenerating(true)
    setProgress('Analyzing content with AI...')

    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-flashcards', {
        body: {
          bookId,
          contentText: bookContent,
          count
        }
      })

      if (error) {
        throw error
      }

      const flashcardCount = data?.data?.count || data?.count || 0
      
      setProgress('Flashcards generated successfully!')
      toast.success(`Generated ${flashcardCount} AI flashcards!`)
      
      setTimeout(() => {
        onFlashcardsGenerated(flashcardCount)
        setGenerating(false)
        setProgress('')
      }, 1000)

    } catch (error: any) {
      console.error('Flashcard generation error:', error)
      toast.error(error.message || 'Failed to generate flashcards')
      setGenerating(false)
      setProgress('')
    }
  }

  return (
    <div className="bg-secondary rounded-2xl p-6 border border-border">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">AI Flashcard Generator</h3>
          <p className="text-sm text-muted-foreground">Powered by DeepSeek AI</p>
        </div>
      </div>

      <p className="text-gray-700 mb-4">
        Let AI automatically create study flashcards from your book content using advanced language models.
      </p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of flashcards
        </label>
        <select
          value={count}
          onChange={(e) => setCount(parseInt(e.target.value))}
          disabled={generating}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
        >
          <option value={5}>5 flashcards</option>
          <option value={10}>10 flashcards</option>
          <option value={15}>15 flashcards</option>
          <option value={20}>20 flashcards</option>
        </select>
      </div>

      {generating && progress && (
        <div className="mb-4 bg-purple-100 rounded-lg p-3 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <p className="text-sm text-purple-900 font-medium">{progress}</p>
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {generating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Brain className="w-5 h-5" />
            Generate AI Flashcards
          </>
        )}
      </button>

      <div className="mt-4 pt-4 border-t border-purple-200">
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p>AI-generated flashcards are automatically added to your review system</p>
        </div>
        <div className="flex items-start gap-2 text-xs text-muted-foreground mt-2">
          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p>Uses spaced repetition algorithm for optimal learning</p>
        </div>
      </div>
    </div>
  )
}
