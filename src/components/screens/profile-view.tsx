import { useState } from 'react'
import { Gear, Ticket, SignOut, ShieldWarning, Sparkle, Copy, DoorOpen, Star, HandHeart, Trophy } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { VibeCard } from '@/components/vibe-card'
import { useAuth } from '@/contexts/AuthContext'
import type { User, InviteCode } from '@/lib/types'
import { toast } from 'sonner'

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

  // Calculate member duration
  const memberSince = user.createdAt ? new Date(user.createdAt) : new Date()
  const daysSinceJoined = Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24))

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
          <VibeCard user={user} helpCount={helpCount} />

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
    </div>
  )
}
