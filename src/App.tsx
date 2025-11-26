import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { House, Fire, Wallet, UserCircle } from '@phosphor-icons/react'
import { Toaster } from '@/components/ui/sonner'
import { SplashScreen } from '@/components/screens/splash-screen'
import { InviteVerification } from '@/components/screens/invite-verification'
import { ProfileCreation } from '@/components/screens/profile-creation'
import { MapView } from '@/components/screens/map-view'
import { CampfireView } from '@/components/screens/campfire-view'
import { WalletView } from '@/components/screens/wallet-view'
import { ProfileView } from '@/components/screens/profile-view'
import type { User, Flare, Message, LanternTransaction, InviteCode } from '@/lib/types'
import { INITIAL_LANTERNS, checkElderStatus, generateInviteCode } from '@/lib/economy'
import { cn } from '@/lib/utils'

type AuthState = 'splash' | 'invite' | 'create-profile' | 'authenticated'
type MainView = 'map' | 'campfire' | 'wallet' | 'profile'

function App() {
  const [authState, setAuthState] = useState<AuthState>('splash')
  const [currentView, setCurrentView] = useState<MainView>('map')
  
  const [user, setUser] = useKV<User | null>('user', null)
  const [flares, setFlares] = useKV<Flare[]>('flares', [])
  const [messages, setMessages] = useKV<Message[]>('messages', [])
  const [transactions, setTransactions] = useKV<LanternTransaction[]>('transactions', [])
  const [inviteCodes, setInviteCodes] = useKV<InviteCode[]>('inviteCodes', [])

  useEffect(() => {
    if (user) {
      setAuthState('authenticated')
    }
  }, [user])

  const handleInviteVerified = (code: string) => {
    setAuthState('create-profile')
  }

  const handleProfileCreated = (username: string, skillTags: string[]) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      username,
      skillTags,
      lanternBalance: INITIAL_LANTERNS,
      reputation: 0,
      createdAt: Date.now(),
      isElder: false,
      location: { lat: 40.7128, lng: -74.0060 }
    }

    const initialTransactions: LanternTransaction[] = Array(INITIAL_LANTERNS)
      .fill(null)
      .map((_, i) => ({
        id: `tx-${Date.now()}-${i}`,
        from: 'system',
        to: newUser.id,
        amount: 1,
        reason: 'Welcome to the neighborhood',
        timestamp: Date.now()
      }))

    setUser(newUser)
    setTransactions(initialTransactions)
    setAuthState('authenticated')
  }

  const handleCreateFlare = (flareData: Omit<Flare, 'id' | 'createdAt' | 'userId' | 'username' | 'status'>) => {
    if (!user) return

    const newFlare: Flare = {
      ...flareData,
      id: `flare-${Date.now()}`,
      userId: user.id,
      username: user.username,
      status: 'active',
      createdAt: Date.now()
    }

    setFlares((current) => [...(current || []), newFlare])
  }

  const handleAcceptFlare = (flareId: string) => {
    if (!user) return

    setFlares((current) =>
      (current || []).map(f =>
        f.id === flareId
          ? { ...f, status: 'accepted' as const, acceptedBy: user.id }
          : f
      )
    )
  }

  const handleSendMessage = (content: string) => {
    if (!user) return

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      userId: user.id,
      username: user.username,
      content,
      timestamp: Date.now(),
      type: 'campfire'
    }

    setMessages((current) => [...(current || []), newMessage])
  }

  const handleGenerateInvite = () => {
    if (!user || !user.isElder) return

    const newInvite: InviteCode = {
      code: generateInviteCode(),
      generatedBy: user.id,
      createdAt: Date.now()
    }

    setInviteCodes((current) => [...(current || []), newInvite])
  }

  const handleDeleteAccount = () => {
    setUser(null)
    setFlares([])
    setMessages([])
    setTransactions([])
    setInviteCodes([])
    setAuthState('splash')
  }

  useEffect(() => {
    if (!user || !flares) return

    const completedHelps = flares.filter(
      f => f.acceptedBy === user.id && f.status === 'completed'
    ).length

    const accountAgeDays = Math.floor(
      (Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)
    )

    const shouldBeElder = checkElderStatus(user, completedHelps, accountAgeDays)

    if (shouldBeElder && !user.isElder) {
      setUser((current) => current ? { ...current, isElder: true } : null)
    }
  }, [user, flares, setUser])

  if (authState === 'splash') {
    return <SplashScreen onComplete={() => setAuthState('invite')} />
  }

  if (authState === 'invite') {
    return <InviteVerification onVerified={handleInviteVerified} />
  }

  if (authState === 'create-profile') {
    return <ProfileCreation onComplete={handleProfileCreated} />
  }

  if (!user) return null

  const helpCount = (flares || []).filter(
    f => f.acceptedBy === user.id && f.status === 'completed'
  ).length

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-hidden">
        {currentView === 'map' && (
          <MapView
            user={user}
            flares={flares || []}
            onCreateFlare={handleCreateFlare}
            onAcceptFlare={handleAcceptFlare}
          />
        )}
        {currentView === 'campfire' && (
          <CampfireView
            user={user}
            messages={messages || []}
            onSendMessage={handleSendMessage}
          />
        )}
        {currentView === 'wallet' && (
          <WalletView user={user} transactions={transactions || []} />
        )}
        {currentView === 'profile' && (
          <ProfileView
            user={user}
            helpCount={helpCount}
            inviteCodes={inviteCodes || []}
            onGenerateInvite={handleGenerateInvite}
            onDeleteAccount={handleDeleteAccount}
          />
        )}
      </div>

      <nav className="border-t border-border bg-card">
        <div className="flex items-center justify-around p-2">
          <NavButton
            icon={House}
            label="Map"
            active={currentView === 'map'}
            onClick={() => setCurrentView('map')}
          />
          <NavButton
            icon={Fire}
            label="Campfire"
            active={currentView === 'campfire'}
            onClick={() => setCurrentView('campfire')}
          />
          <NavButton
            icon={Wallet}
            label="Wallet"
            active={currentView === 'wallet'}
            onClick={() => setCurrentView('wallet')}
          />
          <NavButton
            icon={UserCircle}
            label="Profile"
            active={currentView === 'profile'}
            onClick={() => setCurrentView('profile')}
          />
        </div>
      </nav>

      <Toaster />
    </div>
  )
}

interface NavButtonProps {
  icon: React.ComponentType<any>
  label: string
  active: boolean
  onClick: () => void
}

function NavButton({ icon: Icon, label, active, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors',
        active
          ? 'text-primary bg-primary/10'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <Icon size={24} weight={active ? 'fill' : 'regular'} />
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}

export default App