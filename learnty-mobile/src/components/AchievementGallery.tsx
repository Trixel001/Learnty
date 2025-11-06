import { motion } from 'framer-motion'
import { Trophy, Lock } from 'lucide-react'
import { useState } from 'react'

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  earned: boolean
  earnedAt?: string
  progress?: number
  total?: number
}

interface AchievementGalleryProps {
  achievements: Achievement[]
}

export default function AchievementGallery({ achievements }: AchievementGalleryProps) {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)

  const earnedCount = achievements.filter(a => a.earned).length
  const totalCount = achievements.length

  return (
    <div className="bg-card rounded-2xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground mb-1">Achievements</h3>
          <p className="text-sm text-muted-foreground">
            {earnedCount} of {totalCount} unlocked
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="text-2xl font-bold text-foreground">{earnedCount}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(earnedCount / totalCount) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-3 gap-3">
        {achievements.map((achievement, index) => (
          <motion.button
            key={achievement.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedAchievement(achievement)}
            className={`aspect-square rounded-xl p-3 flex flex-col items-center justify-center gap-2 transition-all ${
              achievement.earned
                ? 'bg-primary shadow-md'
                : 'bg-muted'
            }`}
          >
            {achievement.earned ? (
              <motion.div
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 + 0.2 }}
              >
                <Trophy className="w-8 h-8 text-white" />
              </motion.div>
            ) : (
              <Lock className="w-8 h-8 text-gray-400" />
            )}
            {achievement.progress !== undefined && !achievement.earned && (
              <div className="w-full mt-1">
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(achievement.progress / (achievement.total || 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* No achievements message */}
      {achievements.length === 0 && (
        <div className="text-center py-8">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-muted-foreground mb-2">No achievements yet</p>
          <p className="text-sm text-gray-400">
            Start learning to unlock achievements
          </p>
        </div>
      )}

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedAchievement(null)}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-3xl p-8 max-w-sm w-full text-center"
          >
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4 ${
              selectedAchievement.earned
                ? 'bg-primary'
                : 'bg-muted'
            }`}>
              {selectedAchievement.earned ? (
                <Trophy className="w-12 h-12 text-white" />
              ) : (
                <Lock className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {selectedAchievement.title}
            </h3>
            <p className="text-muted-foreground mb-4">
              {selectedAchievement.description}
            </p>
            {selectedAchievement.earned && selectedAchievement.earnedAt && (
              <p className="text-sm text-muted-foreground">
                Unlocked on {new Date(selectedAchievement.earnedAt).toLocaleDateString()}
              </p>
            )}
            {!selectedAchievement.earned && selectedAchievement.progress !== undefined && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>Progress</span>
                  <span>{selectedAchievement.progress} / {selectedAchievement.total}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${(selectedAchievement.progress / (selectedAchievement.total || 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}
            <button
              onClick={() => setSelectedAchievement(null)}
              className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
