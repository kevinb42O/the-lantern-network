import { useState, useEffect } from 'react'
import { Flame, Fire, Wallet, UserCircle, ChatCircleDots } from '@phosphor-icons/react'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { SplashScreen } from '@/components/screens/splash-screen'
import { AuthScreen } from '@/components/screens/auth-screen'
import { ProfileSetup } from '@/components/screens/profile-setup'
import { FlaresView } from '@/components/screens/flares-view'
import { CampfireView } from '@/components/screens/campfire-view'
import { WalletView } from '@/components/screens/wallet-view'
import { ProfileView } from '@/components/screens/profile-view'
import { MessagesView } from '@/components/screens/messages-view'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Message } from '@/lib/types'

type MainView = 'flares' | 'campfire' | 'wallet' | 'messages' | 'profile'

// Flare data from Supabase
interface FlareData {
  id: string
  creator_id: string
  title: string
  description: string
  category: string
  vibe_tags: string[]
  location: { lat: number; lng: number } | null
  radius_miles: number
  max_participants: number | null
  current_participants: number
  lantern_cost: number
  starts_at: string
  ends_at: string | null
  status: string
  created_at: string
  creator_name?: string
}

function App() {
  const { user: authUser, profile, loading: authLoading, signOut } = useAuth()
  const [showSplash, setShowSplash] = useState(true)
  const [currentView, setCurrentView] = useState<MainView>('flares')
  
  // Messages state with real-time sync
  const [messages, setMessages] = useState<Message[]>([])
  
  // Flares state
  const [flares, setFlares] = useState<FlareData[]>([])

  // Fetch flares with creator names
  const fetchFlares = async () => {
    const { data: flaresData, error } = await supabase
      .from('flares')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (error || !flaresData) return

    // Get unique creator IDs
    const creatorIds = [...new Set(flaresData.map(f => f.creator_id))]
    
    // Fetch profiles for creators
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', creatorIds)
    
    // Create a map of user_id to display_name
    const profileMap: Record<string, string> = {}
    profilesData?.forEach(p => {
      profileMap[p.user_id] = p.display_name
    })

    // Add creator names to flares
    const flaresWithNames: FlareData[] = flaresData.map(f => ({
      ...f,
      location: f.location as { lat: number; lng: number } | null,
      creator_name: profileMap[f.creator_id] || 'Anonymous'
    }))
    
    setFlares(flaresWithNames)
  }

  // Create a new flare
  const handleCreateFlare = async (flareData: {
    title: string
    description: string
    category: string
    location: { lat: number; lng: number } | null
  }) => {
    if (!authUser) return

    const { error } = await supabase.from('flares').insert({
      creator_id: authUser.id,
      title: flareData.title,
      description: flareData.description,
      category: flareData.category,
      location: flareData.location,
      starts_at: new Date().toISOString(),
      status: 'active'
    })

    if (error) {
      console.error('Error creating flare:', error)
      toast.error('Failed to create flare')
    } else {
      toast.success('Flare posted!')
      fetchFlares()
    }
  }

  // Join/offer help on a flare
  const handleJoinFlare = async (flareId: string) => {
    if (!authUser) return
    
    // For now, just show a toast - we can expand this later
    toast.success('Help offer sent!')
  }

  // Subscribe to real-time flares
  useEffect(() => {
    if (!authUser) return

    fetchFlares()

    const channel = supabase
      .channel('flares-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flares'
        },
        () => {
          fetchFlares()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [authUser])

  // Fetch campfire messages with sender names
  const fetchMessages = async () => {
    // First get messages - no limit, get all campfire messages
    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .is('flare_id', null)
      .order('created_at', { ascending: true })
    
    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return
    }
    if (!messagesData) return

    // Get unique sender IDs
    const senderIds = [...new Set(messagesData.map(m => m.sender_id))]
    
    // Fetch profiles for those senders
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', senderIds)
    
    // Create a map of user_id to display_name
    const profileMap: Record<string, string> = {}
    profilesData?.forEach(p => {
      profileMap[p.user_id] = p.display_name
    })

    // Format messages with usernames
    const formattedMessages: Message[] = messagesData.map(m => ({
      id: m.id,
      userId: m.sender_id,
      username: profileMap[m.sender_id] || 'Anonymous',
      content: m.content,
      timestamp: new Date(m.created_at).getTime(),
      type: 'campfire' as const
    }))
    
    setMessages(formattedMessages)
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
          table: 'messages'
        },
        () => {
          // Refetch to get the profile name
          fetchMessages()
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

    const { error } = await supabase.from('messages').insert({
      sender_id: authUser.id,
      receiver_id: authUser.id,
      content,
      flare_id: null
    })

    if (error) {
      console.error('Error sending message:', error)
    }
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
        {currentView === 'flares' && (
          <FlaresView
            user={userData}
            flares={flares}
            onCreateFlare={handleCreateFlare}
            onJoinFlare={handleJoinFlare}
          />
        )}
        {currentView === 'campfire' && (
          <CampfireView
            user={userData}
            messages={messages}
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
            icon={Flame}
            label="Flares"
            active={currentView === 'flares'}
            onClick={() => setCurrentView('flares')}
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
