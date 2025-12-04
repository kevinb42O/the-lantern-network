import { useState, useEffect } from 'react'
import { X, Star, HandHeart, Clock, Sparkle, Shield, ShieldCheck, Flag } from '@phosphor-icons/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { SupporterBadge } from '@/components/ui/supporter-badge'
import { supabase } from '@/lib/supabase'
import { getHighestBadge, getEarnedBadges, getNextBadge, getAllUserBadges, BADGES, getSupporterBadgeInfo } from '@/lib/economy'
import { toast } from 'sonner'
import type { ReportCategory, SupporterBadgeTier } from '@/lib/types'

const REPORT_CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: 'harassment', label: 'Harassment' },
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'safety_concern', label: 'Safety Concern' },
  { value: 'other', label: 'Other' }
]

export interface UserProfileData {
  user_id: string
  display_name: string
  avatar_url: string | null
  bio: string | null
  vibe_tags: string[]
  trust_score: number
  lantern_balance: number
  is_admin: boolean
  is_moderator: boolean
  badges: string[]
  completed_flares_count: number
  created_at: string
  supporter_badge?: SupporterBadgeTier
}

interface UserProfileModalProps {
  userId: string | null
  isOpen: boolean
  onClose: () => void
}

export function UserProfileModal({ userId, isOpen, onClose }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(false)
  const [helpCount, setHelpCount] = useState(0)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportCategory, setReportCategory] = useState<ReportCategory>('harassment')
  const [reportDescription, setReportDescription] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    if (userId && isOpen) {
      fetchProfile(userId)
      fetchCurrentUser()
    }
  }, [userId, isOpen])

  const fetchCurrentUser = async () => {
    const { data } = await supabase.auth.getUser()
    setCurrentUserId(data.user?.id || null)
  }

  const fetchProfile = async (id: string) => {
    setLoading(true)
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        return
      }

      // Fetch supporter badge if any
      const { data: supporterBadge } = await supabase
        .from('supporter_badges')
        .select('badge_type')
        .eq('user_id', id)
        .single()

      setProfile({
        ...profileData,
        supporter_badge: supporterBadge?.badge_type as SupporterBadgeTier | undefined
      } as UserProfileData)

      // Fetch completed help count
      const { count } = await supabase
        .from('flare_participants')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', id)
        .eq('status', 'completed')

      setHelpCount(count || 0)
    } catch (err) {
      console.error('Profile fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleReportUser = () => {
    setReportCategory('harassment')
    setReportDescription('')
    setShowReportModal(true)
  }

  const handleSubmitReport = async () => {
    if (!profile || !reportDescription.trim()) {
      toast.error('Please provide a description')
      return
    }

    setSubmittingReport(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        toast.error('You must be logged in to report')
        return
      }

      const { error } = await supabase.from('reports').insert({
        reporter_id: userData.user.id,
        reported_user_id: profile.user_id,
        report_type: 'user',
        target_id: null,
        category: reportCategory,
        description: reportDescription.trim(),
        status: 'pending'
      })

      if (error) {
        console.error('Error submitting report:', error)
        toast.error('Failed to submit report')
        return
      }

      toast.success('Report submitted. Thank you for helping keep our community safe.')
      setShowReportModal(false)
    } catch (err) {
      console.error('Report error:', err)
      toast.error('Failed to submit report')
    } finally {
      setSubmittingReport(false)
    }
  }

  if (!isOpen) return null

  // Calculate member duration
  const memberSince = profile?.created_at ? new Date(profile.created_at) : new Date()
  const daysSinceJoined = Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24))

  // Get badge based on completed flares AND admin-granted badges (display highest)
  const completedFlares = profile?.completed_flares_count || helpCount
  const adminBadges = profile?.badges || []
  const currentBadge = getHighestBadge(completedFlares, adminBadges)
  const earnedBadges = getEarnedBadges(completedFlares)
  const nextBadge = getNextBadge(completedFlares)
  
  // Get all user badges (earned + admin-granted, no duplicates)
  const allUserBadges = getAllUserBadges(completedFlares, adminBadges)
  
  // Get custom badges assigned by admin that are NOT already earned through flares
  const customBadges = adminBadges.length > 0
    ? BADGES.filter(b => adminBadges.includes(b.id) && !earnedBadges.some(eb => eb.id === b.id))
    : []
  
  // Total badge count is the unique badges the user has
  const totalBadgeCount = allUserBadges.length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : profile ? (
          <div className="flex flex-col">
            {/* Decorative header gradient */}
            <div className="h-24 bg-gradient-to-r from-primary/20 via-accent/15 to-primary/20 relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
              {/* Decorative circles */}
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-primary/10 blur-2xl" />
              <div className="absolute -top-2 left-8 w-16 h-16 rounded-full bg-accent/10 blur-xl" />
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80"
                onClick={onClose}
              >
                <X size={18} />
              </Button>
              {/* Report button - only show for other users */}
              {currentUserId && currentUserId !== profile.user_id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-12 rounded-full bg-background/50 backdrop-blur-sm hover:bg-red-500/20 hover:text-red-400"
                  onClick={handleReportUser}
                  title="Report user"
                >
                  <Flag size={18} />
                </Button>
              )}
            </div>

            {/* Profile content */}
            <div className="px-5 pb-5 -mt-14 relative">
              <div className="flex items-end gap-4 mb-4">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-card ring-2 ring-primary/30 shadow-xl">
                    <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/20 text-foreground text-2xl font-bold">
                      {profile.display_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Current badge icon */}
                  <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-full ${currentBadge.bgColor} shadow-lg ring-2 ring-card`}>
                    <span className="text-sm">{currentBadge.emoji}</span>
                  </div>
                </div>

                <div className="flex-1 pb-1">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2 flex-wrap">
                    {profile.display_name}
                    {profile.supporter_badge && (
                      <SupporterBadge badgeType={profile.supporter_badge} size="sm" />
                    )}
                    {profile.is_admin && (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs gap-1">
                        <Sparkle size={10} weight="fill" />
                        Admin
                      </Badge>
                    )}
                    {profile.is_moderator && !profile.is_admin && (
                      <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs gap-1">
                        <ShieldCheck size={10} weight="fill" />
                        Moderator
                      </Badge>
                    )}
                  </h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock size={14} />
                    {daysSinceJoined === 0 ? 'Joined today' : `Member for ${daysSinceJoined} day${daysSinceJoined !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>

              {/* Current Trust Badge */}
              <Card className={`p-4 mb-4 ${currentBadge.bgColor} border ${currentBadge.borderColor}`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{currentBadge.emoji}</span>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${currentBadge.color}`}>{currentBadge.name}</h3>
                    <p className="text-sm text-muted-foreground">{currentBadge.description}</p>
                  </div>
                </div>
                {nextBadge && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                      <span className="text-foreground font-medium">{nextBadge.flaresNeeded}</span> more completed flare{nextBadge.flaresNeeded !== 1 ? 's' : ''} until{' '}
                      <span className={nextBadge.badge.color}>{nextBadge.badge.emoji} {nextBadge.badge.name}</span>
                    </p>
                  </div>
                )}
              </Card>

              {/* Bio */}
              {profile.bio && (
                <p className="text-sm text-foreground/80 mb-4 italic">"{profile.bio}"</p>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star size={14} weight="fill" className="text-primary" />
                  </div>
                  <p className="text-xl font-bold text-foreground">{profile.trust_score}</p>
                  <p className="text-xs text-muted-foreground">Reputation</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <HandHeart size={14} weight="duotone" className="text-green-400" />
                  </div>
                  <p className="text-xl font-bold text-foreground">{completedFlares}</p>
                  <p className="text-xs text-muted-foreground">Helps Given</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Shield size={14} weight="duotone" className="text-amber-400" />
                  </div>
                  <p className="text-xl font-bold text-foreground">{totalBadgeCount}</p>
                  <p className="text-xs text-muted-foreground">Badges</p>
                </div>
              </div>

              {/* Supporter Badge (highest priority) */}
              {profile.supporter_badge && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">Supporter Badge</h4>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const supporterBadgeInfo = getSupporterBadgeInfo(profile.supporter_badge)
                      return (
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${supporterBadgeInfo.bgColor} ${supporterBadgeInfo.color} border-2 ${supporterBadgeInfo.borderColor} shadow-[0_0_10px_rgba(251,191,36,0.15)]`}
                          title={supporterBadgeInfo.description}
                        >
                          <span className="animate-pulse">{supporterBadgeInfo.emoji}</span>
                          <span>{supporterBadgeInfo.name}</span>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )}

              {/* Earned Badges */}
              {earnedBadges.length > 1 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">Earned Badges</h4>
                  <div className="flex flex-wrap gap-2">
                    {earnedBadges.map((badge) => (
                      <div
                        key={badge.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${badge.bgColor} ${badge.color} border ${badge.borderColor}`}
                        title={badge.description}
                      >
                        <span>{badge.emoji}</span>
                        <span>{badge.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Badges (assigned by admin) */}
              {customBadges.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">Special Badges</h4>
                  <div className="flex flex-wrap gap-2">
                    {customBadges.map((badge) => (
                      <div
                        key={`custom-${badge.id}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${badge.bgColor} ${badge.color} border-2 ${badge.borderColor} shadow-sm`}
                        title={`Special: ${badge.description}`}
                      >
                        <span>✨</span>
                        <span>{badge.emoji}</span>
                        <span>{badge.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skill tags */}
              {profile.vibe_tags?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.vibe_tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs bg-secondary/80 hover:bg-secondary border-0 rounded-lg px-3 py-1"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            User not found
          </div>
        )}
      </DialogContent>

      {/* Report User Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Flag size={24} weight="duotone" className="text-red-400" />
              Report User
            </DialogTitle>
            <DialogDescription>
              Help us keep the community safe by reporting inappropriate behavior
            </DialogDescription>
          </DialogHeader>

          {profile && (
            <div className="space-y-4 py-2">
              {/* User preview */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/20">
                    {profile.display_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{profile.display_name}</p>
                  <p className="text-xs text-muted-foreground">User being reported</p>
                </div>
              </div>

              {/* Category selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Category</Label>
                <div className="grid grid-cols-2 gap-2">
                  {REPORT_CATEGORIES.map((cat) => (
                    <Button
                      key={cat.value}
                      variant={reportCategory === cat.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setReportCategory(cat.value)}
                      className="rounded-xl text-xs"
                    >
                      {cat.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Description <span className="text-red-400">*</span>
                </Label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Please describe the issue with this user..."
                  className="w-full h-24 px-3 py-2 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setShowReportModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-red-500 hover:bg-red-600"
                  onClick={handleSubmitReport}
                  disabled={submittingReport || !reportDescription.trim()}
                >
                  {submittingReport ? 'Submitting...' : 'Submit Report'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
