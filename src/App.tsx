import { useState } from 'react'
import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { Flame, Fire, Wallet, UserCircle, ChatCircleDots, ShieldCheck, Phone } from '@phosphor-icons/react'
import { Toaster } from '@/components/ui/sonner'
import { SplashScreen } from '@/components/screens/splash-screen'
import { AuthScreen } from '@/components/screens/auth-screen'
import { ProfileSetup } from '@/components/screens/profile-setup'
import { UserProfileModal } from '@/components/user-profile-modal'
import { useAuth } from '@/contexts/AuthContext'
import { useUnreadCount } from '@/hooks/useMessages'
import { isAdminEmail } from '@/lib/admin'
import { cn } from '@/lib/utils'

/**
 * AppLayout — the thin layout shell.
 * Handles: auth guards, splash screen, bottom nav, and the <Outlet> for routed pages.
 * Does NOT handle: data fetching, business logic, or prop passing to screens.
 */
export function AppLayout() {
  const { user: authUser, profile, loading: authLoading, hasCompletedOnboarding, refreshProfile } = useAuth()
  const [showSplash, setShowSplash] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()

  // Unread message count for the nav badge
  const { data: unreadCount = 0 } = useUnreadCount()

  // User profile modal state (global — can be triggered from any page)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [showUserProfile, setShowUserProfile] = useState(false)

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId)
    setShowUserProfile(true)
  }

  const handleStartCircleChat = (userId: string) => {
    setShowUserProfile(false)
    navigate(`/messages?circleChat=${userId}`)
  }

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Not logged in — show auth screen
  if (!authUser) {
    return <AuthScreen />
  }

  // Logged in but no profile AND haven't completed onboarding — show profile setup
  if (!profile && !hasCompletedOnboarding) {
    return <ProfileSetup />
  }

  // Profile fetch failed for an existing user — show loading/retry
  if (!profile && hasCompletedOnboarding) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground text-center">Je profiel laden...</p>
        <button
          onClick={refreshProfile}
          className="text-primary hover:underline text-sm"
        >
          Klik om opnieuw te proberen
        </button>
      </div>
    )
  }

  // Determine roles
  const isAdmin = isAdminEmail(authUser.email)
  const isModerator = (profile as Record<string, unknown>).is_moderator === true

  // Route protection: redirect non-admins away from admin routes
  if (location.pathname === '/admin' && !isAdmin) {
    return <Navigate to="/" replace />
  }
  if (location.pathname === '/moderator' && !isModerator) {
    return <Navigate to="/" replace />
  }

  // Derive the active view from the current path
  const currentPath = location.pathname

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex-1 overflow-hidden">
        <Outlet context={{ user: authUser, profile, isAdmin, isModerator, onUserClick: handleUserClick }} />
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        userId={selectedUserId}
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        onStartCircleChat={handleStartCircleChat}
      />

      {/* Bottom Navigation */}
      <nav className="border-t border-border/50 bg-card/95 backdrop-blur-md safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-around p-1.5 max-w-lg md:max-w-4xl lg:max-w-6xl mx-auto w-full">
          <NavButton
            icon={Flame}
            label="Lichtjes"
            active={currentPath === '/'}
            onClick={() => navigate('/')}
          />
          <NavButton
            icon={Fire}
            label="'t Kampvuur"
            active={currentPath === '/campfire'}
            onClick={() => navigate('/campfire')}
          />
          <NavButton
            icon={Wallet}
            label="Portemonnee"
            active={currentPath === '/wallet'}
            onClick={() => navigate('/wallet')}
          />
          <NavButton
            icon={ChatCircleDots}
            label="Berichten"
            active={currentPath === '/messages'}
            onClick={() => navigate('/messages')}
            badge={unreadCount}
          />
          <NavButton
            icon={Phone}
            label="Nummers"
            active={currentPath === '/numbers'}
            onClick={() => navigate('/numbers')}
          />
          <NavButton
            icon={UserCircle}
            label="Profiel"
            active={currentPath === '/profile'}
            onClick={() => navigate('/profile')}
          />
          {isModerator && !isAdmin && (
            <NavButton
              icon={ShieldCheck}
              label="Moderator"
              active={currentPath === '/moderator'}
              onClick={() => navigate('/moderator')}
              isModeratorButton
            />
          )}
          {isAdmin && (
            <NavButton
              icon={ShieldCheck}
              label="Beheer"
              active={currentPath === '/admin'}
              onClick={() => navigate('/admin')}
              isAdminButton
            />
          )}
        </div>
      </nav>

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          },
        }}
      />
    </div>
  )
}

// ─── NavButton ───────────────────────────────────────────────────────────────

interface NavButtonProps {
  icon: React.ElementType
  label: string
  active: boolean
  onClick: () => void
  badge?: number
  isAdminButton?: boolean
  isModeratorButton?: boolean
}

function NavButton({ icon: Icon, label, active, onClick, badge, isAdminButton = false, isModeratorButton = false }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200 relative min-w-[60px]',
        active
          ? isAdminButton
            ? 'text-amber-400 bg-amber-500/15 scale-105'
            : isModeratorButton
              ? 'text-cyan-400 bg-cyan-500/15 scale-105'
              : 'text-primary bg-primary/15 scale-105'
          : isAdminButton
            ? 'text-amber-400/60 hover:text-amber-400 hover:bg-amber-500/10'
            : isModeratorButton
              ? 'text-cyan-400/60 hover:text-cyan-400 hover:bg-cyan-500/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      )}
    >
      <div className="relative">
        <Icon size={22} weight={active ? 'duotone' : 'regular'} className={active ? 'drop-shadow-sm' : ''} />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-full shadow-lg animate-pulse">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className={cn(
        "text-[10px] font-medium transition-colors",
        active ? (isAdminButton ? "text-amber-400" : isModeratorButton ? "text-cyan-400" : "text-primary") : ""
      )}>{label}</span>
    </button>
  )
}

export default AppLayout
