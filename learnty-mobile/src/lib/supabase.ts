import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  learning_preferences: any
  streak_count: number
  total_xp: number
  level: number
  created_at: string
  updated_at: string
}

export type Achievement = {
  id: string
  title: string
  description: string | null
  badge_icon: string | null
  xp_requirement: number | null
  achievement_type: string | null
  created_at: string
}

export type UserAchievement = {
  id: string
  user_id: string
  achievement_id: string
  earned_at: string
  progress_value: number | null
  achievements: Achievement
}
