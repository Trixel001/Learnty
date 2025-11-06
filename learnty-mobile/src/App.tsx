// Enhanced error logging
console.log('App.tsx loaded')

import React, { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { useAuthStore } from './store/auth'
import Onboarding from './pages/Onboarding'
import Auth from './pages/Auth'
import AuthCallback from './pages/AuthCallback'
import PendingConfirmation from './pages/PendingConfirmation'
import Home from './pages/Home'
import Profile from './pages/Profile'
import { ErrorBoundary } from './components/ErrorBoundary'
import BookLoader from './components/BookLoader'
import { Home as HomeIcon, BookOpen, Brain, RotateCcw, Timer, User } from 'lucide-react'
import Books from './pages/Books'
import LearningPaths from './pages/LearningPaths'
import Review from './pages/Review'
import Focus from './pages/Focus'
import FocusAnalytics from './pages/FocusAnalytics'
import Library from './pages/Library'
import Learn from './pages/Learn'
import BookDetailPage from './pages/BookDetailPage'
import AIChatbot from './components/AIChatbot'



function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, hasCompletedOnboarding, isLoading } = useAuthStore()

  console.log('ProtectedRoute check:', { user: !!user, hasCompletedOnboarding, isLoading })

  // Show loading while auth is being checked
  if (isLoading) {
    return <BookLoader fullscreen />
  }

  // Check onboarding status first
  if (!hasCompletedOnboarding) {
    console.log('Redirecting to onboarding - not completed')
    return <Navigate to="/onboarding" replace />
  }

  // Then check user authentication
  if (!user) {
    console.log('Redirecting to auth - no user')
    return <Navigate to="/auth" replace />
  }

  console.log('ProtectedRoute - access granted')
  return <>{children}</>
}

function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    { path: '/home', icon: HomeIcon, label: 'Home' },
    { path: '/library', icon: BookOpen, label: 'Library' },
    { path: '/learn', icon: Brain, label: 'Learn' },
    { path: '/review', icon: RotateCcw, label: 'Review' }
  ]

  const showNav = navItems.some(item => location.pathname.startsWith(item.path)) || 
                  location.pathname.startsWith('/focus') ||
                  location.pathname.startsWith('/book/')
  if (!showNav) return null

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200 px-1 sm:px-2 py-1 sm:py-2 safe-area-bottom z-50 shadow-lg"
    >
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname.startsWith(item.path)
          
          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              whileTap={{ scale: 0.95 }}
              className="relative flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  y: isActive ? -2 : 0
                }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Icon 
                  className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`} 
                />
              </motion.div>
              <span className={`text-xs font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}

function ComingSoon({ title, week }: { title: string; week: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen flex flex-col items-center justify-center p-6"
    >
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <motion.div 
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1
          }}
          className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg"
        >
          <span className="text-4xl">🚀</span>
        </motion.div>
        <h1 className="text-3xl font-bold text-foreground mb-4">{title}</h1>
        <p className="text-lg text-muted-foreground mb-2">Coming in {week}</p>
        <p className="text-muted-foreground">This feature is under development</p>
      </motion.div>
    </motion.div>
  )
}

function AppContent() {
  const { user, hasCompletedOnboarding, isLoading } = useAuthStore()
  const location = useLocation()
  const mountedRef = useRef(true)

  // Global timer effect - simplified and safe
  const isTimerActive = useAuthStore((state) => state.isTimerActive)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isTimerActive && mountedRef.current) {
      interval = setInterval(() => {
        // Get fresh reference to avoid stale closure
        if (mountedRef.current) {
          useAuthStore.getState().decrementTimer()
        }
      }, 1000)
    }
    
    // Cleanup function properly clears interval
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isTimerActive])

  console.log('AppContent render:', { user: !!user, hasCompletedOnboarding, isLoading, pathname: location.pathname })

  // Show loading spinner while auth is initializing
  if (isLoading) {
    return <BookLoader fullscreen />
  }

  // Add padding bottom for bottom nav on protected routes
  const needsPadding = user && hasCompletedOnboarding && 
    ['/home', '/books', '/learning-paths', '/projects', '/review', '/profile', '/menu', '/library', '/learn', '/focus', '/book'].some(path => location.pathname.startsWith(path))

  return (
    <div className={needsPadding ? 'pb-20' : ''}>
      <Routes>
        <Route path="/onboarding" element={
          !hasCompletedOnboarding ? <Onboarding /> : <Navigate to="/auth" replace />
        } />
        <Route path="/auth" element={
          !user ? <Auth /> : <Navigate to="/home" replace />
        } />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/pending-confirmation" element={<PendingConfirmation />} />
        <Route path="/home" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/books" element={
          <ProtectedRoute>
            <ErrorBoundary>
              <Books />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/learning-paths" element={
          <ProtectedRoute>
            <ErrorBoundary>
              <LearningPaths />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/library" element={
          <ProtectedRoute>
            <ErrorBoundary>
              <Library />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/learn" element={
          <ProtectedRoute>
            <ErrorBoundary>
              <Learn />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/review" element={
          <ProtectedRoute>
            <ErrorBoundary>
              <Review />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/book/:id" element={
          <ProtectedRoute>
            <ErrorBoundary>
              <BookDetailPage />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/focus" element={
          <ProtectedRoute>
            <ErrorBoundary>
              <Focus />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/focus/analytics" element={
          <ProtectedRoute>
            <ErrorBoundary>
              <FocusAnalytics />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
        <Route path="/" element={
          <Navigate to={
            !hasCompletedOnboarding ? "/onboarding" :
            !user ? "/auth" : "/home"
          } replace />
        } />
      </Routes>
      <BottomNav />
      
      {/* Global AI Chatbot - available on all pages, positioned above bottom nav */}
      <AIChatbot />
    </div>
  )
}

export default function App() {
  console.log('App component render')
  
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '12px',
            },
          }}
        />
      </BrowserRouter>
    </ErrorBoundary>
  )
}