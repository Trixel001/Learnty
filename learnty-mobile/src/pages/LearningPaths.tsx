import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MapPin, Clock, Trophy, BookOpen, Play, CheckCircle, Lock, Target, Brain, Timer } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import TopicLearningGenerator from '@/components/TopicLearningGenerator'


interface Project {
  id: string
  title: string
  description: string
  book_id: string
  project_type: string
  completion_percentage: number
  status: string
  created_at: string
  books?: {
    title: string
    author: string
    ai_analysis?: any
  }
}

interface Milestone {
  id: string
  title: string
  description: string
  order_index: number
  is_completed: boolean
  difficulty_level: string
  estimated_minutes: number
  learning_objectives: string[]
  key_concepts: string[]
  content_preview: string
  xp_reward: number
  completion_score: number
}

export default function LearningPaths() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchLearningProjects()
    }
  }, [user])

  const fetchLearningProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          books (
            title,
            author,
            ai_analysis
          )
        `)
        .eq('user_id', user?.id)
        .in('project_type', ['s3_learning_path', 'topic_learning_path'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching learning projects:', error)
      toast.error('Failed to load learning paths')
    } finally {
      setLoading(false)
    }
  }

  const fetchMilestones = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index')

      if (error) throw error
      setMilestones(data || [])
    } catch (error) {
      console.error('Error fetching milestones:', error)
      toast.error('Failed to load milestones')
    }
  }

  const handleProjectSelect = async (project: Project) => {
    setSelectedProject(project)
    await fetchMilestones(project.id)
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'text-primary bg-green-100'
      case 'intermediate': return 'text-yellow-600 bg-yellow-100'
      case 'advanced': return 'text-red-600 bg-red-100'
      default: return 'text-muted-foreground bg-gray-100'
    }
  }

  const getMilestoneIcon = (milestone: Milestone, index: number) => {
    if (milestone.is_completed) return CheckCircle
    if (index === 0 || milestones[index - 1]?.is_completed) return Play
    return Lock
  }

  const getMilestoneColor = (milestone: Milestone, index: number) => {
    if (milestone.is_completed) return 'text-primary bg-green-100'
    if (index === 0 || milestones[index - 1]?.is_completed) return 'text-primary bg-blue-100'
    return 'text-gray-400 bg-gray-100'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-4 sm:space-y-6">
        <AnimatePresence mode="wait">
          {!selectedProject ? (
            // Projects Overview
            <motion.div
              key="projects"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {projects.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8 sm:py-12"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <Brain className="w-10 h-10 sm:w-12 sm:h-12 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">No Learning Paths Yet</h3>
                  <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base px-2">Create a custom learning path or upload books to get started</p>
                  
                  <div className="max-w-sm sm:max-w-md mx-auto space-y-3">
                    <TopicLearningGenerator onSuccess={fetchLearningProjects} />
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => window.location.href = '/books'}
                      className="w-full bg-card border-2 border-primary text-primary px-4 sm:px-6 py-3 sm:py-4 rounded-2xl font-semibold text-sm sm:text-base"
                    >
                      Or Upload a Book
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* Create New Learning Path Section */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 sm:mb-6"
                  >
                    <TopicLearningGenerator onSuccess={fetchLearningProjects} />
                  </motion.div>

                  {/* Existing Projects */}
                  {projects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleProjectSelect(project)}
                    className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex-1">
                        <h3 className="text-base sm:text-lg font-bold text-foreground mb-1">
                          {project.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                          {project.project_type === 'topic_learning_path' 
                            ? `📚 Custom Topic Learning` 
                            : `From: ${project.books?.title || 'Unknown Book'}`}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      </div>
                      <div className="text-right ml-2 sm:ml-4">
                        <div className="text-xl sm:text-2xl font-bold text-primary">
                          {project.completion_percentage}%
                        </div>
                        <div className="text-xs text-muted-foreground">Complete</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 mb-3 sm:mb-4">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${project.completion_percentage}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className="bg-primary h-1.5 sm:h-2 rounded-full"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center gap-2 sm:gap-4">
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">S3 Method</span>
                          <span className="sm:hidden">Method</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">Adaptive</span>
                        </div>
                      </div>
                      <span className="text-primary font-medium text-xs sm:text-sm">
                        {project.status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                  </motion.div>
                ))}
                </>
              )}
            </motion.div>
          ) : (
            // Milestone Map
            <motion.div
              key="milestones"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4 sm:space-y-6"
            >
              {/* Back Button & Project Info */}
              <div className="flex items-center justify-between">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedProject(null)}
                  className="text-primary font-medium text-sm sm:text-base"
                >
                  ← Back to Paths
                </motion.button>
                <div className="text-right">
                  <div className="text-xs sm:text-sm text-muted-foreground">Progress</div>
                  <div className="text-base sm:text-lg font-bold text-primary">
                    {selectedProject.completion_percentage}%
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                  {selectedProject.title}
                </h2>
                <p className="text-muted-foreground mb-3 sm:mb-4 text-sm sm:text-base">{selectedProject.description}</p>
                
                <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="truncate">{selectedProject.books?.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{milestones.length} Milestones</span>
                  </div>
                </div>
              </div>

              {/* Milestone Map */}
              <div className="space-y-3 sm:space-y-4">
                {milestones.map((milestone, index) => {
                  const Icon = getMilestoneIcon(milestone, index)
                  const isUnlocked = index === 0 || milestones[index - 1]?.is_completed
                  
                  return (
                    <motion.div
                      key={milestone.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={isUnlocked ? { scale: 1.02 } : {}}
                      whileTap={isUnlocked ? { scale: 0.98 } : {}}
                      onClick={() => isUnlocked && setSelectedMilestone(milestone)}
                      className={`bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg ${
                        isUnlocked ? 'cursor-pointer' : 'opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${getMilestoneColor(milestone, index)} shrink-0`}>
                          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm sm:text-lg font-bold text-foreground truncate">
                                {milestone.title}
                              </h3>
                              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                                {milestone.description}
                              </p>
                            </div>
                            <div className="text-right ml-2 shrink-0">
                              <div className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(milestone.difficulty_level)}`}>
                                {milestone.difficulty_level}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 flex-wrap">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>{milestone.estimated_minutes}m</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>{milestone.xp_reward} XP</span>
                            </div>
                            {milestone.is_completed && (
                              <div className="flex items-center gap-1 text-primary">
                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>Score: {milestone.completion_score}%</span>
                              </div>
                            )}
                          </div>

                          {milestone.learning_objectives.length > 0 && (
                            <div className="text-xs sm:text-sm text-muted-foreground">
                              <span className="font-medium">Objectives: </span>
                              <span className="line-clamp-1">{milestone.learning_objectives.slice(0, 2).join(', ')}</span>
                              {milestone.learning_objectives.length > 2 && '...'}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Milestone Detail Modal */}
      <AnimatePresence>
        {selectedMilestone && (
          <MilestoneDetailModal
            milestone={selectedMilestone}
            onClose={() => setSelectedMilestone(null)}
            onComplete={() => {
              // Refresh milestones after completion
              if (selectedProject) {
                fetchMilestones(selectedProject.id)
                fetchLearningProjects() // Refresh project progress
              }
              setSelectedMilestone(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Milestone Detail Modal Component
function MilestoneDetailModal({ 
  milestone, 
  onClose, 
  onComplete 
}: { 
  milestone: Milestone
  onClose: () => void
  onComplete: () => void
}) {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [isStudying, setIsStudying] = useState(false)
  const [completionData, setCompletionData] = useState({
    difficultyRating: 3,
    confidenceLevel: 3,
    notes: ''
  })

  const handleStartStudy = () => {
    setIsStudying(true)
    // Here you would implement the study session with timer
    // For now, we'll simulate it
    toast.success('Study session started!')
  }

  const handleCompleteStudy = async () => {
    try {
      const sessionDuration = milestone.estimated_minutes // Simulated
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/complete-milestone`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          milestoneId: milestone.id,
          userId: user?.id,
          performanceData: {
            sessionDuration,
            completionPercentage: 100,
            difficultyRating: completionData.difficultyRating,
            confidenceLevel: completionData.confidenceLevel,
            notesText: completionData.notes
          }
        })
      })

      if (!response.ok) throw new Error('Failed to complete milestone')

      const data = await response.json()
      toast.success(`Milestone completed! +${data.data.xpAwarded} XP`)
      onComplete()
    } catch (error) {
      console.error('Error completing milestone:', error)
      toast.error('Failed to complete milestone')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 sm:p-6 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl sm:rounded-3xl max-w-sm sm:max-w-lg w-full max-h-[80vh] overflow-y-auto"
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-foreground pr-2">{milestone.title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0"
            >
              ×
            </button>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="font-bold text-foreground mb-2 text-sm sm:text-base">Description</h3>
              <p className="text-muted-foreground text-sm sm:text-base">{milestone.description}</p>
            </div>

            {milestone.learning_objectives.length > 0 && (
              <div>
                <h3 className="font-bold text-foreground mb-2 text-sm sm:text-base">Learning Objectives</h3>
                <ul className="space-y-1">
                  {milestone.learning_objectives.map((objective, index) => (
                    <li key={index} className="text-muted-foreground text-xs sm:text-sm flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 shrink-0" />
                      <span className="leading-tight">{objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {milestone.key_concepts.length > 0 && (
              <div>
                <h3 className="font-bold text-foreground mb-2 text-sm sm:text-base">Key Concepts</h3>
                <div className="flex flex-wrap gap-2">
                  {milestone.key_concepts.map((concept, index) => (
                    <span
                      key={index}
                      className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{milestone.estimated_minutes} minutes</span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{milestone.xp_reward} XP</span>
              </div>
            </div>

            {!milestone.is_completed && (
              <div className="space-y-3 sm:space-y-4">
                {!isStudying ? (
                  <div className="space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleStartStudy}
                      className="w-full bg-primary text-primary-foreground py-2.5 sm:py-3 rounded-xl font-medium text-sm sm:text-base"
                    >
                      Start Learning Session
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/focus')}
                      className="w-full bg-primary text-primary-foreground py-2.5 sm:py-3 rounded-xl font-medium text-sm sm:text-base flex items-center justify-center gap-2"
                    >
                      <Timer className="w-4 h-4" />
                      Start with Focus Timer
                    </motion.button>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                      <h4 className="font-medium text-foreground mb-3 text-sm sm:text-base">Session Feedback</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs sm:text-sm text-muted-foreground">Difficulty Rating</label>
                          <div className="flex gap-1 sm:gap-2 mt-1">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                onClick={() => setCompletionData({...completionData, difficultyRating: rating})}
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm ${
                                  completionData.difficultyRating >= rating 
                                    ? 'bg-purple-500 text-white' 
                                    : 'bg-gray-200 text-muted-foreground'
                                }`}
                              >
                                {rating}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-xs sm:text-sm text-muted-foreground">Confidence Level</label>
                          <div className="flex gap-1 sm:gap-2 mt-1">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <button
                                key={level}
                                onClick={() => setCompletionData({...completionData, confidenceLevel: level})}
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm ${
                                  completionData.confidenceLevel >= level 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-gray-200 text-muted-foreground'
                                }`}
                              >
                                {level}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-xs sm:text-sm text-muted-foreground">Notes (Optional)</label>
                          <textarea
                            value={completionData.notes}
                            onChange={(e) => setCompletionData({...completionData, notes: e.target.value})}
                            className="w-full mt-1 p-2 border border-gray-200 rounded-lg text-xs sm:text-sm"
                            rows={2}
                            placeholder="Any thoughts or insights..."
                          />
                        </div>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCompleteStudy}
                      className="w-full bg-primary text-primary-foreground py-2.5 sm:py-3 rounded-xl font-medium text-sm sm:text-base"
                    >
                      Complete Milestone
                    </motion.button>
                  </div>
                )}
              </div>
            )}

            {milestone.is_completed && (
              <div className="bg-green-50 rounded-xl p-3 sm:p-4 text-center">
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-primary mx-auto mb-2" />
                <div className="text-green-800 font-medium text-sm sm:text-base">Milestone Completed!</div>
                <div className="text-primary text-xs sm:text-sm">Score: {milestone.completion_score}%</div>
              </div>
            )}
          </div>
        </div>
      </motion.div>


    </motion.div>
  )
}