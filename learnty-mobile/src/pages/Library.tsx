import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { BookOpen, FolderOpen, Search, Brain, Plus } from 'lucide-react'
import BookUpload from '@/components/BookUpload'
import BookLibrary from '@/components/BookLibrary'
import DataWipe from '@/components/DataWipe'
import toast from 'react-hot-toast'

export default function Library() {
  const [activeTab, setActiveTab] = useState('books')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const navigate = useNavigate()

  const tabs = [
    { 
      key: 'books', 
      icon: BookOpen, 
      label: 'My Books',
      description: 'Uploaded books for gamification'
    },
    { 
      key: 'topics', 
      icon: Brain, 
      label: 'My Topics',
      description: 'AI-powered learning paths'
    },
    { 
      key: 'projects', 
      icon: FolderOpen, 
      label: 'My Projects',
      description: 'Your learning projects'
    }
  ]

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 sm:px-6 pt-8 sm:pt-12 pb-6 sm:pb-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary rounded-full flex items-center justify-center">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Library</h1>
              <p className="text-muted-foreground text-xs sm:text-sm">Your learning collection</p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <DataWipe onWipeComplete={() => setRefreshTrigger(prev => prev + 1)} />
          </div>
        </div>
        
        {/* Tab Navigation */}
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
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
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
      <div className="px-4 sm:px-6 mt-4 sm:mt-6 space-y-4 sm:space-y-6">
        {activeTab === 'books' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-foreground">My Books</h2>
                <p className="text-sm text-muted-foreground">Books you've uploaded for gamified learning</p>
              </div>
            </div>
            <BookUpload onUploadSuccess={() => {
              setRefreshTrigger(prev => prev + 1)
              toast.success('Book added to your library!')
            }} />
            <BookLibrary
              onBookSelect={(book) => navigate(`/book/${book.id}`)}
              refreshTrigger={refreshTrigger}
            />
          </div>
        )}

        {activeTab === 'topics' && (
          <div className="space-y-4">
            <div className="text-center py-8 sm:py-12">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Brain className="w-10 h-10 sm:w-12 sm:h-12 text-primary-foreground" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Learning Paths</h2>
              <p className="text-muted-foreground mb-6 text-sm sm:text-base">Create AI-powered structured learning journeys</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/learn')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5" />
                Create Path
              </motion.button>
            </div>
          </div>
        )}
        
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-foreground">My Projects</h2>
                <p className="text-sm text-muted-foreground">Your learning projects</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Projects Coming Soon</h3>
              <p className="text-muted-foreground text-sm mb-4">Your learning projects and custom study plans will appear here</p>
              <button
                onClick={() => navigate('/learning-paths')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
              >
                View Learning Paths
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}