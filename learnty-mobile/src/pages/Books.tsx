import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Plus, Library } from 'lucide-react'
import BookUpload from '@/components/BookUpload'
import BookLibrary from '@/components/BookLibrary'
import DataWipe from '@/components/DataWipe'

export default function Books() {
  const [showUpload, setShowUpload] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const navigate = useNavigate()

  const handleUploadSuccess = (book: any) => {
    setShowUpload(false)
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border-b border-border px-4 sm:px-6 pt-8 sm:pt-12 pb-6 sm:pb-8 rounded-b-3xl shadow-lg"
      >
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary rounded-full flex items-center justify-center">
              <Library className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">My Library</h1>
              <p className="text-muted-foreground text-xs sm:text-sm">Your learning collection</p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <DataWipe onWipeComplete={() => setRefreshTrigger(prev => prev + 1)} />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUpload(!showUpload)}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-white text-primary rounded-full flex items-center justify-center shadow-lg"
            >
              <Plus className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${showUpload ? 'rotate-45' : ''}`} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="px-4 sm:px-6 mt-4 sm:mt-6 space-y-4 sm:space-y-6">
        {/* Upload Section */}
        {showUpload && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <BookUpload onUploadSuccess={handleUploadSuccess} />
          </motion.div>
        )}

        {/* Library Section */}
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4">
            All Books
          </h2>
          <BookLibrary
            onBookSelect={(book) => navigate(`/book/${book.id}`)}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>
    </div>
  )
}
