import { supabase } from './supabase'

/**
 * Fetch weekly learning time data from focus_sessions
 */
export async function getWeeklyLearningData(userId: string) {
  try {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('duration_minutes, completed_at')
      .eq('user_id', userId)
      .gte('completed_at', sevenDaysAgo.toISOString())
      .order('completed_at', { ascending: true })
    
    if (error) throw error
    
    // Group by day and sum minutes
    const dayMap = new Map<string, number>()
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    // Initialize last 7 days with 0
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayName = days[date.getDay()]
      dayMap.set(dayName, 0)
    }
    
    // Sum up actual session minutes
    data?.forEach(session => {
      const sessionDate = new Date(session.completed_at)
      const dayName = days[sessionDate.getDay()]
      const currentMinutes = dayMap.get(dayName) || 0
      dayMap.set(dayName, currentMinutes + (session.duration_minutes || 0))
    })
    
    // Convert to array format for chart
    const chartData = Array.from(dayMap.entries()).map(([day, minutes]) => ({
      day,
      minutes
    }))
    
    return chartData
  } catch (error) {
    console.error('Error fetching weekly learning data:', error)
    return []
  }
}

/**
 * Calculate daily activity for streak calendar (last 7 days)
 */
export async function getDailyActivity(userId: string) {
  try {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('completed_at')
      .eq('user_id', userId)
      .gte('completed_at', sevenDaysAgo.toISOString())
    
    if (error) throw error
    
    // Create activity map for last 7 days
    const activityMap = new Map<number, boolean>()
    
    // Initialize all days as inactive
    for (let i = 0; i < 7; i++) {
      activityMap.set(i, false)
    }
    
    // Mark days with sessions as active
    data?.forEach(session => {
      const sessionDate = new Date(session.completed_at)
      const dayOfWeek = sessionDate.getDay()
      activityMap.set(dayOfWeek, true)
    })
    
    // Convert to array (Sunday to Saturday)
    return Array.from(activityMap.values())
  } catch (error) {
    console.error('Error fetching daily activity:', error)
    return Array(7).fill(false)
  }
}

/**
 * Get all achievements with user progress
 */
export async function getAllAchievements(userId: string) {
  try {
    // Fetch all achievements
    const { data: allAchievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')
      .order('xp_requirement', { ascending: true })
    
    if (achievementsError) throw achievementsError
    
    // Fetch user's earned achievements
    const { data: userAchievements, error: userError } = await supabase
      .from('user_achievements')
      .select('achievement_id, earned_at, progress_value')
      .eq('user_id', userId)
    
    if (userError) throw userError
    
    // Fetch user profile for progress calculation
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('total_xp, streak_count')
      .eq('id', userId)
      .single()
    
    if (profileError) throw profileError
    
    // Fetch counts for progress calculation
    const [booksCount, projectsCount, focusCount] = await Promise.all([
      supabase.from('books').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('focus_sessions').select('id', { count: 'exact', head: true }).eq('user_id', userId)
    ])
    
    const earnedMap = new Map(
      userAchievements?.map(ua => [ua.achievement_id, ua]) || []
    )
    
    // Map achievements with status
    const achievementsWithStatus = allAchievements?.map(achievement => {
      const userAchievement = earnedMap.get(achievement.id)
      const isEarned = !!userAchievement
      
      // Calculate progress for non-earned achievements
      let progress = 0
      let total = 1
      
      if (!isEarned) {
        switch (achievement.achievement_type) {
          case 'milestone':
            // First Book Upload
            progress = booksCount.count || 0
            total = 1
            break
          case 'project':
            // Knowledge Seeker - first project milestone
            progress = projectsCount.count || 0
            total = 1
            break
          case 'streak':
            // Learning Streak - 7 days
            progress = profile?.streak_count || 0
            total = 7
            break
          case 'focus':
            // Focus Master - 10 sessions
            progress = focusCount.count || 0
            total = 10
            break
          default:
            progress = userAchievement?.progress_value || 0
            total = 1
        }
      }
      
      return {
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.badge_icon || '',
        earned: isEarned,
        earnedAt: userAchievement?.earned_at,
        progress: isEarned ? undefined : progress,
        total: isEarned ? undefined : total
      }
    }) || []
    
    return achievementsWithStatus
  } catch (error) {
    console.error('Error fetching achievements:', error)
    return []
  }
}

/**
 * Get count of SRS cards due for review
 */
export async function getDueCardsCount(userId: string) {
  try {
    const now = new Date().toISOString()
    
    const { count, error } = await supabase
      .from('srs_cards')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .lte('next_review', now)
    
    if (error) throw error
    
    return count || 0
  } catch (error) {
    console.error('Error fetching due cards count:', error)
    return 0
  }
}

/**
 * Get count of active projects
 */
export async function getActiveProjectsCount(userId: string) {
  try {
    const { count, error } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['active', 'in_progress'])
    
    if (error) throw error
    
    return count || 0
  } catch (error) {
    console.error('Error fetching active projects count:', error)
    return 0
  }
}

/**
 * Get count of books
 */
export async function getBooksCount(userId: string) {
  try {
    const { count, error } = await supabase
      .from('books')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    if (error) throw error
    
    return count || 0
  } catch (error) {
    console.error('Error fetching books count:', error)
    return 0
  }
}
