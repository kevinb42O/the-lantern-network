import { useState } from 'react'
import { Gear, Ticket, SignOut, ShieldWarning, Sparkle, Copy, DoorOpen } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { VibeCard } from '@/components/vibe-card'
import { useAuth } from '@/contexts/AuthContext'
import type { User, InviteCode } from '@/lib/types'
import { toast } from 'sonner'
import { generateInviteCode } from '@/lib/economy'

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
    toast.success('Invite code copied!')
  }

  const handleSignOut = async () => {
    if (isSupabaseConfigured) {
      await signOut();
      toast.success('Signed out successfully');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b border-border">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Profile</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
          >
            <Gear size={24} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4 max-w-lg mx-auto">
          <VibeCard user={user} helpCount={helpCount} />

          {user.isElder && (
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Sparkle size={20} weight="duotone" className="text-accent" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Elder Status</h3>
                  <p className="text-xs text-muted-foreground">
                    You can generate invite codes
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setShowInvites(true)}
              >
                <Ticket size={16} />
                Manage Invites ({availableInvites.length})
              </Button>
            </Card>
          )}

          <Card className="p-4">
            <h3 className="font-medium text-foreground mb-3">Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xl font-bold text-primary">{helpCount}</p>
                <p className="text-xs text-muted-foreground">Helps Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{user.reputation}</p>
                <p className="text-sm text-muted-foreground">Reputation</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-medium text-foreground mb-3">Account</h3>
            <div className="flex flex-wrap gap-2">
              {isSupabaseConfigured && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleSignOut}
                >
                  <DoorOpen size={16} />
                  Sign Out
                </Button>
              )}
              <Button variant="outline" size="sm" className="gap-2">
                <ShieldWarning size={16} />
                Report
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-destructive hover:text-destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <SignOut size={16} />
                Delete
              </Button>
            </div>
          </Card>
        </div>
      </ScrollArea>

      <Dialog open={showInvites} onOpenChange={setShowInvites}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Codes</DialogTitle>
            <DialogDescription>
              Share these codes with trusted neighbors
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {availableInvites.length === 0 ? (
              <div className="text-center py-6">
                <Ticket size={48} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No available invites</p>
                {user.isElder && (
                  <Button
                    className="mt-4"
                    onClick={() => {
                      onGenerateInvite()
                      toast.success('New invite code generated!')
                    }}
                  >
                    Generate New Code
                  </Button>
                )}
              </div>
            ) : (
              <>
                {availableInvites.map((invite) => (
                  <Card key={invite.code} className="p-4">
                    <div className="flex items-center justify-between">
                      <code className="text-lg font-mono font-bold text-primary">
                        {invite.code}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyInviteCode(invite.code)}
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
                  </Card>
                ))}
                {user.isElder && (
                  <Button
                    className="w-full"
                    onClick={() => {
                      onGenerateInvite()
                      toast.success('New invite code generated!')
                    }}
                  >
                    Generate New Code
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                onDeleteAccount()
                setShowDeleteConfirm(false)
              }}
            >
              Delete Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
