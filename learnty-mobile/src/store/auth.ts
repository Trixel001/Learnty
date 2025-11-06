import { create } from 'zustand'
import { supabase, Profile, UserAchievement } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  profile: Profile | null
  achievements: UserAchievement[]
  isLoading: boolean
  hasCompletedOnboarding: boolean
  timeLeft: number
  isTimerActive: boolean
  timerMode: 'focus' | 'shortBreak' | 'longBreak'
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setAchievements: (achievements: UserAchievement[]) => void
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  loadProfile: () => Promise<void>
  loadAchievements: () => Promise<void>
  completeOnboarding: () => void
  uploadAvatar: (file: File) => Promise<string | null>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  initializeAuth: () => Promise<void>
  setTimerState: (state: Partial<Pick<AuthState, 'timeLeft' | 'isTimerActive' | 'timerMode'>>) => void
  decrementTimer: () => void
  resetTimer: (mode: 'focus' | 'shortBreak' | 'longBreak') => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  achievements: [],
  isLoading: true,
  hasCompletedOnboarding: localStorage.getItem('onboarding_completed') === 'true',
  timeLeft: 25 * 60,
  isTimerActive: false,
  timerMode: 'focus',

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setAchievements: (achievements) => set({ achievements }),
  
  setTimerState: (newState) => set(newState),
  
  decrementTimer: () => set((state) => {
    if (state.timeLeft > 0) {
      return { timeLeft: state.timeLeft - 1 }
    }
    return { isTimerActive: false }
  }),
  
  resetTimer: (mode) => {
    let newTime: number
    if (mode === 'shortBreak') newTime = 5 * 60
    else if (mode === 'longBreak') newTime = 15 * 60
    else newTime = 25 * 60
    set({ timeLeft: newTime, timerMode: mode, isTimerActive: false })
  },

  signUp: async (email, password, fullName) => {
    set({ isLoading: true })
    try {
      // Sign up with email redirect for verification
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) {
        // Provide user-friendly error messages
        if (error.message.includes('email_address_invalid') || error.message.includes('invalid')) {
          throw new Error('Please use a valid email address from a real email provider (e.g., Gmail, Outlook).')
        }
        throw error
      }
      if (!data.user) throw new Error('No user returned')

      // Create profile directly in database
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          full_name: fullName,
          total_xp: 0,
          level: 1,
          current_streak: 0,
          longest_streak: 0,
          books_read: 0,
          study_minutes: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Don't throw error if profile creation fails - user can still verify email
        // Profile will be created later if needed
      }

      console.log('[Auth] Sign up successful, awaiting email verification')
    } catch (error: any) {
      // User-friendly error messages
      const message = error.message.includes('already registered') || error.message.includes('User already registered')
        ? 'This email is already registered. Please sign in instead.'
        : error.message.includes('Unable to complete registration')
        ? error.message
        : error.message || 'Registration failed. Please try again.'
      throw new Error(message)
    } finally {
      set({ isLoading: false })
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      if (!data.user) throw new Error('No user returned')

      console.log('[Auth] Sign in successful, user:', data.user.email)
      
      // Set user and stop loading immediately
      set({ user: data.user, isLoading: false })
      
      // Load user data in background
      get().loadProfile().catch(err => console.error('Failed to load profile:', err))
      get().loadAchievements().catch(err => console.error('Failed to load achievements:', err))
      
    } catch (error: any) {
      set({ isLoading: false })
      throw new Error(error.message || 'Sign in failed')
    }
  },

  signOut: async () => {
    console.log('[Auth] Signing out...')
    
    // Clear all state first
    set({ 
      user: null, 
      profile: null, 
      achievements: [], 
      isLoading: false 
    })
    
    // Clear onboarding status
    localStorage.removeItem('onboarding_completed')
    set({ hasCompletedOnboarding: false })
    
    // Sign out from Supabase
    await supabase.auth.signOut()
    
    console.log('[Auth] Sign out complete')
  },

  loadProfile: async () => {
    const user = get().user
    if (!user) {
      console.log('[Auth] No user, skipping profile load')
      return
    }

    try {
      console.log('[Auth] Loading profile for user:', user.email)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error('[Auth] Error loading profile:', error)
        return
      }

      if (data) {
        console.log('[Auth] Profile loaded successfully')
        set({ profile: data })
      } else {
        console.warn('[Auth] No profile found for user, creating one')
        // Create profile if it doesn't exist
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: user.email?.split('@')[0] || 'User',
            total_xp: 0,
            level: 1,
            current_streak: 0,
            longest_streak: 0,
            books_read: 0,
            study_minutes: 0
          })
        
        if (!insertError) {
          // Load again after creating
          await get().loadProfile()
        }
      }
    } catch (error) {
      console.error('[Auth] Profile loading error:', error)
    }
  },

  loadAchievements: async () => {
    const user = get().user
    if (!user) {
      console.log('[Auth] No user, skipping achievements load')
      return
    }

    try {
      console.log('[Auth] Loading achievements for user:', user.email)
      
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievements(*)')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false })

      if (error) {
        console.error('[Auth] Error loading achievements:', error)
        return
      }

      console.log('[Auth] Achievements loaded:', data?.length || 0)
      set({ achievements: data || [] })
    } catch (error) {
      console.error('[Auth] Achievements loading error:', error)
    }
  },

  completeOnboarding: () => {
    localStorage.setItem('onboarding_completed', 'true')
    set({ hasCompletedOnboarding: true })
  },

  uploadAvatar: async (file: File) => {
    const user = get().user
    if (!user) throw new Error('No user logged in')

    // Convert file to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string
          const { data, error } = await supabase.functions.invoke('upload-avatar', {
            body: {
              imageData: base64Data,
              fileName: `${Date.now()}-${file.name}`,
              userId: user.id
            }
          })

          if (error) throw error
          const url = data?.data?.publicUrl
          if (url) {
            await get().loadProfile()
          }
          resolve(url)
        } catch (err: any) {
          reject(err)
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  },

  updateProfile: async (updates) => {
    const user = get().user
    if (!user) throw new Error('No user logged in')

    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) throw error
    await get().loadProfile()
  },

  initializeAuth: async () => {
    try {
      console.log('[Auth] Starting initialization...')
      set({ isLoading: true })
      
      // Get current user
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        console.error('[Auth] Error getting user:', error)
        set({ isLoading: false, user: null })
        return
      }

      if (user) {
        console.log('[Auth] User found:', user.email)
        set({ user, isLoading: false })
        
        // Load user data in background
        get().loadProfile().catch(err => console.error('Failed to load profile:', err))
        get().loadAchievements().catch(err => console.error('Failed to load achievements:', err))
      } else {
        console.log('[Auth] No user session found')
        set({ isLoading: false, user: null })
      }
    } catch (error) {
      console.error('[Auth] Initialization error:', error)
      set({ user: null, profile: null, achievements: [], isLoading: false })
    }
  },
}))

// Initialize auth state on app start
console.log('[Auth] Initializing auth store...')
useAuthStore.getState().initializeAuth()

// Listen to auth changes - KEEP SIMPLE, no async operations
supabase.auth.onAuthStateChange((_event, session) => {
  console.log('[Auth] State change event:', _event, 'hasSession:', !!session)
  
  // NEVER use async operations in this callback
  const { setUser, loadProfile, loadAchievements } = useAuthStore.getState()
  
  if (_event === 'SIGNED_OUT') {
    console.log('[Auth] User signed out event')
    setUser(null)
    useAuthStore.setState({ 
      profile: null, 
      achievements: [],
      isLoading: false
    })
  } else if (session?.user) {
    console.log('[Auth] Auth event with user:', session.user.email)
    setUser(session.user)
    
    // Load data in background (outside the callback)
    if (_event === 'SIGNED_IN' || _event === 'USER_UPDATED') {
      Promise.all([
        loadProfile(),
        loadAchievements()
      ]).catch(err => console.error('Failed to load user data:', err))
    }
  }
})
