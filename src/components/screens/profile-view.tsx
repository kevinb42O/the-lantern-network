import { useState } from 'react'
import { Gear, Ticket, SignOut, ShieldWarning, Sparkle, Copy, DoorOpen, Star, HandHeart, Trophy, Medal, BookOpen, Heart } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { SupporterBadge } from '@/components/ui/supporter-badge'
import { VibeCard } from '@/components/vibe-card'
import { PhilosophyView } from './philosophy-view'
import { SupportPage } from './support-page'
import { ProfileSettingsModal } from '@/components/profile/profile-settings-modal'
import { useAuth } from '@/contexts/AuthContext'
import { useHelpCount } from '@/hooks/useHelpCount'
import { useMyInvites, useCreateInvite } from '@/hooks/useInvites'
import { isAdminEmail } from '@/lib/admin'
import { ELDER_TRUST_THRESHOLD } from '@/lib/economy'
import type { InviteCode } from '@/lib/types'
import { toast } from 'sonner'
import { getHighestBadge, getNextBadge, getEarnedBadges, BADGES, getSupporterBadgeInfo } from '@/lib/economy'

// Check if Supabase is configured
const isSupabaseConfigured = 
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

export function ProfileView() {
  const { user: authUser, profile, signOut } = useAuth()
  const { data: helpCount = 0 } = useHelpCount()
  const { data: rawInvites = [] } = useMyInvites()
  const createInvite = useCreateInvite()

  if (!authUser || !profile) return null

  // Build user data from auth context
  const user = {
    id: authUser.id,
    username: profile.display_name,
    skillTags: profile.vibe_tags || [],
    lanternBalance: profile.lantern_balance,
    reputation: profile.trust_score,
    createdAt: new Date(profile.created_at).getTime(),
    isElder: profile.trust_score >= ELDER_TRUST_THRESHOLD,
    isAdmin: isAdminEmail(authUser.email),
    isModerator: (profile as Record<string, unknown>).is_moderator === true,
    badges: profile.badges || [],
    supporterBadge: profile.supporter_badge,
  }

  // Transform raw invites to InviteCode format
  const inviteCodes: InviteCode[] = rawInvites.map((i: Record<string, unknown>) => ({
    code: i.code as string,
    generatedBy: i.inviter_id as string,
    usedBy: (i.used_by_id as string) || undefined,
    usedAt: i.used ? new Date(i.created_at as string).getTime() : undefined,
    createdAt: new Date(i.created_at as string).getTime(),
  }))

  const onGenerateInvite = () => {
    createInvite.mutate(7, {
      onSuccess: () => { toast.success('Nieuwe uitnodigingscode aangemaakt!') },
      onError: () => { toast.error('Uitnodigingscode aanmaken mislukt') },
    })
  }

  const [showInvites, setShowInvites] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showBadges, setShowBadges] = useState(false)
  const [showPhilosophy, setShowPhilosophy] = useState(false)
  const [showSupport, setShowSupport] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const availableInvites = inviteCodes.filter(code => !code.usedBy)

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Uitnodigingscode gekopieerd!')
  }

  const handleSignOut = async () => {
    if (isSupabaseConfigured) {
      await signOut();
      toast.success('Tot snel! 👋');
    }
  };
  
  // Get badge info - use highest badge considering both earned and admin-granted badges
  const adminBadges = user.badges || []
  const currentBadge = getHighestBadge(helpCount, adminBadges)
  const nextBadge = getNextBadge(helpCount)
  const earnedBadges = getEarnedBadges(helpCount)
  
  // Get custom badges assigned by admin that are NOT already earned through flares
  const customBadges = adminBadges.length > 0
    ? BADGES.filter(b => adminBadges.includes(b.id) && !earnedBadges.some(eb => eb.id === b.id))
    : []

  // Get supporter badge info if user has one
  const supporterBadgeInfo = user.supporterBadge ? getSupporterBadgeInfo(user.supporterBadge) : null

  // Calculate member duration
  const memberSince = user.createdAt ? new Date(user.createdAt) : new Date()
  const daysSinceJoined = Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24))

  // Show support page if requested
  if (showSupport) {
    return <SupportPage onBack={() => setShowSupport(false)} />;
  }

  // Show philosophy page if requested
  if (showPhilosophy) {
    return <PhilosophyView onBack={() => setShowPhilosophy(false)} />;
  }

  return (
    <div className="flex flex-col h-full bg-background relative overflow-y-auto overflow-x-hidden pb-20">
      <div className="max-w-2xl mx-auto w-full">
        {/* Full Width Banner */}
        <div className="h-48 md:h-64 relative bg-muted w-full shrink-0">
          {user.bannerUrl ? (
            <img src={user.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/15 to-primary/20">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/60" />
              <div className="absolute -top-4 -right-4 w-32 h-32 rounded-full bg-primary/20 blur-3xl" />
              <div className="absolute bottom-0 left-8 w-24 h-24 rounded-full bg-accent/20 blur-2xl" />
            </div>
          )}
          
          {/* Settings Button Floating */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
            className="absolute top-4 right-4 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md text-white border border-white/10 shadow-lg z-10"
          >
            <Gear size={22} weight="fill" />
          </Button>
        </div>

        <div className="px-5 relative max-w-2xl mx-auto">
          {/* Overlapping Avatar */}
          <div className="absolute -top-16 left-5 z-10">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-background ring-1 ring-border/50 shadow-2xl bg-card">
                <AvatarImage src={user.vibePhoto} alt={user.username} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/20 text-foreground text-4xl font-bold">
                  {user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Trust badge icon */}
              <div className={`absolute bottom-0 right-0 p-2 rounded-full ${currentBadge.bgColor} shadow-lg ring-4 ring-background`}>
                <span className="text-xl">{currentBadge.emoji}</span>
              </div>
            </div>
          </div>

          {/* Spacer for avatar */}
          <div className="h-20" />

          {/* Profile Details */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 flex-wrap">
              {user.username}
              {user.supporterBadge && (
                <SupporterBadge badgeType={user.supporterBadge} size="sm" />
              )}
              {user.isAdmin && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs gap-1">
                  <Sparkle size={10} weight="fill" />
                  Admin
                </Badge>
              )}
              {user.isModerator && !user.isAdmin && (
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs gap-1">
                  <ShieldWarning size={10} weight="fill" />
                  Mod
                </Badge>
              )}
            </h1>
            
            <p className={`text-sm font-medium ${currentBadge.color} flex items-center gap-1.5 mt-1`}>
              <span>{currentBadge.emoji}</span>
              {currentBadge.name}
              <span className="text-muted-foreground ml-2 font-normal">
                • Lid sinds {daysSinceJoined === 0 ? 'vandaag' : `${daysSinceJoined} dag${daysSinceJoined !== 1 ? 'en' : ''}`}
              </span>
            </p>

            {user.bio && (
              <p className="mt-4 text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                "{user.bio}"
              </p>
            )}

            {/* Skills Tags */}
            {user.skillTags && user.skillTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {user.skillTags.map(tag => (
                  <Badge key={tag} variant="secondary" className="bg-secondary/50 text-secondary-foreground px-3 py-1 text-sm font-normal capitalize">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

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
                Bekijk alle
              </Button>
            </div>
            {nextBadge && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Voortgang naar {nextBadge.badge.name}</span>
                  <span className={nextBadge.badge.color}>
                    {helpCount}/{nextBadge.badge.minFlares} keer geholpen
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
              <p className="text-xs text-muted-foreground">Keer geholpen</p>
            </Card>
            <Card className="p-4 text-center bg-gradient-to-br from-card to-card/80 border-border/50 card-hover">
              <div className="inline-flex p-2 rounded-lg bg-accent/15 mb-2">
                <Star size={20} weight="duotone" className="text-accent" />
              </div>
              <p className="text-2xl font-bold text-foreground">{user.reputation}</p>
              <p className="text-xs text-muted-foreground">Reputatie</p>
            </Card>
            <Card className="p-4 text-center bg-gradient-to-br from-card to-card/80 border-border/50 card-hover">
              <div className="inline-flex p-2 rounded-lg bg-success/15 mb-2">
                <Trophy size={20} weight="duotone" className="text-success" />
              </div>
              <p className="text-2xl font-bold text-foreground">{user.lanternBalance}</p>
              <p className="text-xs text-muted-foreground">Lichtpuntjes</p>
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
                    Buurheld status
                    <span className="text-amber-400">✨</span>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Je kan nieuwe leden uitnodigen
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full mt-4 gap-2 rounded-xl border-amber-500/30 hover:bg-amber-500/10"
                onClick={() => setShowInvites(true)}
              >
                <Ticket size={18} className="text-amber-400" />
                <span>Uitnodigingen beheren</span>
                {availableInvites.length > 0 && (
                  <span className="ml-auto bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full text-xs font-medium">
                    {availableInvites.length} beschikbaar
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
                className="w-full justify-start gap-3 rounded-xl h-12 border-rose-500/30 hover:bg-rose-500/10"
                onClick={() => setShowSupport(true)}
              >
                <Heart size={18} weight="duotone" className="text-rose-400" />
                <span className="flex-1 text-left">Steun ons</span>
                <span className="text-xs text-rose-400">❤️</span>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 rounded-xl h-12"
                onClick={() => setShowPhilosophy(true)}
              >
                <BookOpen size={18} className="text-muted-foreground" />
                Onze filosofie
              </Button>
              {isSupabaseConfigured && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 rounded-xl h-12"
                  onClick={handleSignOut}
                >
                  <DoorOpen size={18} className="text-muted-foreground" />
                  Afmelden
                </Button>
              )}
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 rounded-xl h-12"
              >
                <ShieldWarning size={18} className="text-muted-foreground" />
                Meld een probleem
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 rounded-xl h-12 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <SignOut size={18} />
                Account verwijderen
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Invite Codes Dialog */}
      <Dialog open={showInvites} onOpenChange={setShowInvites}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Ticket size={24} weight="duotone" className="text-amber-400" />
              Uitnodigingscodes
            </DialogTitle>
            <DialogDescription>
              Deel deze codes met vertrouwde buren om het netwerk te laten groeien
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {availableInvites.length === 0 ? (
              <div className="text-center py-8">
                <div className="inline-flex p-4 rounded-full bg-muted/50 mb-4">
                  <Ticket size={40} className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">Geen beschikbare uitnodigingscodes</p>
                {user.isElder && (
                  <Button
                    onClick={() => {
                      onGenerateInvite()
                      toast.success('Nieuwe uitnodigingscode aangemaakt!')
                    }}
                    className="gap-2 rounded-xl"
                  >
                    <Sparkle size={16} />
                    Nieuwe code aanmaken
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
                          Klaar om te delen
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyInviteCode(invite.code)}
                        className="gap-2 rounded-xl"
                      >
                        <Copy size={14} />
                        Kopiëren
                      </Button>
                    </div>
                  </Card>
                ))}
                {user.isElder && (
                  <Button
                    className="w-full gap-2 rounded-xl"
                    onClick={() => {
                      onGenerateInvite()
                      toast.success('Nieuwe uitnodigingscode aangemaakt!')
                    }}
                  >
                    <Sparkle size={16} />
                    Nog een code aanmaken
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
            <DialogTitle className="text-xl">Account verwijderen?</DialogTitle>
            <DialogDescription className="text-base">
              Deze actie kan niet ongedaan worden gemaakt. Al je gegevens, inclusief je Lichtpuntjes en hulpgeschiedenis, worden permanent verwijderd.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Account behouden
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl"
              onClick={() => {
                signOut()
                setShowDeleteConfirm(false)
              }}
            >
              Definitief verwijderen
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
              Jouw badges
            </DialogTitle>
            <DialogDescription>
              Verdien badges door buren te helpen in de gemeenschap
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            {/* Supporter Badge (highest priority) */}
            {supporterBadgeInfo && (
              <>
                <h4 className="text-sm font-medium text-foreground pt-1">Supporter Badge</h4>
                <Card 
                  className={`p-4 ${supporterBadgeInfo.bgColor} border-2 ${supporterBadgeInfo.borderColor} shadow-[0_0_15px_rgba(251,191,36,0.15)]`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl animate-pulse">{supporterBadgeInfo.emoji}</span>
                    <div className="flex-1">
                      <h4 className={`font-semibold ${supporterBadgeInfo.color}`}>{supporterBadgeInfo.name}</h4>
                      <p className="text-xs text-muted-foreground">{supporterBadgeInfo.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Thank you for supporting The Lantern Network!
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 font-medium">
                      Supporter
                    </span>
                  </div>
                </Card>
              </>
            )}
            {/* Custom Badges (assigned by admin) */}
            {customBadges.length > 0 && (
              <>
                <h4 className="text-sm font-medium text-foreground pt-1">Speciale badges</h4>
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
                          Toegekend door beheerder
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 font-medium">
                        Speciaal
                      </span>
                    </div>
                  </Card>
                ))}
              </>
            )}
            {/* Earned Badges Section Header - show if we have supporter/custom badges */}
            {(supporterBadgeInfo || customBadges.length > 0) && (
              <h4 className="text-sm font-medium text-foreground pt-2">Earned Badges</h4>
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
                      Ontgrendeld bij {badge.minFlares} voltooide hulpacties
                    </p>
                  </div>
                  {badge.id === currentBadge.id && (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                      Huidig
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
                      Nog {nextBadge.flaresNeeded} keer helpen om te ontgrendelen
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                    Volgende
                  </span>
                </div>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ProfileSettingsModal 
        open={showSettings} 
        onClose={() => setShowSettings(false)} 
        onUpdated={() => {
          // If needed we can refresh the user profile here.
          // useAuth automatically syncs changes eventually but we can trigger a manual fetch or just let realtime sync happen.
        }}
      />
    </div>
  )
}
