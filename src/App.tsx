import { useState, useEffect, useRef } from 'react'
import { House, Fire, Wallet, UserCircle, ChatCircleDots } from '@phosphor-icons/react'
import { Toaster } from '@/components/ui/sonner'
import { SplashScreen } from '@/components/screens/splash-screen'
import { InviteVerification } from '@/components/screens/invite-verification'
import { ProfileCreation } from '@/components/screens/profile-creation'
import { MapView } from '@/components/screens/map-view'
import { CampfireView } from '@/components/screens/campfire-view'
import { WalletView } from '@/components/screens/wallet-view'
import { ProfileView } from '@/components/screens/profile-view'
import { MessagesView } from '@/components/screens/messages-view'
import type { User, Flare, Message, LanternTransaction, InviteCode, HelpRequest } from '@/lib/types'
import { INITIAL_LANTERNS, checkElderStatus, generateInviteCode } from '@/lib/economy'
import { cn } from '@/lib/utils'

// Local storage helpers - using SHARED keys (no user prefix for shared data)
function getStored<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(`lantern_${key}`)
    return data ? JSON.parse(data) : fallback
  } catch { return fallback }
}

function setStored<T>(key: string, value: T): void {
  localStorage.setItem(`lantern_${key}`, JSON.stringify(value))
}

