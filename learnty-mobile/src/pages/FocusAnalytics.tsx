// @ts-nocheck
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft,
  Calendar,
  Clock,
  TrendingUp,
  Zap,
  Target,
  Award,
  BarChart3,
  Activity
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface FocusSession {
  id: string
  user_id: string
  session_type: string
  duration_minutes: number
  completed_at: string
  xp_earned: number
}

interface DailyData {
  date: string
  sessions: number
  minutes: number
  xp: number
}

interface WeeklyData {
  day: string
  sessions: number
  minutes: number
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

export default function FocusAnalytics() {
  const { user, profile } = useAuthStore()
  const navigate = useNavigate()
  
  const [sessions, setSessions] = useState<FocusSession[]>([])
  const [dailyData, setDailyData] = useState<DailyData[]>([])
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalMinutes: 0,
    totalXP: 0,
    averageSessionLength: 0,
    longestStreak: 0,
    currentStreak: 0
  })
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadAnalytics()
    }
  }, [user, timeRange])

  const loadAnalytics = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      // Calculate date range
      const now = new Date()
      let startDate = new Date()
      
      if (timeRange === 'week') {
        startDate.setDate(now.getDate() - 7)
      } else if (timeRange === 'month') {
        startDate.setDate(now.getDate() - 30)
      } else {
        startDate.setFullYear(now.getFullYear() - 1)
      }

      // Fetch sessions
      const { data: sessionsData, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_at', startDate.toISOString())
        .order('completed_at', { ascending: true })

      if (error) throw error

      setSessions(sessionsData || [])

      // Calculate stats
      const totalSessions = sessionsData?.length || 0
      const totalMinutes = sessionsData?.reduce((sum, s) => sum + s.duration_minutes, 0) || 0
      const totalXP = sessionsData?.reduce((sum, s) => sum + s.xp_earned, 0) || 0
      const averageSessionLength = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0

      // Calculate streak
      const { currentStreak, longestStreak } = calculateStreaks(sessionsData || [])

      setStats({
        totalSessions,
        totalMinutes,
        totalXP,
        averageSessionLength,
        currentStreak,
        longestStreak
      })

      // Process daily data for chart
      const dailyMap = new Map<string, { sessions: number; minutes: number; xp: number }>()
      
      sessionsData?.forEach(session => {
        const date = new Date(session.completed_at).toISOString().split('T')[0]
        const existing = dailyMap.get(date) || { sessions: 0, minutes: 0, xp: 0 }
        dailyMap.set(date, {
          sessions: existing.sessions + 1,
          minutes: existing.minutes + session.duration_minutes,
          xp: existing.xp + session.xp_earned
        })
      })

      const dailyDataArray: DailyData[] = Array.from(dailyMap.entries()).map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ...data
      }))

      setDailyData(dailyDataArray)

      // Process weekly data
      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      const weeklyMap = new Map<string, { sessions: number; minutes: number }>()
      
      // Initialize all days
      weekDays.forEach(day => {
        weeklyMap.set(day, { sessions: 0, minutes: 0 })
      })

      sessionsData?.forEach(session => {
        const dayOfWeek = weekDays[new Date(session.completed_at).getDay()]
        const existing = weeklyMap.get(dayOfWeek)!
        weeklyMap.set(dayOfWeek, {
          sessions: existing.sessions + 1,
          minutes: existing.minutes + session.duration_minutes
        })
      })

      const weeklyDataArray: WeeklyData[] = weekDays.map(day => ({
        day,
        ...weeklyMap.get(day)!
      }))

      setWeeklyData(weeklyDataArray)

    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStreaks = (sessions: FocusSession[]) => {
    if (sessions.length === 0) return { currentStreak: 0, longestStreak: 0 }

    // Group sessions by date
    const dateSet = new Set<string>()
    sessions.forEach(session => {
      const date = new Date(session.completed_at).toISOString().split('T')[0]
      dateSet.add(date)
    })

    const dates = Array.from(dateSet).sort()
    
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 1

    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    // Check if there's a session today or yesterday for current streak
    if (dates.includes(today) || dates.includes(yesterday)) {
      currentStreak = 1
      
      // Count backwards from today/yesterday
      let checkDate = dates.includes(today) ? new Date() : new Date(Date.now() - 86400000)
      
      for (let i = dates.length - 1; i >= 0; i--) {
        const sessionDate = new Date(dates[i])
        const dayDiff = Math.floor((checkDate.getTime() - sessionDate.getTime()) / 86400000)
        
        if (dayDiff === 0) continue
        if (dayDiff === 1) {
          currentStreak++
          checkDate = sessionDate
        } else {
          break
        }
      }
    }

    // Calculate longest streak
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1])
      const currDate = new Date(dates[i])
      const dayDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / 86400000)

      if (dayDiff === 1) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 1
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak)

    return { currentStreak, longestStreak }
  }

  const StatCard = ({ icon: Icon, label, value, unit, color }: any) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-2xl p-4 shadow-lg"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-xl bg-primary flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </div>
      {unit && <div className="text-xs text-muted-foreground">{unit}</div>}
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary px-4 sm:px-6 pt-8 pb-8 rounded-b-3xl shadow-lg"
      >
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate('/focus')}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Session Analytics</h1>
            <p className="text-white/80 text-sm">Track your learning progress</p>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 bg-white/10 rounded-xl p-1">
          {(['week', 'month', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                timeRange === range
                  ? 'bg-white text-primary'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              {range === 'week' ? '7 Days' : range === 'month' ? '30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="px-4 sm:px-6 -mt-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Key Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6"
            >
              <StatCard
                icon={Target}
                label="Total Sessions"
                value={stats.totalSessions}
                color="from-blue-500 to-blue-600"
              />
              <StatCard
                icon={Clock}
                label="Total Time"
                value={`${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`}
                color="from-green-500 to-green-600"
              />
              <StatCard
                icon={Award}
                label="Total XP"
                value={stats.totalXP}
                color="from-purple-500 to-purple-600"
              />
              <StatCard
                icon={Activity}
                label="Average Session"
                value={`${stats.averageSessionLength}m`}
                color="from-orange-500 to-orange-600"
              />
              <StatCard
                icon={Zap}
                label="Current Streak"
                value={`${stats.currentStreak} days`}
                color="from-yellow-500 to-yellow-600"
              />
              <StatCard
                icon={TrendingUp}
                label="Longest Streak"
                value={`${stats.longestStreak} days`}
                color="from-pink-500 to-pink-600"
              />
            </motion.div>

            {/* Daily Sessions Chart */}
            {dailyData.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg mb-6"
              >
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Daily Session Activity
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sessions" fill="#3b82f6" name="Sessions" />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Weekly Pattern Chart */}
            {weeklyData.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg mb-6"
              >
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Weekly Pattern
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="minutes" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Minutes"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Focus Time Distribution */}
            {dailyData.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg mb-6"
              >
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Daily Minutes Distribution
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="minutes" fill="#8b5cf6" name="Minutes" />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* XP Progress Chart */}
            {dailyData.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg mb-6"
              >
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-600" />
                  XP Growth
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="xp" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      name="XP Earned"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            )}

            {/* Recent Sessions */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg"
            >
              <h3 className="text-lg font-bold text-foreground mb-4">Recent Sessions</h3>
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No focus sessions yet</p>
                  <p className="text-sm">Start your first session to see analytics</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.slice(-10).reverse().map((session) => (
                    <div 
                      key={session.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {session.duration_minutes} minutes
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(session.completed_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-primary">
                          +{session.xp_earned} XP
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
