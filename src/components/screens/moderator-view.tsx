import { useState, useEffect } from 'react'
import { 
  ShieldCheck, 
  Users, 
  Fire, 
  ChatCircleDots, 
  Trash, 
  Medal,
  MagnifyingGlass,
  CaretDown,
  Sparkle,
  Warning,
  ChartLine,
  Flag,
  Megaphone,
  Gift,
  Eye,
  EyeSlash,
  PaperPlaneRight
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
import { ReportsView } from './reports-view'
import { StatisticsView } from './statistics-view'
import type { Announcement } from '@/lib/types'

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

interface ModeratorViewProps {
  onRemoveFlare: (flareId: string) => Promise<void>
  onClearCampfire: () => Promise<void>
}

export function ModeratorView({ onRemoveFlare, onClearCampfire }: ModeratorViewProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'flares' | 'campfire' | 'statistics' | 'reports' | 'announcements'>('users')
  const [profiles, setProfiles] = useState<ProfileData[]>([])
  const [flares, setFlares] = useState<FlareData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingReportsCount, setPendingReportsCount] = useState(0)
  
  // Selected user for editing
  const [selectedUser, setSelectedUser] = useState<ProfileData | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedBadges, setSelectedBadges] = useState<string[]>([])
  const [updating, setUpdating] = useState(false)

  // Confirm dialogs
  const [showClearCampfireConfirm, setShowClearCampfireConfirm] = useState(false)
  const [flareToDelete, setFlareToDelete] = useState<FlareData | null>(null)

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementContent, setAnnouncementContent] = useState('')
  const [announcementGiftAmount, setAnnouncementGiftAmount] = useState(0)
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false)

  useEffect(() => {
    fetchProfiles()
    fetchFlares()
    fetchPendingReportsCount()
    fetchAnnouncements()
  }, [])

  const fetchPendingReportsCount = async () => {
    try {
      const { count, error } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
      
      if (!error && count !== null) {
        setPendingReportsCount(count)
      }
    } catch (err) {
      console.error('Error fetching pending reports count:', err)
    }
  }

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

  const fetchAnnouncements = async () => {
    try {
      const { data: announcementsData, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching announcements:', error)
        return
      }

      if (!announcementsData || announcementsData.length === 0) {
        setAnnouncements([])
        return
      }

      // Get sender names
      const senderIds = [...new Set(announcementsData.map(a => a.sender_id))]
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', senderIds)

      const profileMap: Record<string, { name: string; avatar: string | null }> = {}
      profilesData?.forEach(p => {
        profileMap[p.user_id] = { name: p.display_name, avatar: p.avatar_url }
      })

      // Get read/claim statistics for each announcement
      const { data: recipientsData } = await supabase
        .from('announcement_recipients')
        .select('announcement_id, read_at, gift_claimed')

      const statsMap: Record<string, { read_count: number; claimed_count: number }> = {}
      recipientsData?.forEach(r => {
        if (!statsMap[r.announcement_id]) {
          statsMap[r.announcement_id] = { read_count: 0, claimed_count: 0 }
        }
        if (r.read_at) statsMap[r.announcement_id].read_count++
        if (r.gift_claimed) statsMap[r.announcement_id].claimed_count++
      })

      const announcementsWithData: Announcement[] = announcementsData.map(a => ({
        ...a,
        sender_name: profileMap[a.sender_id]?.name || 'Unknown',
        sender_avatar: profileMap[a.sender_id]?.avatar || null,
        read_count: statsMap[a.id]?.read_count || 0,
        claimed_count: statsMap[a.id]?.claimed_count || 0
      }))

      setAnnouncements(announcementsWithData)
    } catch (err) {
      console.error('Announcements fetch error:', err)
    }
  }

  const handleSendAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      toast.error('Please fill in both title and content')
      return
    }

    if (announcementTitle.length > 100) {
      toast.error('Title must be 100 characters or less')
      return
    }

    setSendingAnnouncement(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Not authenticated')
        return
      }

      const { error } = await supabase
        .from('announcements')
        .insert({
          sender_id: user.id,
          title: announcementTitle.trim(),
          content: announcementContent.trim(),
          gift_amount: announcementGiftAmount,
          is_active: true
        })

      if (error) {
        console.error('Error creating announcement:', error)
        toast.error('Failed to send announcement')
        return
      }

      toast.success('Announcement sent to all users!')
      setAnnouncementTitle('')
      setAnnouncementContent('')
      setAnnouncementGiftAmount(0)
      fetchAnnouncements()
    } catch (err) {
      console.error('Send announcement error:', err)
      toast.error('Failed to send announcement')
    } finally {
      setSendingAnnouncement(false)
    }
  }

  const handleToggleAnnouncementActive = async (announcement: Announcement) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !announcement.is_active })
        .eq('id', announcement.id)

      if (error) {
        console.error('Error updating announcement:', error)
        toast.error('Failed to update announcement')
        return
      }

      toast.success(announcement.is_active ? 'Announcement deactivated' : 'Announcement activated')
      fetchAnnouncements()
    } catch (err) {
      console.error('Toggle announcement error:', err)
      toast.error('Failed to update announcement')
    }
  }

  const openUserModal = (profile: ProfileData) => {
    setSelectedUser(profile)
    setSelectedBadges(profile.badges || [])
    setShowUserModal(true)
  }

  // Moderators can only update badges (not credits or moderator status)
  const handleUpdateUser = async () => {
    if (!selectedUser) return

    setUpdating(true)
    try {
      const updates: Record<string, unknown> = {
        badges: selectedBadges,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', selectedUser.user_id)

      if (error) {
        console.error('Error updating user:', error)
        toast.error(`Failed to update user: ${error.message || 'Unknown error'}`)
        return
      }

      toast.success(`Updated badges for ${selectedUser.display_name}!`)
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
      <div className="p-5 border-b border-border bg-gradient-to-b from-cyan-950/20 via-card/80 to-transparent">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-cyan-500/30 blur-xl animate-pulse" />
              <div className="relative p-3 rounded-full bg-gradient-to-br from-cyan-500/20 to-teal-500/10 border border-cyan-500/20">
                <ShieldCheck size={28} weight="duotone" className="text-cyan-400" />
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                Moderator Panel
                <Sparkle size={20} weight="fill" className="text-cyan-400" />
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage flares, campfire, and badges
              </p>
            </div>
          </div>

          {/* Tab Buttons */}
          <div className="flex gap-2 flex-wrap">
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
            <Button
              variant={activeTab === 'reports' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('reports')}
              className="gap-2 rounded-xl relative"
            >
              <Flag size={16} />
              Reports
              {pendingReportsCount > 0 && (
                <Badge className="ml-1 bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                  {pendingReportsCount}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeTab === 'statistics' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('statistics')}
              className="gap-2 rounded-xl bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300"
            >
              <ChartLine size={16} />
              Statistics
            </Button>
            <Button
              variant={activeTab === 'announcements' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('announcements')}
              className="gap-2 rounded-xl bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300"
            >
              <Megaphone size={16} />
              Announcements
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'reports' ? (
        <ReportsView />
      ) : activeTab === 'statistics' ? (
        <StatisticsView isAdmin={false} />
      ) : (
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

          {activeTab === 'statistics' && (
            <div className="-m-4">
              <StatisticsView isAdmin={false} />
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="space-y-6">
              {/* Compose Announcement Form */}
              <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 rounded-xl bg-amber-500/20">
                    <Megaphone size={24} weight="duotone" className="text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Compose Announcement</h3>
                    <p className="text-sm text-muted-foreground">Send a message to all users</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Title (max 100 chars)</Label>
                    <input
                      type="text"
                      placeholder="Announcement title..."
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value.slice(0, 100))}
                      maxLength={100}
                      className="w-full h-11 px-4 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                    />
                    <p className="text-xs text-muted-foreground text-right">{announcementTitle.length}/100</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Content</Label>
                    <textarea
                      placeholder="Write your announcement message..."
                      value={announcementContent}
                      onChange={(e) => setAnnouncementContent(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Gift size={14} className="text-amber-400" />
                      Gift Amount (optional)
                    </Label>
                    <div className="flex gap-2">
                      {[0, 1, 5, 10].map((amount) => (
                        <Button
                          key={amount}
                          variant={announcementGiftAmount === amount ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setAnnouncementGiftAmount(amount)}
                          className={`flex-1 rounded-xl ${announcementGiftAmount === amount ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                        >
                          {amount === 0 ? 'None' : `🏮 ${amount}`}
                        </Button>
                      ))}
                    </div>
                    {announcementGiftAmount > 0 && (
                      <p className="text-xs text-amber-400">
                        Each user who claims will receive {announcementGiftAmount} lantern{announcementGiftAmount > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleSendAnnouncement}
                    disabled={sendingAnnouncement || !announcementTitle.trim() || !announcementContent.trim()}
                    className="w-full gap-2 rounded-xl bg-amber-500 hover:bg-amber-600"
                  >
                    <PaperPlaneRight size={18} weight="fill" />
                    {sendingAnnouncement ? 'Sending...' : 'Send to All Users'}
                  </Button>
                </div>
              </Card>

              {/* Sent Announcements List */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Megaphone size={14} />
                  Sent Announcements ({announcements.length})
                </h3>
                
                {announcements.length === 0 ? (
                  <Card className="p-6 text-center bg-muted/20 border-dashed">
                    <p className="text-sm text-muted-foreground">
                      No announcements sent yet. Create your first announcement above!
                    </p>
                  </Card>
                ) : (
                  announcements.map((announcement) => (
                    <Card 
                      key={announcement.id} 
                      className={`p-4 ${announcement.is_active ? 'bg-card/80 border-border/50' : 'bg-muted/20 border-muted opacity-60'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-foreground">{announcement.title}</h4>
                            {announcement.gift_amount > 0 && (
                              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                                <Gift size={10} className="mr-1" />
                                {announcement.gift_amount} 🏮
                              </Badge>
                            )}
                            {!announcement.is_active && (
                              <Badge variant="outline" className="text-xs border-muted text-muted-foreground">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {announcement.content}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <span>by {announcement.sender_name}</span>
                            <span>•</span>
                            <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Eye size={12} />
                              {announcement.read_count || 0} read
                            </span>
                            {announcement.gift_amount > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-amber-400">
                                  <Gift size={12} />
                                  {announcement.claimed_count || 0} claimed
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleAnnouncementActive(announcement)}
                          className={`rounded-xl shrink-0 ${announcement.is_active ? 'text-muted-foreground hover:text-foreground' : 'text-primary hover:text-primary'}`}
                          title={announcement.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {announcement.is_active ? <EyeSlash size={18} /> : <Eye size={18} />}
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      )}

      {/* User Edit Modal - Moderators can only manage badges */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Users size={24} weight="duotone" className="text-cyan-400" />
              Edit User Badges
            </DialogTitle>
            <DialogDescription>
              Manage badges for this user
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

              {/* Badges - Moderators can only manage badges */}
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