// Generate a unique session ID for this tab
const SESSION_ID = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`

type AuthState = 'splash' | 'invite' | 'create-profile' | 'authenticated'
type MainView = 'map' | 'campfire' | 'wallet' | 'messages' | 'profile'

function App() {
  // User is stored per-session, but shared data uses common keys
  const [user, setUserState] = useState<User | null>(() => getStored(`user_${SESSION_ID}`, null) || getStored('currentUser', null))
  const [flares, setFlaresState] = useState<Flare[]>(() => getStored('shared_flares', []))
  const [messages, setMessagesState] = useState<Message[]>(() => getStored('shared_messages', []))
  const [transactions, setTransactionsState] = useState<LanternTransaction[]>(() => getStored('shared_transactions', []))
  const [inviteCodes, setInviteCodesState] = useState<InviteCode[]>(() => getStored('shared_inviteCodes', []))
  const [helpRequests, setHelpRequestsState] = useState<HelpRequest[]>(() => getStored('shared_helpRequests', []))
  const [allUsers, setAllUsersState] = useState<User[]>(() => getStored('shared_users', []))

  // BroadcastChannel for cross-tab sync
  const channelRef = useRef<BroadcastChannel | null>(null)

  // Auth state - if user exists, start authenticated, otherwise splash
  const [authState, setAuthState] = useState<AuthState>(() => 
    (getStored(`user_${SESSION_ID}`, null) || getStored('currentUser', null)) ? 'authenticated' : 'splash'
  )
  const [currentView, setCurrentView] = useState<MainView>('map')

  // Setup BroadcastChannel for cross-tab communication
  useEffect(() => {
    channelRef.current = new BroadcastChannel('lantern-network-sync')
    
    channelRef.current.onmessage = (event) => {
      const { type, data, senderId } = event.data
      if (senderId === SESSION_ID) return // Ignore own messages
      
      // Sync shared data from other tabs
      if (type === 'flares') setFlaresState(data)
      if (type === 'messages') setMessagesState(data)
      if (type === 'helpRequests') setHelpRequestsState(data)
      if (type === 'transactions') setTransactionsState(data)
      if (type === 'inviteCodes') setInviteCodesState(data)
      if (type === 'users') setAllUsersState(data)
    }

    // Request sync from other tabs on mount
    channelRef.current.postMessage({ type: 'request-sync', senderId: SESSION_ID })

    return () => channelRef.current?.close()
  }, [])

  // Broadcast changes to other tabs
  const broadcast = (type: string, data: unknown) => {
    channelRef.current?.postMessage({ type, data, senderId: SESSION_ID })
  }

  // Listen for storage events (backup sync for when BroadcastChannel fails)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (!e.key?.startsWith('lantern_shared_')) return
      const key = e.key.replace('lantern_shared_', '')
      try {
        const data = e.newValue ? JSON.parse(e.newValue) : null
        if (key === 'flares' && data) setFlaresState(data)
        if (key === 'messages' && data) setMessagesState(data)
        if (key === 'helpRequests' && data) setHelpRequestsState(data)
        if (key === 'transactions' && data) setTransactionsState(data)
        if (key === 'inviteCodes' && data) setInviteCodesState(data)
        if (key === 'users' && data) setAllUsersState(data)
      } catch {}
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Polling sync - refresh shared data every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setFlaresState(getStored('shared_flares', []))
      setMessagesState(getStored('shared_messages', []))
      setHelpRequestsState(getStored('shared_helpRequests', []))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Wrapped setters that persist to localStorage AND broadcast
  const setUser = (value: User | null | ((prev: User | null) => User | null)) => {
    setUserState(prev => {
      const newVal = typeof value === 'function' ? value(prev) : value
      setStored(`user_${SESSION_ID}`, newVal)
      // Also update in shared users list
      if (newVal) {
        setAllUsersState(users => {
          const updated = users.filter(u => u.id !== newVal.id)
          updated.push(newVal)
          setStored('shared_users', updated)
          broadcast('users', updated)
          return updated
        })
      }
      return newVal
    })
  }

  const setFlares = (value: Flare[] | ((prev: Flare[]) => Flare[])) => {
    setFlaresState(prev => {
      const newVal = typeof value === 'function' ? value(prev) : value
      setStored('shared_flares', newVal)
      broadcast('flares', newVal)
      return newVal
    })
  }

  const setMessages = (value: Message[] | ((prev: Message[]) => Message[])) => {
    setMessagesState(prev => {
      const newVal = typeof value === 'function' ? value(prev) : value
      setStored('shared_messages', newVal)
      broadcast('messages', newVal)
      return newVal
    })
  }

  const setTransactions = (value: LanternTransaction[] | ((prev: LanternTransaction[]) => LanternTransaction[])) => {
    setTransactionsState(prev => {
      const newVal = typeof value === 'function' ? value(prev) : value
      setStored('shared_transactions', newVal)
      broadcast('transactions', newVal)
      return newVal
    })
  }

  const setInviteCodes = (value: InviteCode[] | ((prev: InviteCode[]) => InviteCode[])) => {
    setInviteCodesState(prev => {
      const newVal = typeof value === 'function' ? value(prev) : value
      setStored('shared_inviteCodes', newVal)
      broadcast('inviteCodes', newVal)
      return newVal
    })
  }

  const setHelpRequests = (value: HelpRequest[] | ((prev: HelpRequest[]) => HelpRequest[])) => {
    setHelpRequestsState(prev => {
      const newVal = typeof value === 'function' ? value(prev) : value
      setStored('shared_helpRequests', newVal)
      broadcast('helpRequests', newVal)
      return newVal
    })
  }

  // Handlers
  const handleInviteVerified = () => {
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

    setFlares(current => [...current, newFlare])
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

    setMessages(current => [...current, newMessage])
  }

  const handleGenerateInvite = () => {
    if (!user || !user.isElder) return

    const newInvite: InviteCode = {
      code: generateInviteCode(),
      generatedBy: user.id,
      createdAt: Date.now()
    }

    setInviteCodes(current => [...current, newInvite])
  }

  const handleDeleteAccount = () => {
    localStorage.removeItem('lantern_user')
    localStorage.removeItem('lantern_flares')
    localStorage.removeItem('lantern_messages')
    localStorage.removeItem('lantern_transactions')
    localStorage.removeItem('lantern_inviteCodes')
    localStorage.removeItem('lantern_helpRequests')
    
    setUserState(null)
    setFlaresState([])
    setMessagesState([])
    setTransactionsState([])
    setInviteCodesState([])
    setHelpRequestsState([])
    setAuthState('splash')
  }

  const handleAcceptHelpRequest = (helpRequestId: string) => {
    if (!user) return
    const hr = helpRequests.find(h => h.id === helpRequestId)
    if (!hr || hr.flareOwnerId !== user.id) return

    setHelpRequests(current =>
      current.map(h => h.id === helpRequestId ? { ...h, status: 'accepted', respondedAt: Date.now() } : h)
    )
    setFlares(current =>
      current.map(f => f.id === hr.flareId ? { ...f, status: 'accepted', acceptedBy: hr.helperId } : f)
    )
  }

  const handleDenyHelpRequest = (helpRequestId: string) => {
    setHelpRequests(current =>
      current.map(h => h.id === helpRequestId ? { ...h, status: 'denied', respondedAt: Date.now() } : h)
    )
  }

  const handleSendHelpMessage = (helpRequestId: string, content: string) => {
    if (!user) return
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      userId: user.id,
      username: user.username,
      content,
      timestamp: Date.now(),
      type: 'mission',
      chatId: helpRequestId
    }
    setMessages(current => [...current, newMessage])
  }

  const handleCompleteFlare = (flareId: string, helperId: string) => {
    if (!user) return
    setFlares(current => current.map(f => f.id === flareId ? { ...f, status: 'completed' } : f))
    
    const tx: LanternTransaction = {
      id: `tx-${Date.now()}`,
      from: user.id,
      to: helperId,
      amount: 1,
      reason: 'Task completed - Thank you for helping!',
      timestamp: Date.now()
    }
    setTransactions(current => [...current, tx])
    setUser(current => current ? { ...current, lanternBalance: current.lanternBalance - 1 } : null)
  }

  const handleSendHelpRequest = (flareId: string, message: string) => {
    if (!user) return
    const flare = flares.find(f => f.id === flareId)
    if (!flare) return
    
    const newHelpRequest: HelpRequest = {
      id: `hr-${Date.now()}`,
      flareId,
      helperId: user.id,
      helperUsername: user.username,
      flareOwnerId: flare.userId,
      flareOwnerUsername: flare.username,
      message,
      status: 'pending',
      createdAt: Date.now()
    }
    setHelpRequests(current => [...current, newHelpRequest])
  }

  // Elder status check
  useEffect(() => {
    if (!user || !flares.length) return

    const completedHelps = flares.filter(f => f.acceptedBy === user.id && f.status === 'completed').length
    const accountAgeDays = Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24))
    const shouldBeElder = checkElderStatus(user, completedHelps, accountAgeDays)

    if (shouldBeElder && !user.isElder) {
      setUser(current => current ? { ...current, isElder: true } : null)
    }
  }, [user, flares])

  // Auth screens
  if (authState === 'splash') {
    return <SplashScreen onComplete={() => setAuthState('invite')} />
  }

  if (authState === 'invite') {
    return <InviteVerification onVerified={handleInviteVerified} />
  }

  if (authState === 'create-profile') {
    return <ProfileCreation onComplete={handleProfileCreated} />
  }

  // Main app - must have user at this point
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const helpCount = flares.filter(f => f.acceptedBy === user.id && f.status === 'completed').length

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex-1 overflow-hidden">
        {currentView === 'map' && (
          <MapView
            user={user}
            flares={flares}
            helpRequests={helpRequests}
            allUsers={allUsers}
            onCreateFlare={handleCreateFlare}
            onSendHelpRequest={handleSendHelpRequest}
          />
        )}
        {currentView === 'campfire' && (
          <CampfireView
            user={user}
            messages={messages}
            onSendMessage={handleSendMessage}
          />
        )}
        {currentView === 'wallet' && (
          <WalletView user={user} transactions={transactions} />
        )}
        {currentView === 'messages' && (
          <MessagesView
            user={user}
            flares={flares}
            messages={messages}
            helpRequests={helpRequests}
            onAcceptHelp={handleAcceptHelpRequest}
            onDenyHelp={handleDenyHelpRequest}
            onSendMessage={handleSendHelpMessage}
            onCompleteFlare={handleCompleteFlare}
          />
        )}
        {currentView === 'profile' && (
          <ProfileView
            user={user}
            helpCount={helpCount}
            inviteCodes={inviteCodes}
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
            icon={ChatCircleDots}
            label="Messages"
            active={currentView === 'messages'}
            onClick={() => setCurrentView('messages')}
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
        'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors',
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
