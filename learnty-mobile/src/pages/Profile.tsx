import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { Camera, Mail, Star, TrendingUp, Flame, LogOut, Loader2, Edit2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { DarkModeToggle } from '@/components/DarkModeToggle'

export default function Profile() {
  const { user, profile, signOut, uploadAvatar, updateProfile } = useAuthStore()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setIsUploading(true)
    try {
      await uploadAvatar(file)
      toast.success('Profile picture updated!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast.error('Name cannot be empty')
      return
    }

    setIsSaving(true)
    try {
      await updateProfile({ full_name: fullName.trim() })
      toast.success('Profile updated!')
      setIsEditing(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }



  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 pt-12 pb-32 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 bg-secondary rounded-lg text-primary hover:bg-secondary/80 transition-colors"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Avatar and Info */}
      <div className="px-6 -mt-24 mb-6">
        <div className="bg-card rounded-2xl p-6 shadow-lg">
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                {isUploading ? (
                  <Loader2 className="w-12 h-12 text-primary-foreground animate-spin" />
                ) : profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-primary-foreground text-4xl font-bold">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {isEditing ? (
              <div className="w-full space-y-3">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Full Name"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setFullName(profile?.full_name || '')
                    }}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  {profile?.full_name || 'User'}
                </h2>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{user?.email}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>



      {/* Stats Card */}
      <div className="px-6 mb-6">
        <div className="bg-card rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-foreground mb-4">Your Stats</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-500/10 rounded-full mx-auto mb-2">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">{profile?.streak_count || 0}</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-full mx-auto mb-2">
                <Star className="w-6 h-6 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">{profile?.total_xp || 0}</div>
              <div className="text-sm text-muted-foreground">Total XP</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-500/10 rounded-full mx-auto mb-2">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">{profile?.level || 1}</div>
              <div className="text-sm text-muted-foreground">Level</div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Card */}
      <div className="px-6 mb-6">
        <div className="bg-card rounded-2xl p-6 shadow-lg space-y-4">
          <h2 className="text-xl font-bold text-foreground">Settings</h2>
          <DarkModeToggle />
          <button
            onClick={handleSignOut}
            className="w-full text-left p-3 rounded-lg text-red-500 hover:bg-red-500/10 flex items-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

    </div>
  )
}
