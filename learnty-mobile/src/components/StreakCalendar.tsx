import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'

interface StreakCalendarProps {
  streakCount: number
  recentActivity: boolean[]  // Last 7 days, true if active
}

export default function StreakCalendar({ streakCount, recentActivity }: StreakCalendarProps) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const today = new Date().getDay()
  
  // Ensure we have 7 days of data
  const activityData = [...recentActivity, ...Array(7 - recentActivity.length).fill(false)].slice(0, 7)

  const getMotivationalMessage = (streak: number) => {
    if (streak === 0) return "Start your learning streak today"
    if (streak === 1) return "Great start! Keep it going"
    if (streak < 3) return "Building momentum"
    if (streak < 7) return "You're on fire"
    if (streak < 30) return "Unstoppable streak"
    return "Master of consistency"
  }

  return (
    <div className="bg-card rounded-2xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground mb-1">Learning Streak</h3>
          <p className="text-sm text-muted-foreground">{getMotivationalMessage(streakCount)}</p>
        </div>
        <motion.div
          className="relative"
          animate={{
            scale: streakCount > 0 ? [1, 1.2, 1] : 1,
          }}
          transition={{
            duration: 0.5,
            repeat: streakCount > 0 ? Infinity : 0,
            repeatDelay: 2
          }}
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            streakCount > 0 
              ? 'bg-orange-600' 
              : 'bg-gray-200'
          }`}>
            <Flame className={`w-8 h-8 ${streakCount > 0 ? 'text-white' : 'text-gray-400'}`} />
          </div>
          <div className="absolute -top-1 -right-1 bg-card rounded-full px-2 py-0.5 shadow-lg border border-border">
            <span className="text-xs font-bold text-foreground">{streakCount}</span>
          </div>
        </motion.div>
      </div>

      {/* Calendar */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          const isActive = activityData[index]
          const isToday = index === today
          
          return (
            <motion.div
              key={day}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-xs font-medium text-muted-foreground">{day}</span>
              <motion.div
                whileHover={{ scale: 1.1 }}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-green-600 shadow-md'
                    : 'bg-muted'
                } ${isToday ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
              >
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-3 h-3 bg-white rounded-full"
                  />
                )}
              </motion.div>
            </motion.div>
          )
        })}
      </div>

      {/* Milestones */}
      <div className="mt-6 pt-6 border-t border-border">
        <h4 className="text-sm font-semibold text-foreground mb-3">Streak Milestones</h4>
        <div className="grid grid-cols-3 gap-2">
          {[
            { days: 3, label: '3 days', achieved: streakCount >= 3 },
            { days: 7, label: '1 week', achieved: streakCount >= 7 },
            { days: 30, label: '1 month', achieved: streakCount >= 30 }
          ].map((milestone) => (
            <div
              key={milestone.days}
              className={`px-3 py-2 rounded-lg text-center transition-all ${
                milestone.achieved
                  ? 'bg-primary text-white'
                  : 'bg-muted text-gray-400'
              }`}
            >
              <div className="text-lg font-bold">{milestone.days}</div>
              <div className="text-xs">{milestone.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
