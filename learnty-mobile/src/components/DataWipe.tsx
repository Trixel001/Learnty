import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Settings, AlertTriangle, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/auth'

interface DataWipeProps {
  onWipeComplete: () => void
}

export default function DataWipe({ onWipeComplete }: DataWipeProps) {
  const [showWipeDialog, setShowWipeDialog] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')
  const [isWiping, setIsWiping] = useState(false)
  const { user } = useAuthStore()

  const handleWipeRequest = () => {
    setShowWipeDialog(true)
    setConfirmationText('')
  }

  const handleWipeConfirm = async () => {
    if (confirmationText !== 'DELETE ALL') {
      toast.error('Please type "DELETE ALL" to confirm')
      return
    }

    if (!user) {
      toast.error('You must be logged in to delete data')
      return
    }

    setIsWiping(true)

    try {
      // Delete in order to respect foreign key constraints
      console.log('Starting data wipe process...')

      // First, get all book IDs for this user
      const { data: userBookIds } = await supabase
        .from('books')
        .select('id')
        .eq('user_id', user.id)

      const bookIds = userBookIds?.map(b => b.id) || []

      if (bookIds.length > 0) {
        // 1. Delete all book_chapters for user's books
        const { error: chaptersError } = await supabase
          .from('book_chapters')
          .delete()
          .in('book_id', bookIds)

        if (chaptersError) {
          console.warn('Failed to delete chapters:', chaptersError)
        } else {
          console.log('Deleted all book chapters')
        }

        // 2. Delete all learning sessions for user's books
        const { error: sessionsError } = await supabase
          .from('learning_sessions')
          .delete()
          .in('book_id', bookIds)

        if (sessionsError) {
          console.warn('Failed to delete learning sessions:', sessionsError)
        } else {
          console.log('Deleted all learning sessions')
        }

        // 3. Delete all milestone dependencies for user's books
        const { error: dependenciesError } = await supabase
          .from('milestone_dependencies')
          .delete()
          .in('book_id', bookIds)

        if (dependenciesError) {
          console.warn('Failed to delete milestone dependencies:', dependenciesError)
        } else {
          console.log('Deleted all milestone dependencies')
        }
      }

      // 4. Delete all achievements related to books
      const { error: achievementsError } = await supabase
        .from('achievements')
        .delete()
        .eq('user_id', user.id)
        .like('type', '%book%')

      if (achievementsError) {
        console.warn('Failed to delete book achievements:', achievementsError)
      } else {
        console.log('Deleted book achievements')
      }

      // 5. Get list of user's books to delete files from storage
      const { data: userBooks } = await supabase
        .from('books')
        .select('id, file_url')
        .eq('user_id', user.id)

      // 6. Delete files from storage
      if (userBooks && userBooks.length > 0) {
        const filesToDelete = userBooks
          .filter(book => book.file_url)
          .map(book => {
            const fileName = book.file_url.split('/').pop()
            return `books/${fileName}`
          })

        if (filesToDelete.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('learnty-storage')
            .remove(filesToDelete)

          if (storageError) {
            console.warn('Failed to delete some files from storage:', storageError)
          } else {
            console.log(`Deleted ${filesToDelete.length} files from storage`)
          }
        }
      }

      // 7. Finally, delete all books
      const { error: booksError } = await supabase
        .from('books')
        .delete()
        .eq('user_id', user.id)

      if (booksError) {
        throw new Error(`Failed to delete books: ${booksError.message}`)
      }

      console.log(`Successfully deleted all data for user ${user.id}`)

      toast.success('All books and data deleted successfully!')
      setShowWipeDialog(false)
      onWipeComplete()

    } catch (error: any) {
      console.error('Data wipe failed:', error)
      toast.error('Failed to delete data: ' + (error.message || 'Unknown error'))
    } finally {
      setIsWiping(false)
    }
  }

  return (
    <>
      {/* Settings Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleWipeRequest}
        className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 text-white rounded-full flex items-center justify-center shadow-lg"
        title="Data Management"
      >
        <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
      </motion.button>

      {/* Data Wipe Dialog */}
      <AnimatePresence>
        {showWipeDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => !isWiping && setShowWipeDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-3xl p-6 sm:p-8 w-full max-w-md space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Delete All Data</h3>
                  <p className="text-sm text-muted-foreground">Permanent and irreversible</p>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-red-800 mb-2">This will permanently delete:</p>
                    <ul className="text-red-700 space-y-1">
                      <li>• All uploaded books</li>
                      <li>• All AI analysis and chapters</li>
                      <li>• All learning progress and milestones</li>
                      <li>• All achievement history</li>
                      <li>• All uploaded files from storage</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Confirmation */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground">
                  Type <span className="font-mono bg-muted px-1 rounded">DELETE ALL</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Type DELETE ALL"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  disabled={isWiping}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowWipeDialog(false)}
                  disabled={isWiping}
                  className="flex-1 py-3 px-4 bg-muted text-foreground rounded-xl font-semibold hover:bg-muted/80 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWipeConfirm}
                  disabled={confirmationText !== 'DELETE ALL' || isWiping}
                  className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isWiping ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete All
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
