import { useState, useEffect } from 'react'
import { 
  ShieldCheck, 
  Users, 
  Fire, 
  ChatCircleDots, 
  Trash, 
  CurrencyCircleDollar,
  Medal,
  MagnifyingGlass,
  CaretDown,
  Check,
  X,
  Sparkle,
  Warning
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { BADGES, getHighestBadge } from '@/lib/economy'
import { toast } from 'sonner'
import type { User } from '@/lib/types'

interface ProfileData {
  id: string
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

interface FlareData {
  id: string
  creator_id: string
  title: string
  description: string
  category: string
  status: string
  created_at: string
  creator_name?: string
}

interface AdminViewProps {
  user: User
  onRemoveFlare: (flareId: string) => Promise<void>
  onClearCampfire: () => Promise<void>
}

export function AdminView({ user, onRemoveFlare, onClearCampfire }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'flares' | 'campfire'>('users')
  const [profiles, setProfiles] = useState<ProfileData[]>([])
  const [flares, setFlares] = useState<FlareData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Selected user for editing
  const [selectedUser, setSelectedUser] = useState<ProfileData | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [creditsToAdd, setCreditsToAdd] = useState(0)
  const [selectedBadges, setSelectedBadges] = useState<string[]>([])
  const [isModerator, setIsModerator] = useState(false)
  const [updating, setUpdating] = useState(false)

  // Confirm dialogs
  const [showClearCampfireConfirm, setShowClearCampfireConfirm] = useState(false)
  const [flareToDelete, setFlareToDelete] = useState<FlareData | null>(null)

  useEffect(() => {
    fetchProfiles()
    fetchFlares()
  }, [])

  const fetchProfiles = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching profiles:', error)
        toast.error('Failed to fetch users')
        return
      }

      setProfiles(data || [])
    } catch (err) {
      console.error('Profiles fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchFlares = async () => {
    try {
      const { data: flaresData, error } = await supabase
        .from('flares')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching flares:', error)
        return
      }

      // Get creator names
      const creatorIds = [...new Set(flaresData?.map(f => f.creator_id) || [])]
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', creatorIds)

      const profileMap: Record<string, string> = {}
      profilesData?.forEach(p => {
        profileMap[p.user_id] = p.display_name
      })

      const flaresWithNames = (flaresData || []).map(f => ({
        ...f,
        creator_name: profileMap[f.creator_id] || 'Unknown'
      }))

      setFlares(flaresWithNames)
    } catch (err) {
      console.error('Flares fetch error:', err)
    }
  }

  const openUserModal = (profile: ProfileData) => {
    setSelectedUser(profile)
    setSelectedBadges(profile.badges || [])
    setIsModerator(profile.is_moderator)
    setCreditsToAdd(0)
    setShowUserModal(true)
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    setUpdating(true)
    try {
      const updates: Record<string, unknown> = {
        is_moderator: isModerator,
        badges: selectedBadges,
        updated_at: new Date().toISOString()
      }

      // If adding credits, update balance and record transaction
      if (creditsToAdd > 0) {
        updates.lantern_balance = selectedUser.lantern_balance + creditsToAdd
      }

      // Update profile first
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', selectedUser.user_id)

      if (error) {
        console.error('Error updating user:', error)
        toast.error(`Failed to update user: ${error.message || 'Unknown error'}`)
        return
      }

      // Record the transaction after successful profile update
      if (creditsToAdd > 0) {
        const { error: txError } = await supabase.from('transactions').insert({
          user_id: selectedUser.user_id,
          type: 'bonus',
          amount: creditsToAdd,
          description: 'Admin bonus credits'
        })

        if (txError) {
          console.error('Error recording transaction:', txError)
          // Transaction record failed but credits were added
          // With the new RLS policy, this should work, but log details if it fails
          toast.warning(`Credits added but transaction log failed: ${txError.message || 'Database permission error'}`)
        } else {
          // Transaction recorded successfully - show success with credits added
          toast.success(`Added ${creditsToAdd} credits to ${selectedUser.display_name}!`)
        }
      }

      // Show general success if no credits were added or if we didn't already show a credits-specific message
      if (creditsToAdd <= 0) {
        toast.success(`Updated ${selectedUser.display_name}!`)
      }
      
      setShowUserModal(false)
      fetchProfiles()
    } catch (err) {
      console.error('Update error:', err)
      toast.error(`Failed to update user: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteFlare = async () => {
    if (!flareToDelete) return

    try {
      await onRemoveFlare(flareToDelete.id)
      toast.success('Flare removed')
      setFlareToDelete(null)
      fetchFlares()
    } catch {
      toast.error('Failed to remove flare')
    }
  }

  const handleClearCampfire = async () => {
    try {
      await onClearCampfire()
      toast.success('Campfire cleared!')
      setShowClearCampfireConfirm(false)
    } catch {
      toast.error('Failed to clear campfire')
    }
  }

  const toggleBadge = (badgeId: string) => {
    setSelectedBadges(prev => 
      prev.includes(badgeId) 
        ? prev.filter(b => b !== badgeId)
        : [...prev, badgeId]
    )
  }

  const filteredProfiles = profiles.filter(p => 
    p.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-5 border-b border-border bg-gradient-to-b from-amber-950/20 via-card/80 to-transparent">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-amber-500/30 blur-xl animate-pulse" />
              <div className="relative p-3 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20">
                <ShieldCheck size={28} weight="duotone" className="text-amber-400" />
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                Admin Panel
                <Sparkle size={20} weight="fill" className="text-amber-400" />
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage users, flares, and community
              </p>
            </div>
          </div>

          {/* Tab Buttons */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'users' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('users')}
              className="gap-2 rounded-xl"
            >
              <Users size={16} />
              Users ({profiles.length})
            </Button>
            <Button
              variant={activeTab === 'flares' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('flares')}
              className="gap-2 rounded-xl"
            >
              <Fire size={16} />
              Flares ({flares.length})
            </Button>
            <Button
              variant={activeTab === 'campfire' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('campfire')}
              className="gap-2 rounded-xl"
            >
              <ChatCircleDots size={16} />
              Campfire
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 max-w-2xl mx-auto">
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search users..."
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
                  {filteredProfiles.map((profile) => {
                    const badge = getHighestBadge(profile.completed_flares_count || 0, profile.badges)
                    return (
                      <Card
                        key={profile.id}
                        className="p-4 bg-card/80 border-border/50 hover:bg-card/90 transition-colors cursor-pointer"
                        onClick={() => openUserModal(profile)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 ring-2 ring-border">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/20">
                              {profile.display_name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground truncate">
                                {profile.display_name}
                              </span>
                              {profile.is_admin && (
                                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                                  Admin
                                </Badge>
                              )}
                              {profile.is_moderator && !profile.is_admin && (
                                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                                  Mod
                                </Badge>
                              )}
                              <span className={`text-xs ${badge.color}`}>{badge.emoji}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span>🏮 {profile.lantern_balance} credits</span>
                              <span>⭐ {profile.trust_score} rep</span>
                              <span>🤝 {profile.completed_flares_count || 0} helps</span>
                            </div>
                          </div>
                          <CaretDown size={16} className="text-muted-foreground" />
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'flares' && (
            <div className="space-y-3">
              {flares.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No flares to display
                </div>
              ) : (
                flares.map((flare) => (
                  <Card key={flare.id} className="p-4 bg-card/80 border-border/50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">{flare.title}</h4>
                        <p className="text-sm text-muted-foreground truncate">{flare.description}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>by {flare.creator_name}</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {flare.status}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setFlareToDelete(flare)}
                        className="text-destructive hover:bg-destructive/10 rounded-xl shrink-0"
                      >
                        <Trash size={18} />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'campfire' && (
            <div className="space-y-4">
              <Card className="p-6 bg-gradient-to-br from-destructive/10 to-transparent border-destructive/20">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-destructive/10">
                    <Warning size={28} weight="duotone" className="text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Clear All Campfire Messages</h3>
                    <p className="text-sm text-muted-foreground">
                      This will permanently delete all messages in the campfire chat.
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setShowClearCampfireConfirm(true)}
                  className="w-full gap-2 rounded-xl"
                >
                  <Trash size={18} />
                  Clear Campfire
                </Button>
              </Card>

              <Card className="p-4 bg-card/80 border-border/50">
                <p className="text-sm text-muted-foreground">
                  Note: Campfire messages are public chat messages visible to all users.
                  Use this feature sparingly to maintain community trust.
                </p>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* User Edit Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Users size={24} weight="duotone" className="text-primary" />
              Edit User
            </DialogTitle>
            <DialogDescription>
              Manage badges, moderator status, and credits
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-5 py-2">
              {/* User Info */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/20 text-lg">
                    {selectedUser.display_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-foreground">{selectedUser.display_name}</h4>
                  <p className="text-sm text-muted-foreground">
                    🏮 {selectedUser.lantern_balance} credits • {selectedUser.completed_flares_count || 0} completed flares
                  </p>
                </div>
              </div>

              {/* Moderator Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10">
                    <ShieldCheck size={20} className="text-cyan-400" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Moderator Status</Label>
                    <p className="text-xs text-muted-foreground">Give moderation powers</p>
                  </div>
                </div>
                <Button
                  variant={isModerator ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsModerator(!isModerator)}
                  className={`rounded-xl gap-2 ${isModerator ? 'bg-cyan-500 hover:bg-cyan-600' : ''}`}
                >
                  {isModerator ? <Check size={14} /> : <X size={14} />}
                  {isModerator ? 'Active' : 'Inactive'}
                </Button>
              </div>

              {/* Add Credits */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <CurrencyCircleDollar size={14} className="text-amber-400" />
                  Add Credits (Lanterns)
                </Label>
                <div className="flex gap-2">
                  {[1, 5, 10, 25].map((amount) => (
                    <Button
                      key={amount}
                      variant={creditsToAdd === amount ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCreditsToAdd(amount)}
                      className="flex-1 rounded-xl"
                    >
                      +{amount}
                    </Button>
                  ))}
                </div>
                {creditsToAdd > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Will add {creditsToAdd} credits to their balance
                  </p>
                )}
              </div>

              {/* Badges */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Medal size={14} className="text-purple-400" />
                  Custom Badges
                </Label>
                <div className="flex flex-wrap gap-2">
                  {BADGES.map((badge) => (
                    <Button
                      key={badge.id}
                      variant={selectedBadges.includes(badge.id) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleBadge(badge.id)}
                      className={`rounded-xl gap-1.5 ${
                        selectedBadges.includes(badge.id) 
                          ? `${badge.bgColor} ${badge.color} border ${badge.borderColor}`
                          : ''
                      }`}
                    >
                      <span>{badge.emoji}</span>
                      <span className="text-xs">{badge.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setShowUserModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl"
                  onClick={handleUpdateUser}
                  disabled={updating}
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Flare Confirmation */}
      <Dialog open={!!flareToDelete} onOpenChange={() => setFlareToDelete(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Delete Flare?</DialogTitle>
            <DialogDescription>
              This will permanently remove the flare "{flareToDelete?.title}". This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setFlareToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl"
              onClick={handleDeleteFlare}
            >
              Delete Flare
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear Campfire Confirmation */}
      <Dialog open={showClearCampfireConfirm} onOpenChange={setShowClearCampfireConfirm}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Warning size={24} className="text-destructive" />
              Clear All Messages?
            </DialogTitle>
            <DialogDescription>
              This will permanently delete ALL messages in the campfire. This action cannot be undone and will affect all users.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setShowClearCampfireConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl"
              onClick={handleClearCampfire}
            >
              Clear All Messages
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
