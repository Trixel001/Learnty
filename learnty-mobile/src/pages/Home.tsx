import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import { 
  getWeeklyLearningData,
  getDailyActivity,
  getAllAchievements,
  getDueCardsCount,
  getActiveProjectsCount
} from '@/lib/dashboardData'
import { 
  Flame, 
  Star, 
  TrendingUp, 
  BookOpen,
  Brain, 
  Timer,
  RotateCcw,
  Zap,
  Award,
  Target
} from 'lucide-react'
import ProgressRing from '@/components/ProgressRing'
import StreakCalendar from '@/components/StreakCalendar'
import LearningChart from '@/components/LearningChart'
import AchievementGallery from '@/components/AchievementGallery'

interface UpNextAction {
  type: 'review' | 'learn' | 'explore'
  title: string
  subtitle: string
  path: string
  priority: number
  badge?: string
}

export default function Home() {
  const { profile, user, loadProfile, loadAchievements } = useAuthStore()
  const navigate = useNavigate()
  const [weeklyData, setWeeklyData] = useState<Array<{ day: string; minutes: number }>>([])
  const [recentActivity, setRecentActivity] = useState<boolean[]>([])
  const [allAchievements, setAllAchievements] = useState<any[]>([])
  const [dueCardsCount, setDueCardsCount] = useState(0)
  const [activeProjectsCount, setActiveProjectsCount] = useState(0)
  const [upNextAction, setUpNextAction] = useState<UpNextAction | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadDashboardData()
      loadProfile()
      loadAchievements()
      
      // Subscribe to profile changes for real-time updates
      const channel = supabase
        .channel('profile-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`
          },
          () => {
            loadProfile()
            loadDashboardData()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user?.id, loadProfile, loadAchievements])

  const loadDashboardData = async () => {
    if (!user?.id) return
    
    try {
      setIsLoading(true)
      
      // Load all data in parallel
      const [weekly, activity, achievements, dueCards, activeProjects] = await Promise.all([
        getWeeklyLearningData(user.id),
        getDailyActivity(user.id),
        getAllAchievements(user.id),
        getDueCardsCount(user.id),
        getActiveProjectsCount(user.id)
      ])
      
      setWeeklyData(weekly)
      setRecentActivity(activity)
      setAllAchievements(achievements)
      setDueCardsCount(dueCards)
      setActiveProjectsCount(activeProjects)
      
      // Determine "Up Next" action
      const upNext = determineUpNextAction(dueCards, activeProjects)
      setUpNextAction(upNext)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const determineUpNextAction = (dueCards: number, activeProjects: number): UpNextAction => {
    // Priority 1: Review if there are due cards
    if (dueCards > 0) {
      return {
        type: 'review',
        title: `Review ${dueCards} cards`,
        subtitle: 'Keep your knowledge fresh',
        path: '/review',
        priority: 1,
        badge: `${dueCards} due`
      }
    }
    
    // Priority 2: Learn if there are active projects
    if (activeProjects > 0) {
      return {
        type: 'learn',
        title: 'Continue Learning',
        subtitle: 'You have active learning paths',
        path: '/learn',
        priority: 2,
        badge: `${activeProjects} active`
      }
    }
    
    // Priority 3: Explore new topics
    return {
      type: 'explore',
      title: 'Explore New Topics',
      subtitle: 'Discover something new to learn',
      path: '/library',
      priority: 3
    }
  }

  // Calculate progress to next level
  const currentLevelXP = profile?.total_xp || 0
  const xpForNextLevel = (profile?.level || 1) * 100
  const progressToNextLevel = (currentLevelXP % xpForNextLevel) / xpForNextLevel * 100

  const stats = [
    {
      icon: Flame,
      label: 'Streak',
      value: profile?.streak_count || 0,
      unit: 'days',
      color: '#f97316',
      progress: Math.min((profile?.streak_count || 0) / 30 * 100, 100)
    },
    {
      icon: Star,
      label: 'XP',
      value: profile?.total_xp || 0,
      unit: '',
      color: '#3b82f6',
      progress: progressToNextLevel
    },
    {
      icon: TrendingUp,
      label: 'Level',
      value: profile?.level || 1,
      unit: '',
      color: '#10b981',
      progress: progressToNextLevel
    }
  ]

  const quickActions = [
    {
      icon: BookOpen,
      title: 'Library',
      subtitle: 'Your books & projects',
      path: '/library'
    },
    {
      icon: Brain,
      title: 'Learning',
      subtitle: 'Continue your paths',
      path: '/learn'
    },
    {
      icon: Timer,
      title: 'Focus Mode',
      subtitle: 'Deep work session',
      path: '/focus'
    }
  ]

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border-b border-border px-4 sm:px-6 pt-8 sm:pt-12 pb-6 sm:pb-8 rounded-b-3xl shadow-lg"
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/profile')}
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-secondary flex items-center justify-center overflow-hidden cursor-pointer"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="text-primary text-lg sm:text-2xl font-bold">
                  {profile?.full_name?.charAt(0) || 'U'}
                </div>
              )}
            </motion.div>
            <div className="flex-1">
              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xl sm:text-2xl font-bold text-foreground"
              >
                Welcome back, {profile?.full_name || 'Learner'}!
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm sm:text-base text-muted-foreground"
              >
                Level {profile?.level || 1} • {profile?.total_xp || 0} XP
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Up Next Section */}
      {upNextAction && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-4 sm:px-6 -mt-3 mb-6"
        >
          <div className="bg-primary rounded-2xl p-4 sm:p-6 text-primary-foreground shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                <span className="font-semibold">Up Next</span>
              </div>
              {upNextAction.badge && (
                <span className="bg-secondary px-3 py-1 rounded-full text-sm font-medium">
                  {upNextAction.badge}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">{upNextAction.title}</h2>
            <p className="text-primary-foreground/90 mb-4">{upNextAction.subtitle}</p>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(upNextAction.path)}
                className="flex-1 bg-card text-primary font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2"
              >
                {upNextAction.type === 'review' && <RotateCcw className="w-4 h-4" />}
                {upNextAction.type === 'learn' && <Brain className="w-4 h-4" />}
                {upNextAction.type === 'explore' && <BookOpen className="w-4 h-4" />}
                Start Now
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/focus')}
                className="px-4 py-3 bg-secondary rounded-xl flex items-center justify-center"
              >
                <Timer className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <div className="px-4 sm:px-6 mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <motion.button
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(action.path)}
                className="bg-card rounded-2xl p-3 sm:p-4 shadow-lg text-left hover:shadow-xl transition-all relative overflow-hidden"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary flex items-center justify-center mb-2 sm:mb-3">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1 text-sm sm:text-base">{action.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{action.subtitle}</p>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Progress Stats */}
      <div className="px-4 sm:px-6 mb-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="bg-card rounded-2xl p-3 sm:p-4 shadow-lg"
              >
                <ProgressRing 
                  progress={stat.progress} 
                  size={80}
                  strokeWidth={5}
                  color={stat.color}
                >
                  <div className="flex flex-col items-center">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 mb-1" style={{ color: stat.color }} />
                    <div className="text-base sm:text-lg font-bold text-foreground">
                      {stat.value}
                    </div>
                    {stat.unit && (
                      <div className="text-xs text-muted-foreground">{stat.unit}</div>
                    )}
                  </div>
                </ProgressRing>
                <div className="text-xs text-muted-foreground text-center mt-1 sm:mt-2">
                  {stat.label}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Streak Calendar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="px-4 sm:px-6 mb-4 sm:mb-6"
      >
        <StreakCalendar 
          streakCount={profile?.streak_count || 0} 
          recentActivity={recentActivity}
        />
      </motion.div>

      {/* Weekly Learning Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="px-4 sm:px-6 mb-4 sm:mb-6"
      >
        <LearningChart 
          data={weeklyData} 
          title="This Week's Learning"
        />
      </motion.div>

      {/* Achievement Gallery */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="px-4 sm:px-6 mb-4 sm:mb-6"
      >
        <AchievementGallery achievements={allAchievements} />
      </motion.div>


    </div>
  )
}
