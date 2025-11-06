import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { GraduationCap, Brain, Hammer, TrendingUp, ChevronRight, X, ChevronLeft } from 'lucide-react'
import { motion } from 'framer-motion'

const slides = [
  {
    title: 'Welcome to Learnty',
    subtitle: 'Your AI-powered learning companion',
    description: 'Transform books into interactive learning experiences using cognitive science principles.',
    icon: GraduationCap,
    gradient: 'from-blue-500 to-purple-600'
  },
  {
    title: 'Learn with Science',
    subtitle: "Based on Dehaene's Four Pillars",
    description: 'Attention, Active Engagement, Error Feedback, and Consolidation - all built into your learning journey.',
    icon: Brain,
    gradient: 'from-purple-500 to-pink-600'
  },
  {
    title: 'Build Projects, Not Notes',
    subtitle: 'Apply knowledge through projects',
    description: 'Break down learning into small, simple steps (S3) with AI-generated milestones.',
    icon: Hammer,
    gradient: 'from-pink-500 to-orange-600'
  },
  {
    title: 'Master Through Practice',
    subtitle: 'Spaced repetition system',
    description: 'Active recall with confidence-based reviews ensures long-term retention.',
    icon: TrendingUp,
    gradient: 'from-orange-500 to-red-600'
  }
]

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const navigate = useNavigate()
  const completeOnboarding = useAuthStore(state => state.completeOnboarding)
  const touchRef = useRef<HTMLDivElement>(null)

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      completeOnboarding()
      navigate('/auth')
    }
  }

  const handleSkip = () => {
    completeOnboarding()
    navigate('/auth')
  }

  // Touch handlers for swipe functionality
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && currentSlide < slides.length - 1) {
      // Swipe left - next slide
      handleNext()
    }
    if (isRightSwipe && currentSlide > 0) {
      // Swipe right - previous slide
      setCurrentSlide(currentSlide - 1)
    }
  }

  const slide = slides[currentSlide]
  const Icon = slide.icon

  return (
    <div 
      ref={touchRef}
      className="min-h-screen bg-background flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Navigation buttons */}
      <div className="absolute top-4 left-4 right-4 z-10 pt-safe flex justify-between items-center">
        {currentSlide > 0 && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setCurrentSlide(currentSlide - 1)}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors backdrop-blur-sm"
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
        )}
        {currentSlide < slides.length - 1 && (
          <div className="absolute right-4">
            <button
              onClick={handleSkip}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors backdrop-blur-sm"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 relative">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="w-full flex flex-col items-center"
        >
          <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-primary flex items-center justify-center mb-6 sm:mb-8 shadow-lg`}>
            <Icon className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground text-center mb-3 sm:mb-4">
            {slide.title}
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl font-semibold text-primary text-center mb-3 sm:mb-4">
            {slide.subtitle}
          </p>
          
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground text-center max-w-sm sm:max-w-md leading-relaxed px-2">
            {slide.description}
          </p>
        </motion.div>
      </div>

      {/* Progress indicators */}
      <div className="flex justify-center gap-2 mb-6 sm:mb-8 px-6">
        {slides.map((_, index) => (
          <motion.div
            key={index}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              index === currentSlide
                ? 'w-6 sm:w-8 bg-blue-600'
                : 'w-2 bg-gray-300 hover:bg-gray-400'
            }`}
            onClick={() => setCurrentSlide(index)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          />
        ))}
      </div>

      {/* Next/Get Started button */}
      <div className="px-4 sm:px-6 pb-6 sm:pb-8 pt-2">
        <button
          onClick={handleNext}
          className="w-full bg-primary text-primary-foreground py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 active:scale-95"
        >
          {currentSlide < slides.length - 1 ? (
            <>
              Continue
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </>
          ) : (
            'Get Started'
          )}
        </button>
      </div>
    </div>
  )
}
