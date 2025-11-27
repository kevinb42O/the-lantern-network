import { useState, useEffect } from 'react'
import { House, Fire, Wallet, UserCircle, ChatCircleDots } from '@phosphor-icons/react'
import { Toaster } from '@/components/ui/sonner'
import { SplashScreen } from '@/components/screens/splash-screen'
import { AuthScreen } from '@/components/screens/auth-screen'
import { ProfileSetup } from '@/components/screens/profile-setup'
import { CampfireView } from '@/components/screens/campfire-view'
import { WalletView } from '@/components/screens/wallet-view'
import { ProfileView } from '@/components/screens/profile-view'
import { MessagesView } from '@/components/screens/messages-view'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Message as DBMessage } from '@/lib/database.types'

type MainView = 'campfire' | 'wallet' | 'messages' | 'profile'

function App() {
  const { user: authUser, profile, loading: authLoading, signOut, updateProfile, refreshProfile } = useAuth()
  const [showSplash, setShowSplash] = useState(true)
  const [currentView, setCurrentView] = useState<MainView>('campfire')
  
  // Messages state with real-time sync
  const [messages, setMessages] = useState<DBMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  // Fetch campfire messages
  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .is('flare_id', null) // Campfire messages have no flare_id
      .order('created_at', { ascending: true })
      .limit(100)
    
    if (!error && data) {
      setMessages(data)
    }
  }

  // Subscribe to real-time messages
  useEffect(() => {
    if (!authUser) return

    fetchMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel('campfire-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: 'flare_id=is.null'
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as DBMessage])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [authUser])

  // Send a campfire message
  const handleSendMessage = async (content: string) => {
    if (!authUser || !profile) return

    await supabase.from('messages').insert({
      sender_id: authUser.id,
      receiver_id: authUser.id, // For campfire, sender = receiver (broadcast)
      content,
      flare_id: null
    })
  }

  // Handle sign out
  const handleSignOut = async () => {
    await signOut()
    setShowSplash(true)
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

  // Not logged in - show auth screen
  if (!authUser) {
    return <AuthScreen />
  }

  // Logged in but no profile - show profile setup
  if (!profile) {
    return <ProfileSetup />
  }

  // Convert messages to the format expected by CampfireView
  const campfireMessages = messages.map(m => ({
    id: m.id,
    userId: m.sender_id,
    username: profile.display_name, // We'll need to fetch sender names
    content: m.content,
    timestamp: new Date(m.created_at).getTime(),
    type: 'campfire' as const
  }))

  // User data for views
  const userData = {
    id: authUser.id,
    username: profile.display_name,
    skillTags: profile.vibe_tags || [],
    lanternBalance: profile.lantern_balance,
    reputation: profile.trust_score,
    createdAt: new Date(profile.created_at).getTime(),
    isElder: profile.trust_score >= 100,
    location: profile.location as { lat: number; lng: number } | undefined
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex-1 overflow-hidden">
        {currentView === 'campfire' && (
          <CampfireView
            user={userData}
            messages={campfireMessages}
            onSendMessage={handleSendMessage}
          />
        )}
        {currentView === 'wallet' && (
          <WalletView user={userData} transactions={[]} />
        )}
        {currentView === 'messages' && (
          <MessagesView
            user={userData}
            flares={[]}
            messages={[]}
            helpRequests={[]}
            onAcceptHelp={() => {}}
            onDenyHelp={() => {}}
            onSendMessage={() => {}}
            onCompleteFlare={() => {}}
          />
        )}
        {currentView === 'profile' && (
          <ProfileView
            user={userData}
            helpCount={0}
            inviteCodes={[]}
            onGenerateInvite={() => {}}
            onDeleteAccount={handleSignOut}
          />
        )}
      </div>

      <nav className="border-t border-border bg-card safe-area-bottom">
        <div className="flex items-center justify-around p-2">
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
  icon: React.ElementType
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
