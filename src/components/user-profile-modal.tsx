import { useState, useEffect } from 'react'
import { X, Star, HandHeart, Clock, Sparkle, Shield, ShieldCheck } from '@phosphor-icons/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { getBadgeForFlareCount, getEarnedBadges, getNextBadge, BADGES } from '@/lib/economy'

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

  useEffect(() => {
    if (userId && isOpen) {
      fetchProfile(userId)
    }
  }, [userId, isOpen])

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

      setProfile(profileData as UserProfileData)

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

  if (!isOpen) return null

  // Calculate member duration
  const memberSince = profile?.created_at ? new Date(profile.created_at) : new Date()
  const daysSinceJoined = Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24))

  // Get badge based on completed flares
  const completedFlares = profile?.completed_flares_count || helpCount
  const currentBadge = getBadgeForFlareCount(completedFlares)
  const earnedBadges = getEarnedBadges(completedFlares)
  const nextBadge = getNextBadge(completedFlares)
  
  // Get custom badges assigned by admin (these are additive to earned badges)
  const customBadges = profile?.badges 
    ? BADGES.filter(b => profile.badges.includes(b.id))
    : []
  
  // Total badge count combines earned badges (from helping) and custom badges (from admin)
  const totalBadgeCount = earnedBadges.length + customBadges.length

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
    </Dialog>
  )
}
