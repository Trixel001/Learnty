import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import { useReviewModal } from '@/hooks/useReviewModal'
import ReviewModal from '@/components/ReviewModal'

import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Coffee, 
  Brain, 
  Clock, 
  Target,
  Volume2,
  VolumeX,
  Settings,
  Zap,
  TrendingUp,
  Award,
  BarChart3
} from 'lucide-react'
import toast from 'react-hot-toast'

interface SessionSettings {
  workDuration: number
  breakDuration: number
  longBreakDuration: number
  sessionsUntilLongBreak: number
  soundEnabled: boolean
  notificationsEnabled: boolean
}

type SessionType = 'work' | 'break' | 'longBreak'

export default function Focus() {
  const { user, profile, loadProfile } = useAuthStore()
  const { shouldShowReview, showReviewModal, triggerReview, hideReviewModal } = useReviewModal()
  const navigate = useNavigate()
  const mountedRef = useRef(true)
  
  // Use global timer state from Zustand
  const { timeLeft, isTimerActive, timerMode, setTimerState, resetTimer } = useAuthStore((state) => ({
    timeLeft: state.timeLeft,
    isTimerActive: state.isTimerActive,
    timerMode: state.timerMode,
    setTimerState: state.setTimerState,
    resetTimer: state.resetTimer,
  }))
  
  const [isPaused, setIsPaused] = useState(false)
  const [sessionType, setSessionType] = useState<SessionType>('work')
  const [completedSessions, setCompletedSessions] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  
  const [settings, setSettings] = useState<SessionSettings>({
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    soundEnabled: true,
    notificationsEnabled: true
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Track component mount state to prevent updates after unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Load settings and stats from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('learnty_focus_settings')
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      setSettings(parsed)
      resetTimer('focus')
    }

    const savedStats = localStorage.getItem('learnty_focus_stats')
    if (savedStats) {
      const stats = JSON.parse(savedStats)
      setCompletedSessions(stats.completedSessions || 0)
      setCurrentStreak(stats.currentStreak || 0)
    }

    // Request notification permission
    if (settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('learnty_focus_settings', JSON.stringify(settings))
  }, [settings])

  // Save stats to localStorage
  useEffect(() => {
    const stats = {
      completedSessions,
      currentStreak,
      totalFocusTime: completedSessions * settings.workDuration
    }
    localStorage.setItem('learnty_focus_stats', JSON.stringify(stats))
  }, [completedSessions, currentStreak, settings.workDuration])

  // Timer completion check - handled locally since it needs session completion logic
  useEffect(() => {
    if (isTimerActive && !isPaused && timeLeft <= 0) {
      handleSessionComplete()
    }
  }, [timeLeft, isTimerActive, isPaused]) // REMOVED handleSessionComplete dependency

  const saveSessionToDatabase = useCallback(async (durationMinutes: number) => {
    if (!user || !mountedRef.current) return

    try {
      const xpEarned = durationMinutes * 10 // 10 XP per minute
      
      // Save session to database
      const { error: sessionError } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: user.id,
          session_type: 'pomodoro',
          duration_minutes: durationMinutes,
          completed_at: new Date().toISOString(),
          xp_earned: xpEarned
        })

      if (sessionError) {
        console.error('Error saving session:', sessionError)
        throw sessionError
      }

      // Update user profile with new XP and potentially new level
      const newTotalXP = (profile?.total_xp || 0) + xpEarned
      const newLevel = Math.floor(newTotalXP / 100) + 1

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          total_xp: newTotalXP,
          level: newLevel,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (profileError) {
        console.error('Error updating profile:', profileError)
        throw profileError
      }

      // Reload profile to get updated data
      await loadProfile()

      toast.success(`Session complete! Earned ${xpEarned} XP`)
    } catch (error) {
      console.error('Error saving focus session:', error)
      toast.error('Failed to save session')
    }
  }, [user, profile, loadProfile])

  const handleSessionComplete = () => {
    // Don't update state if component is unmounted
    if (!mountedRef.current) return
    
    setTimerState({ isTimerActive: false })
    setIsPaused(false)
    
    // Play completion sound
    if (settings.soundEnabled) {
      playNotificationSound()
    }

    // Show notification
    if (settings.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Learnty Focus Session Complete!', {
        body: sessionType === 'work' ? 'Time for a break!' : 'Ready to focus again?',
        icon: '/favicon.ico'
      })
    }

    if (sessionType === 'work') {
      const newCompletedSessions = completedSessions + 1
      if (mountedRef.current) {
        setCompletedSessions(newCompletedSessions)
        setCurrentStreak(currentStreak + 1)
      }
      
      // Save to database
      saveSessionToDatabase(settings.workDuration)
      
      // Trigger review modal after completing the first focus session
      if (newCompletedSessions === 1 && mountedRef.current) {
        triggerReview()
      }
      
      // Determine next session type
      if (newCompletedSessions % settings.sessionsUntilLongBreak === 0) {
        if (mountedRef.current) {
          setSessionType('longBreak')
          resetTimer('longBreak')
          toast.success('Great work! Take a long break.')
        }
      } else {
        if (mountedRef.current) {
          setSessionType('break')
          resetTimer('shortBreak')
          toast.success('Session complete! Time for a break.')
        }
      }
    } else {
      if (mountedRef.current) {
        setSessionType('work')
        resetTimer('focus')
        toast.success('Break over! Ready to focus again.')
      }
    }

    if (mountedRef.current) {
      setSessionStartTime(null)
    }
  }

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.log('Audio notification not available')
    }
  }

  const handleStart = () => {
    if (!mountedRef.current) return
    setTimerState({ isTimerActive: true })
    setIsPaused(false)
    setSessionStartTime(new Date())
  }

  const handlePause = () => {
    if (!mountedRef.current) return
    setIsPaused(true)
  }

  const handleResume = () => {
    if (!mountedRef.current) return
    setIsPaused(false)
  }

  const handleStop = () => {
    if (!mountedRef.current) return
    setTimerState({ isTimerActive: false })
    setIsPaused(false)
    setSessionStartTime(null)
    
    // Reset streak if stopping during work session
    if (sessionType === 'work') {
      setCurrentStreak(0)
      toast.error('Session stopped. Streak reset.')
    }
  }

  const handleReset = () => {
    if (!mountedRef.current) return
    setTimerState({ isTimerActive: false })
    setIsPaused(false)
    resetTimer('focus')
    setSessionType('work')
    setSessionStartTime(null)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getSessionColor = () => {
    switch (sessionType) {
      case 'work': return 'bg-primary'
      case 'break': return 'bg-green-600'
      case 'longBreak': return 'bg-purple-600'
    }
  }

  const getSessionIcon = () => {
    switch (sessionType) {
      case 'work': return <Brain className="w-8 h-8 text-primary-foreground" />
      case 'break': return <Coffee className="w-8 h-8 text-primary-foreground" />
      case 'longBreak': return <Zap className="w-8 h-8 text-primary-foreground" />
    }
  }

  const getSessionTitle = () => {
    switch (sessionType) {
      case 'work': return 'Focus Time'
      case 'break': return 'Short Break'
      case 'longBreak': return 'Long Break'
    }
  }

  const totalSessionTime = sessionType === 'work' ? settings.workDuration * 60 :
                          sessionType === 'break' ? settings.breakDuration * 60 :
                          settings.longBreakDuration * 60
  const progress = ((totalSessionTime - timeLeft) / totalSessionTime) * 100

  return (
    <>
    <div className="min-h-screen pb-20 sm:pb-24">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border-b border-border px-4 sm:px-6 pt-6 sm:pt-8 pb-6 sm:pb-8 rounded-b-2xl sm:rounded-b-3xl shadow-lg"
      >
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-secondary rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Focus Timer</h1>
              <p className="text-muted-foreground text-xs sm:text-sm">Pomodoro-style learning sessions</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-8 h-8 sm:w-10 sm:h-10 bg-secondary rounded-full flex items-center justify-center hover:bg-secondary/80 transition-colors"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </button>
        </div>
      </motion.div>

      <div className="px-4 sm:px-6 -mt-3 sm:-mt-4">
        {/* Quick Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6"
        >
          <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-lg text-center">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary mx-auto mb-1" />
            <div className="text-base sm:text-lg md:text-xl font-bold text-foreground">{completedSessions}</div>
            <div className="text-xs text-muted-foreground">Sessions</div>
          </div>
          <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-lg text-center">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mx-auto mb-1" />
            <div className="text-base sm:text-lg md:text-xl font-bold text-foreground">{currentStreak}</div>
            <div className="text-xs text-muted-foreground">Streak</div>
          </div>
          <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-lg text-center">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary mx-auto mb-1" />
            <div className="text-base sm:text-lg md:text-xl font-bold text-foreground">
              {Math.floor((completedSessions * settings.workDuration) / 60)}h
            </div>
            <div className="text-xs text-muted-foreground">Focus</div>
          </div>
          <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-lg text-center">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-primary mx-auto mb-1" />
            <div className="text-base sm:text-lg md:text-xl font-bold text-foreground">
              {completedSessions * settings.workDuration * 10}
            </div>
            <div className="text-xs text-muted-foreground">XP</div>
          </div>
        </motion.div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-4 sm:mb-6"
            >
              <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg">
                <h3 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4">Session Settings</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Work Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={settings.workDuration}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 25
                        setSettings(prev => ({ ...prev, workDuration: val }))
                        if (!isTimerActive && sessionType === 'work') {
                          resetTimer('focus')
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isTimerActive && !isPaused && sessionType === 'work'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Short Break (minutes)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={settings.breakDuration}
                      onChange={(e) => setSettings(prev => ({ ...prev, breakDuration: parseInt(e.target.value) || 5 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isTimerActive && !isPaused && sessionType === 'work'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Long Break (minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={settings.longBreakDuration}
                      onChange={(e) => setSettings(prev => ({ ...prev, longBreakDuration: parseInt(e.target.value) || 15 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isTimerActive && !isPaused && sessionType === 'work'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sessions until long break
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="8"
                      value={settings.sessionsUntilLongBreak}
                      onChange={(e) => setSettings(prev => ({ ...prev, sessionsUntilLongBreak: parseInt(e.target.value) || 4 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isTimerActive && !isPaused && sessionType === 'work'}
                    />
                  </div>
                  <div className="flex items-center justify-between sm:col-span-2">
                    <span className="text-sm font-medium text-gray-700">Sound Notifications</span>
                    <button
                      onClick={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                      className={`w-12 h-6 rounded-full transition-colors ${settings.soundEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.soundEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between sm:col-span-2">
                    <span className="text-sm font-medium text-gray-700">Browser Notifications</span>
                    <button
                      onClick={() => {
                        if ('Notification' in window && Notification.permission === 'default') {
                          Notification.requestPermission()
                        }
                        setSettings(prev => ({ ...prev, notificationsEnabled: !prev.notificationsEnabled }))
                      }}
                      className={`w-12 h-6 rounded-full transition-colors ${settings.notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.notificationsEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Timer */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg mb-6"
        >
          {/* Session Icon and Title */}
          <motion.div
            key={sessionType}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full ${getSessionColor()} flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg`}
          >
            {getSessionIcon()}
          </motion.div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 text-center">
            {getSessionTitle()}
          </h2>
          <p className="text-muted-foreground mb-4 sm:mb-6 text-center text-sm sm:text-base px-2">
            {sessionType === 'work' ? 'Stay focused and productive' :
             sessionType === 'break' ? 'Take a short rest' :
             'Enjoy your longer break'}
          </p>

          {/* Timer Display */}
          <div className="text-4xl sm:text-5xl md:text-7xl font-bold text-foreground mb-4 sm:mb-6 font-mono text-center">
            {formatTime(timeLeft)}
          </div>

          {/* Progress Ring */}
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mx-auto mb-4 sm:mb-6">
            <svg className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                className={`transition-all duration-1000 ${
                  sessionType === 'work' ? 'text-blue-500' :
                  sessionType === 'break' ? 'text-green-500' :
                  'text-purple-500'
                }`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm sm:text-lg md:text-xl font-medium text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap px-2">
            {!isTimerActive ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStart}
                className={`${getSessionColor()} hover:opacity-90 text-primary-foreground px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-semibold shadow-lg flex items-center gap-2 text-sm sm:text-base`}
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Start</span>
              </motion.button>
            ) : (
              <>
                {isPaused ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleResume}
                    className="bg-green-600 hover:bg-green-700 text-primary-foreground px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold shadow-lg flex items-center gap-2 text-sm sm:text-base"
                  >
                    <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Resume</span>
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePause}
                    className="bg-yellow-600 hover:bg-yellow-700 text-primary-foreground px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold shadow-lg flex items-center gap-2 text-sm sm:text-base"
                  >
                    <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Pause</span>
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStop}
                  className="bg-red-600 hover:bg-red-700 text-primary-foreground px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold shadow-lg flex items-center gap-2 text-sm sm:text-base"
                >
                  <Square className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Stop</span>
                </motion.button>
              </>
            )}
          </div>

          <button
            onClick={handleReset}
            disabled={isTimerActive && !isPaused && sessionType === 'work'}
            className="w-full text-muted-foreground hover:text-foreground font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/focus/analytics')}
            className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg text-left hover:shadow-xl transition-all"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm sm:text-base">Today's Progress</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{completedSessions} sessions completed</p>
              </div>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/focus/analytics')}
            className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg text-left hover:shadow-xl transition-all"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm sm:text-base">View Analytics</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Track your learning patterns</p>
              </div>
            </div>
          </motion.button>
        </div>
      </div>


    </div>

    {/* Review Modal */}
    {showReviewModal && (
      <ReviewModal
        onClose={hideReviewModal}
        sessionType="focus"
      />
    )}
    </>
  )
}
