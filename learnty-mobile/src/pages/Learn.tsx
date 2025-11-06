import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Brain, MapPin, RotateCcw, Plus, Timer } from 'lucide-react'
import LearningPaths from './LearningPaths'

export default function Learn() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border-b border-border px-4 sm:px-6 pt-8 sm:pt-12 pb-6 sm:pb-8 rounded-b-3xl shadow-lg"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Learning Paths</h1>
            <p className="text-sm text-muted-foreground">AI-powered structured learning</p>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="px-4 sm:px-6 mt-6">
        <LearningPaths />
      </div>
    </div>
  )
}