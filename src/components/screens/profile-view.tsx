import { useState } from 'react'
import { Gear, Ticket, SignOut, ShieldWarning, Sparkle, Copy, DoorOpen, Star, HandHeart, Trophy, Medal, BookOpen } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { VibeCard } from '@/components/vibe-card'
import { PhilosophyView } from './philosophy-view'
import { useAuth } from '@/contexts/AuthContext'
import type { User, InviteCode } from '@/lib/types'
import { toast } from 'sonner'
import { getHighestBadge, getNextBadge, getEarnedBadges, getAllUserBadges, BADGES } from '@/lib/economy'

// Check if Supabase is configured
const isSupabaseConfigured = 
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

interface ProfileViewProps {
  user: User
  helpCount: number
  inviteCodes: InviteCode[]
  onGenerateInvite: () => void
  onDeleteAccount: () => void
}

export function ProfileView({ 
  user, 
  helpCount, 
  inviteCodes,
  onGenerateInvite,
  onDeleteAccount
}: ProfileViewProps) {
  const { signOut } = useAuth();
  const [showInvites, setShowInvites] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showBadges, setShowBadges] = useState(false)
  const [showPhilosophy, setShowPhilosophy] = useState(false)

  const availableInvites = inviteCodes.filter(code => !code.usedBy)

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Invite code copied to clipboard!')
  }

  const handleSignOut = async () => {
    if (isSupabaseConfigured) {
      await signOut();
      toast.success('See you soon! 👋');
    }
  };
  
  // Get badge info - use highest badge considering both earned and admin-granted badges
  const adminBadges = user.badges || []
  const currentBadge = getHighestBadge(helpCount, adminBadges)
  const nextBadge = getNextBadge(helpCount)
  const earnedBadges = getEarnedBadges(helpCount)
  
  // Get all user badges (earned + admin-granted, no duplicates)
  const allUserBadges = getAllUserBadges(helpCount, adminBadges)
  
  // Get custom badges assigned by admin that are NOT already earned through flares
  const customBadges = adminBadges.length > 0
    ? BADGES.filter(b => adminBadges.includes(b.id) && !earnedBadges.some(eb => eb.id === b.id))
    : []

  // Calculate member duration
  const memberSince = user.createdAt ? new Date(user.createdAt) : new Date()
  const daysSinceJoined = Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24))

  // Show philosophy page if requested
  if (showPhilosophy) {
    return <PhilosophyView onBack={() => setShowPhilosophy(false)} />;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-5 border-b border-border bg-gradient-to-b from-card/80 to-transparent">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/15">
              <Star size={24} weight="duotone" className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Your Profile</h1>
              <p className="text-sm text-muted-foreground">
                Member for {daysSinceJoined === 0 ? 'today' : `${daysSinceJoined} day${daysSinceJoined !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
            className="rounded-xl"
          >
            <Gear size={22} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-5 space-y-5 max-w-lg mx-auto">
          {/* Vibe Card */}
          <VibeCard user={user} helpCount={helpCount} isModerator={user.isModerator} />

          {/* Badge Progress Card */}
          <Card className={`p-5 ${currentBadge.bgColor} border ${currentBadge.borderColor}`}>
            <div className="flex items-center gap-4 mb-3">
              <span className="text-3xl">{currentBadge.emoji}</span>
              <div className="flex-1">
                <h3 className={`font-semibold ${currentBadge.color}`}>{currentBadge.name}</h3>
                <p className="text-sm text-muted-foreground">{currentBadge.description}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBadges(true)}
                className="rounded-xl gap-1"
              >
                <Medal size={14} />
                View All
              </Button>
            </div>
            {nextBadge && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress to {nextBadge.badge.name}</span>
                  <span className={nextBadge.badge.color}>
                    {helpCount}/{nextBadge.badge.minFlares} helps
                  </span>
                </div>
                <Progress 
                  value={(helpCount / nextBadge.badge.minFlares) * 100} 
                  className="h-2"
                />
              </div>
            )}
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 text-center bg-gradient-to-br from-card to-card/80 border-border/50 card-hover">
              <div className="inline-flex p-2 rounded-lg bg-primary/15 mb-2">
                <HandHeart size={20} weight="duotone" className="text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{helpCount}</p>
              <p className="text-xs text-muted-foreground">Helps Given</p>
            </Card>
            <Card className="p-4 text-center bg-gradient-to-br from-card to-card/80 border-border/50 card-hover">
              <div className="inline-flex p-2 rounded-lg bg-accent/15 mb-2">
                <Star size={20} weight="duotone" className="text-accent" />
              </div>
              <p className="text-2xl font-bold text-foreground">{user.reputation}</p>
              <p className="text-xs text-muted-foreground">Reputation</p>
            </Card>
            <Card className="p-4 text-center bg-gradient-to-br from-card to-card/80 border-border/50 card-hover">
              <div className="inline-flex p-2 rounded-lg bg-success/15 mb-2">
                <Trophy size={20} weight="duotone" className="text-success" />
              </div>
              <p className="text-2xl font-bold text-foreground">{user.lanternBalance}</p>
              <p className="text-xs text-muted-foreground">Lanterns</p>
            </Card>
          </div>

          {/* Elder Status Card */}
          {user.isElder && (
            <Card className="p-5 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-card border-amber-500/20 warm-glow">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-500/20">
                  <Sparkle size={24} weight="duotone" className="text-amber-400 lantern-glow" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    Elder Status
                    <span className="text-amber-400">✨</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    You can invite new members to join the network
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full mt-4 gap-2 rounded-xl border-amber-500/30 hover:bg-amber-500/10"
                onClick={() => setShowInvites(true)}
              >
                <Ticket size={18} className="text-amber-400" />
                <span>Manage Invites</span>
                {availableInvites.length > 0 && (
                  <span className="ml-auto bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full text-xs font-medium">
                    {availableInvites.length} available
                  </span>
                )}
              </Button>
            </Card>
          )}

          {/* Account Actions */}
          <Card className="p-5 bg-card/80 border-border/50">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Gear size={18} className="text-muted-foreground" />
              Account
            </h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 rounded-xl h-12"
                onClick={() => setShowPhilosophy(true)}
              >
                <BookOpen size={18} className="text-muted-foreground" />
                Our Philosophy
              </Button>
              {isSupabaseConfigured && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 rounded-xl h-12"
                  onClick={handleSignOut}
                >
                  <DoorOpen size={18} className="text-muted-foreground" />
                  Sign Out
                </Button>
              )}
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 rounded-xl h-12"
              >
                <ShieldWarning size={18} className="text-muted-foreground" />
                Report an Issue
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 rounded-xl h-12 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <SignOut size={18} />
                Delete Account
              </Button>
            </div>
          </Card>
        </div>
      </ScrollArea>

      {/* Invite Codes Dialog */}
      <Dialog open={showInvites} onOpenChange={setShowInvites}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Ticket size={24} weight="duotone" className="text-amber-400" />
              Invite Codes
            </DialogTitle>
            <DialogDescription>
              Share these codes with trusted neighbors to grow the network
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {availableInvites.length === 0 ? (
              <div className="text-center py-8">
                <div className="inline-flex p-4 rounded-full bg-muted/50 mb-4">
                  <Ticket size={40} className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">No available invite codes</p>
                {user.isElder && (
                  <Button
                    onClick={() => {
                      onGenerateInvite()
                      toast.success('New invite code generated!')
                    }}
                    className="gap-2 rounded-xl"
                  >
                    <Sparkle size={16} />
                    Generate New Code
                  </Button>
                )}
              </div>
            ) : (
              <>
                {availableInvites.map((invite) => (
                  <Card key={invite.code} className="p-4 bg-gradient-to-r from-card to-card/80 border-border/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <code className="text-xl font-mono font-bold text-primary tracking-wider">
                          {invite.code}
                        </code>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ready to share
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyInviteCode(invite.code)}
                        className="gap-2 rounded-xl"
                      >
                        <Copy size={14} />
                        Copy
                      </Button>
                    </div>
                  </Card>
                ))}
                {user.isElder && (
                  <Button
                    className="w-full gap-2 rounded-xl"
                    onClick={() => {
                      onGenerateInvite()
                      toast.success('New invite code generated!')
                    }}
                  >
                    <Sparkle size={16} />
                    Generate Another Code
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Delete Your Account?</DialogTitle>
            <DialogDescription className="text-base">
              This action cannot be undone. All your data, including your Lanterns and help history, will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Keep My Account
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl"
              onClick={() => {
                onDeleteAccount()
                setShowDeleteConfirm(false)
              }}
            >
              Delete Forever
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Badges Dialog */}
      <Dialog open={showBadges} onOpenChange={setShowBadges}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Medal size={24} weight="duotone" className="text-primary" />
              Your Badges
            </DialogTitle>
            <DialogDescription>
              Earn badges by helping neighbors in the community
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            {/* Custom Badges (assigned by admin) */}
            {customBadges.length > 0 && (
              <>
                <h4 className="text-sm font-medium text-foreground pt-1">Special Badges</h4>
                {customBadges.map((badge) => (
                  <Card 
                    key={`custom-${badge.id}`} 
                    className={`p-4 ${badge.bgColor} border-2 ${badge.borderColor}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">✨ {badge.emoji}</span>
                      <div className="flex-1">
                        <h4 className={`font-semibold ${badge.color}`}>{badge.name}</h4>
                        <p className="text-xs text-muted-foreground">{badge.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Awarded by admin
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 font-medium">
                        Special
                      </span>
                    </div>
                  </Card>
                ))}
                <h4 className="text-sm font-medium text-foreground pt-2">Earned Badges</h4>
              </>
            )}
            {earnedBadges.map((badge) => (
              <Card 
                key={badge.id} 
                className={`p-4 ${badge.bgColor} border ${badge.borderColor}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{badge.emoji}</span>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${badge.color}`}>{badge.name}</h4>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Unlocked at {badge.minFlares} completed helps
                    </p>
                  </div>
                  {badge.id === currentBadge.id && (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                      Current
                    </span>
                  )}
                </div>
              </Card>
            ))}
            {nextBadge && (
              <Card className="p-4 bg-muted/30 border-dashed border-border">
                <div className="flex items-center gap-3 opacity-60">
                  <span className="text-2xl grayscale">{nextBadge.badge.emoji}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-muted-foreground">{nextBadge.badge.name}</h4>
                    <p className="text-xs text-muted-foreground">{nextBadge.badge.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {nextBadge.flaresNeeded} more helps to unlock
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                    Next
                  </span>
                </div>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
