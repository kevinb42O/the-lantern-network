import { useState, useEffect } from 'react'
import { 
  MagnifyingGlass, 
  Medal, 
  Check, 
  X,
  Trash,
  ArrowLeft,
  User,
  Calendar,
  Note,
  Sparkle
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { SupporterBadge } from '@/components/ui/supporter-badge'
import { SUPPORTER_BADGES } from '@/lib/economy'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { SupporterBadgeTier, SupporterBadge as SupporterBadgeType } from '@/lib/types'

interface BadgeManagementProps {
  onBack: () => void
}

interface ProfileData {
  user_id: string
  display_name: string
  avatar_url: string | null
  created_at: string
}

interface SupporterWithProfile extends SupporterBadgeType {
  display_name: string
  avatar_url: string | null
}

export function BadgeManagement({ onBack }: BadgeManagementProps) {
  const [activeTab, setActiveTab] = useState<'grant' | 'list'>('grant')
  const [profiles, setProfiles] = useState<ProfileData[]>([])
  const [supporters, setSupporters] = useState<SupporterWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTier, setFilterTier] = useState<SupporterBadgeTier | 'all'>('all')

  // Grant badge modal state
  const [selectedUser, setSelectedUser] = useState<ProfileData | null>(null)
  const [selectedBadgeTier, setSelectedBadgeTier] = useState<SupporterBadgeTier>('supporter')
  const [badgeNotes, setBadgeNotes] = useState('')
  const [showGrantModal, setShowGrantModal] = useState(false)
  const [granting, setGranting] = useState(false)

  // Revoke badge confirmation
  const [badgeToRevoke, setBadgeToRevoke] = useState<SupporterWithProfile | null>(null)
  const [revoking, setRevoking] = useState(false)

  useEffect(() => {
    fetchProfiles()
    fetchSupporters()
  }, [])

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, created_at')
        .order('display_name', { ascending: true })

      if (error) {
        console.error('Error fetching profiles:', error)
        return
      }

      setProfiles(data || [])
    } catch (err) {
      console.error('Profiles fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSupporters = async () => {
    try {
      const { data, error } = await supabase
        .from('supporter_badges')
        .select(`
          *,
          profiles!supporter_badges_user_id_fkey (
            display_name,
            avatar_url
          ),
          granter:profiles!supporter_badges_granted_by_fkey (
            display_name
          )
        `)
        .order('granted_at', { ascending: false })

      if (error) {
        console.error('Error fetching supporters:', error)
        return
      }

      const formattedSupporters: SupporterWithProfile[] = (data || []).map((s: {
        id: string
        user_id: string
        badge_type: SupporterBadgeTier
        notes: string | null
        granted_at: string
        granted_by: string
        profiles: { display_name: string; avatar_url: string | null } | null
        granter: { display_name: string } | null
      }) => ({
        id: s.id,
        user_id: s.user_id,
        badge_type: s.badge_type as SupporterBadgeTier,
        notes: s.notes,
        granted_at: s.granted_at,
        granted_by: s.granted_by,
        granted_by_name: s.granter?.display_name || 'Unknown',
        display_name: s.profiles?.display_name || 'Unknown',
        avatar_url: s.profiles?.avatar_url || null
      }))

      setSupporters(formattedSupporters)
    } catch (err) {
      console.error('Supporters fetch error:', err)
    }
  }

  const openGrantModal = (profile: ProfileData) => {
    // Check if user already has a badge
    const existingBadge = supporters.find(s => s.user_id === profile.user_id)
    if (existingBadge) {
      toast.error(`${profile.display_name} already has a supporter badge`)
      return
    }

    setSelectedUser(profile)
    setSelectedBadgeTier('supporter')
    setBadgeNotes('')
    setShowGrantModal(true)
  }

  const handleGrantBadge = async () => {
    if (!selectedUser) return

    setGranting(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        toast.error('Not authenticated')
        return
      }

      const { error } = await supabase.from('supporter_badges').insert({
        user_id: selectedUser.user_id,
        badge_type: selectedBadgeTier,
        notes: badgeNotes.trim() || null,
        granted_by: userData.user.id
      })

      if (error) {
        console.error('Error granting badge:', error)
        toast.error(`Failed to grant badge: ${error.message}`)
        return
      }

      toast.success(`Granted ${SUPPORTER_BADGES.find(b => b.id === selectedBadgeTier)?.name} badge to ${selectedUser.display_name}!`)
      setShowGrantModal(false)
      fetchSupporters()
    } catch (err) {
      console.error('Grant badge error:', err)
      toast.error('Failed to grant badge')
    } finally {
      setGranting(false)
    }
  }

  const handleRevokeBadge = async () => {
    if (!badgeToRevoke) return

    setRevoking(true)
    try {
      const { error } = await supabase
        .from('supporter_badges')
        .delete()
        .eq('id', badgeToRevoke.id)

      if (error) {
        console.error('Error revoking badge:', error)
        toast.error('Failed to revoke badge')
        return
      }

      toast.success(`Revoked badge from ${badgeToRevoke.display_name}`)
      setBadgeToRevoke(null)
      fetchSupporters()
    } catch (err) {
      console.error('Revoke badge error:', err)
      toast.error('Failed to revoke badge')
    } finally {
      setRevoking(false)
    }
  }

  const filteredProfiles = profiles.filter(p =>
    p.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredSupporters = supporters.filter(s =>
    filterTier === 'all' || s.badge_type === filterTier
  )

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-5 border-b border-border bg-gradient-to-b from-amber-950/20 via-card/80 to-transparent">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="rounded-xl"
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Medal size={24} weight="duotone" className="text-amber-400" />
                Supporter Badges
              </h1>
              <p className="text-sm text-muted-foreground">
                Grant and manage supporter badges
              </p>
            </div>
          </div>

          {/* Tab Buttons */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'grant' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('grant')}
              className="gap-2 rounded-xl"
            >
              <Sparkle size={16} />
              Grant Badge
            </Button>
            <Button
              variant={activeTab === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('list')}
              className="gap-2 rounded-xl"
            >
              <Medal size={16} />
              Supporters ({supporters.length})
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 max-w-2xl mx-auto">
          {activeTab === 'grant' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search users by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProfiles.slice(0, 20).map((profile) => {
                    const hasBadge = supporters.some(s => s.user_id === profile.user_id)
                    return (
                      <Card
                        key={profile.user_id}
                        className={`p-4 bg-card/80 border-border/50 transition-colors ${hasBadge ? 'opacity-60' : 'hover:bg-card/90 cursor-pointer'}`}
                        onClick={() => !hasBadge && openGrantModal(profile)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 ring-2 ring-border">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/20">
                              {profile.display_name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-foreground truncate block">
                              {profile.display_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Member since {new Date(profile.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {hasBadge ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                              Has Badge
                            </Badge>
                          ) : (
                            <Button size="sm" variant="outline" className="rounded-xl gap-1">
                              <Medal size={14} />
                              Grant
                            </Button>
                          )}
                        </div>
                      </Card>
                    )
                  })}
                  {searchQuery && filteredProfiles.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No users found matching "{searchQuery}"
                    </div>
                  )}
                  {!searchQuery && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Showing first 20 users. Use search to find specific users.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'list' && (
            <div className="space-y-4">
              {/* Filter by tier */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filterTier === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterTier('all')}
                  className="rounded-xl"
                >
                  All
                </Button>
                {SUPPORTER_BADGES.map((badge) => (
                  <Button
                    key={badge.id}
                    variant={filterTier === badge.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterTier(badge.id)}
                    className={`rounded-xl gap-1 ${filterTier === badge.id ? badge.bgColor : ''}`}
                  >
                    <span>{badge.emoji}</span>
                    <span className="hidden sm:inline">{badge.name}</span>
                  </Button>
                ))}
              </div>

              {supporters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Medal size={40} className="mx-auto mb-2 opacity-50" />
                  No supporter badges granted yet
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSupporters.map((supporter) => (
                    <Card key={supporter.id} className="p-4 bg-card/80 border-border/50">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-border">
                          <AvatarImage src={supporter.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/20">
                            {supporter.display_name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground">
                              {supporter.display_name}
                            </span>
                            <SupporterBadge badgeType={supporter.badge_type} size="sm" showLabel />
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {new Date(supporter.granted_at).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <User size={12} />
                              by {supporter.granted_by_name}
                            </span>
                          </div>
                          {supporter.notes && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                              <Note size={12} className="mt-0.5 shrink-0" />
                              {supporter.notes}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setBadgeToRevoke(supporter)}
                          className="text-destructive hover:bg-destructive/10 rounded-xl shrink-0"
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Grant Badge Modal */}
      <Dialog open={showGrantModal} onOpenChange={setShowGrantModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Medal size={24} weight="duotone" className="text-amber-400" />
              Grant Supporter Badge
            </DialogTitle>
            <DialogDescription>
              Recognize this user's support with a badge
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-5 py-2">
              {/* User Info */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/20 text-lg">
                    {selectedUser.display_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-foreground">{selectedUser.display_name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Member since {new Date(selectedUser.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Badge Tier Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select Badge Tier</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SUPPORTER_BADGES.map((badge) => (
                    <Button
                      key={badge.id}
                      variant={selectedBadgeTier === badge.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedBadgeTier(badge.id)}
                      className={`rounded-xl gap-1.5 h-auto py-3 flex-col ${
                        selectedBadgeTier === badge.id 
                          ? `${badge.bgColor} ${badge.color} border ${badge.borderColor}`
                          : ''
                      }`}
                    >
                      <span className="text-lg">{badge.emoji}</span>
                      <span className="text-xs">{badge.name}</span>
                      <span className="text-[10px] opacity-60">${badge.minAmount}+</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Notes (optional)
                </Label>
                <textarea
                  value={badgeNotes}
                  onChange={(e) => setBadgeNotes(e.target.value)}
                  placeholder="e.g., Donated $20 via Ko-fi on Dec 1"
                  className="w-full h-20 px-3 py-2 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setShowGrantModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl gap-2 bg-emerald-500 hover:bg-emerald-600"
                  onClick={handleGrantBadge}
                  disabled={granting}
                >
                  {granting ? (
                    'Granting...'
                  ) : (
                    <>
                      <Check size={16} />
                      Grant Badge
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke Badge Confirmation */}
      <Dialog open={!!badgeToRevoke} onOpenChange={() => setBadgeToRevoke(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Revoke Supporter Badge?</DialogTitle>
            <DialogDescription>
              This will remove the supporter badge from {badgeToRevoke?.display_name}. 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setBadgeToRevoke(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl gap-2"
              onClick={handleRevokeBadge}
              disabled={revoking}
            >
              {revoking ? (
                'Revoking...'
              ) : (
                <>
                  <X size={16} />
                  Revoke Badge
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
