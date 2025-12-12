import { useState, useEffect } from 'react'
import { Flame, Fire, Wallet, UserCircle, ChatCircleDots, ShieldCheck } from '@phosphor-icons/react'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { SplashScreen } from '@/components/screens/splash-screen'
import { AuthScreen } from '@/components/screens/auth-screen'
import { ProfileSetup } from '@/components/screens/profile-setup'
import { FlaresView } from '@/components/screens/flares-view'
import { CampfireView } from '@/components/screens/campfire-view'
import { ChatView } from '@/components/screens/chat-view'
import { WalletView } from '@/components/screens/wallet-view'
import { ProfileView } from '@/components/screens/profile-view'
<<<<<<< Updated upstream
import { MessagesView } from '@/components/screens/messages-view'
import { AdminView } from '@/components/screens/admin-view'
import { ModeratorView } from '@/components/screens/moderator-view'
import { StatisticsView } from '@/components/screens/statistics-view'
import { UserProfileModal } from '@/components/user-profile-modal'
import { useAuth } from '@/contexts/AuthContext'
=======
import type { User, Flare, Message, LanternTransaction, InviteCode, Chat } from '@/lib/types'
import { INITIAL_LANTERNS, checkElderStatus, generateInviteCode } from '@/lib/economy'
>>>>>>> Stashed changes
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { Message, HelpRequest, Flare, LanternTransaction, InviteCode } from '@/lib/types'
import { 
  generateInviteCode, 
  ELDER_HELP_THRESHOLD, 
  ELDER_TRUST_THRESHOLD,
  HOARD_LIMIT,
  LANTERN_TRANSFER_AMOUNT,
  REPUTATION_GAIN_HELPER,
  REPUTATION_GAIN_OWNER
} from '@/lib/economy'

// Admin configuration
const ADMIN_EMAILS = [
  'kevinb42O@hotmail.com',
]

type MainView = 'flares' | 'campfire' | 'wallet' | 'messages' | 'profile' | 'admin' | 'moderator'

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
  flare_type?: 'request' | 'offer'
  is_free?: boolean
}

// Help request data from Supabase (using flare_participants table)
interface HelpRequestData {
  id: string
  flare_id: string
  user_id: string
  status: 'pending' | 'accepted' | 'denied' | 'completed'
  message: string | null
  joined_at: string
  helper_name?: string
  flare_owner_id?: string
  flare_owner_name?: string
  flare_title?: string
  flare_description?: string
  flare_category?: string
}

function App() {
<<<<<<< Updated upstream
  const { user: authUser, profile, loading: authLoading, signOut, refreshProfile, hasCompletedOnboarding } = useAuth()
  const [showSplash, setShowSplash] = useState(true)
  const [currentView, setCurrentView] = useState<MainView>('flares')
  
  // Messages state with real-time sync
  const [messages, setMessages] = useState<Message[]>([])
  
  // Flares state
  const [flares, setFlares] = useState<FlareData[]>([])
=======
  const [authState, setAuthState] = useState<AuthState>('splash')
  const [currentView, setCurrentView] = useState<MainView>('map')
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  
  const [user, setUser] = useKV<User | null>('user', null)
  const [flares, setFlares] = useKV<Flare[]>('flares', [])
  const [messages, setMessages] = useKV<Message[]>('messages', [])
  const [chats, setChats] = useKV<Chat[]>('chats', [])
  const [transactions, setTransactions] = useKV<LanternTransaction[]>('transactions', [])
  const [inviteCodes, setInviteCodes] = useKV<InviteCode[]>('inviteCodes', [])
>>>>>>> Stashed changes

  // Help requests state
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([])

  // Transactions state
  const [transactions, setTransactions] = useState<LanternTransaction[]>([])

  // Invite codes state  
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([])

  // Help count for profile
  const [helpCount, setHelpCount] = useState(0)

  // Unread message count for badge
  const [unreadCount, setUnreadCount] = useState(0)

  // User profile modal state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [showUserProfile, setShowUserProfile] = useState(false)

  // Handle user click (for viewing profile)
  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId)
    setShowUserProfile(true)
  }

  // Fetch unread message count
  const fetchUnreadCount = async () => {
    if (!authUser) return

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', authUser.id)
      .eq('read', false)

    if (!error && count !== null) {
      setUnreadCount(count)
    }
  }

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
    flare_type: 'request' | 'offer'
    is_free: boolean
  }) => {
    if (!authUser) return

    const { error } = await supabase.from('flares').insert({
      creator_id: authUser.id,
      title: flareData.title,
      description: flareData.description,
      category: flareData.category,
      location: flareData.location,
      starts_at: new Date().toISOString(),
      status: 'active',
      flare_type: flareData.flare_type,
      is_free: flareData.is_free
    })

    if (error) {
      console.error('Error creating flare:', error)
      toast.error('Failed to create flare')
    } else {
      toast.success(flareData.flare_type === 'offer' ? 'Offer posted! 🎁' : 'Flare posted! 🔥')
      fetchFlares()
    }
  }

  // Join/offer help on a flare - NOW FULLY IMPLEMENTED
  const handleJoinFlare = async (flareId: string, message: string) => {
    if (!authUser || !profile) return
    
    // Find the flare to get owner info
    const flare = flares.find(f => f.id === flareId)
    if (!flare) {
      toast.error('Flare not found')
      return
    }

    // Check if user already requested to help
    const { data: existing } = await supabase
      .from('flare_participants')
      .select('*')
      .eq('flare_id', flareId)
      .eq('user_id', authUser.id)
      .limit(1)

    if (existing && existing.length > 0) {
      toast.error('You already offered to help with this flare')
      return
    }

    // Create help request (using flare_participants table with 'pending' status)
    const { error } = await supabase.from('flare_participants').insert({
      flare_id: flareId,
      user_id: authUser.id,
      status: 'pending',
      message: message
    })

    if (error) {
      console.error('Error offering help:', error)
      const errorDetail = error.message || error.code || JSON.stringify(error).slice(0, 100)
      toast.error(`Failed to send help offer: ${errorDetail}`)
      return
    }

    // Also send a message to the flare owner so they get a notification
    // Validate that we have valid UUIDs before inserting
    if (!flare.creator_id || flare.creator_id === authUser.id) {
      // Can't send message to yourself or invalid creator
      toast.success('Help offer sent! Waiting for response...')
      fetchHelpRequests()
      return
    }

    const { error: messageError } = await supabase.from('messages').insert({
      sender_id: authUser.id,
      receiver_id: flare.creator_id,
      content: message,
      flare_id: flareId,
      read: false
    })

    if (messageError) {
      console.error('Error sending notification message:', messageError)
      console.error('Message error details:', JSON.stringify(messageError, null, 2))
      // Help request was created, the message in flare_participants serves as backup
      toast.success('Help offer sent! Waiting for response...')
    } else {
      toast.success('Help offer sent! Waiting for response...')
    }
    
    fetchHelpRequests()
  }

  // Fetch help requests (for messages view)
  const fetchHelpRequests = async () => {
    if (!authUser) return

<<<<<<< Updated upstream
    try {
      // Get all help requests where user is involved (as helper or flare owner)
      const { data: participantsData, error: participantsError } = await supabase
        .from('flare_participants')
        .select('*')
        .order('joined_at', { ascending: false })

      if (participantsError) {
        console.error('Error fetching help requests:', participantsError)
        return
      }

      // Get flare details for these participants
      const flareIds = [...new Set(participantsData?.map(p => p.flare_id) || [])]
      
      const { data: flaresData } = await supabase
        .from('flares')
        .select('*')
        .in('id', flareIds)

      // Get user profiles
      const userIds = [...new Set([
        ...(participantsData?.map(p => p.user_id) || []),
        ...(flaresData?.map(f => f.creator_id) || [])
      ])]

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds)

      const profileMap: Record<string, string> = {}
      profilesData?.forEach(p => {
        profileMap[p.user_id] = p.display_name
      })

      const flareMap: Record<string, FlareData> = {}
      flaresData?.forEach(f => {
        flareMap[f.id] = f as FlareData
      })

      // Filter to only requests involving current user
      const relevantRequests = participantsData?.filter(p => {
        const flare = flareMap[p.flare_id]
        return p.user_id === authUser.id || flare?.creator_id === authUser.id
      }) || []

      // Format as HelpRequest type
      // Filter out requests where we couldn't find the flare (shouldn't happen but be safe)
      const formattedRequests: HelpRequest[] = relevantRequests
        .filter(p => {
          const flare = flareMap[p.flare_id]
          // Only include if we have valid flare data with a creator_id
          return flare && flare.creator_id
        })
        .map(p => {
          const flare = flareMap[p.flare_id]
          return {
            id: p.id,
            flareId: p.flare_id,
            helperId: p.user_id,
            helperUsername: profileMap[p.user_id] || 'Anonymous',
            flareOwnerId: flare!.creator_id,  // Safe because of filter above
            flareOwnerUsername: profileMap[flare!.creator_id] || 'Anonymous',
            message: p.message || '',
            status: p.status as 'pending' | 'accepted' | 'denied',
            createdAt: new Date(p.joined_at).getTime()
          }
        })

      setHelpRequests(formattedRequests)
    } catch (err) {
      console.error('Help requests fetch error:', err)
    }
  }

  // Accept a help request
  const handleAcceptHelp = async (helpRequestId: string) => {
    if (!authUser) return

    const { error } = await supabase
      .from('flare_participants')
      .update({ status: 'accepted' })
      .eq('id', helpRequestId)

    if (error) {
      console.error('Error accepting help:', error)
      toast.error('Failed to accept help offer')
    } else {
      toast.success('Help offer accepted! You can now chat.')
      fetchHelpRequests()
    }
  }

  // Deny a help request
  const handleDenyHelp = async (helpRequestId: string) => {
    if (!authUser) return

    const { error } = await supabase
      .from('flare_participants')
      .update({ status: 'denied' })
      .eq('id', helpRequestId)

    if (error) {
      console.error('Error denying help:', error)
      toast.error('Failed to decline help offer')
    } else {
      toast.info('Help offer declined')
      fetchHelpRequests()
    }
  }

  // Send a message in a help request chat
  const handleSendChatMessage = async (helpRequestId: string, content: string) => {
    if (!authUser || !profile) return

    // Find the help request to get the other participant
    const helpRequest = helpRequests.find(hr => hr.id === helpRequestId)
    if (!helpRequest) {
      toast.error('Conversation not found. Please refresh and try again.')
      return
    }

    const receiverId = helpRequest.helperId === authUser.id 
      ? helpRequest.flareOwnerId 
      : helpRequest.helperId

    // Validate receiverId is a valid UUID (standard format: 8-4-4-4-12 = 36 chars with hyphens)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!receiverId || !uuidRegex.test(receiverId)) {
      console.error('Invalid receiver ID:', receiverId)
      toast.error('Unable to send message. Please refresh and try again.')
      fetchHelpRequests() // Refresh data to fix the issue
      return
    }

    const { error } = await supabase.from('messages').insert({
      sender_id: authUser.id,
      receiver_id: receiverId,
      content,
      flare_id: helpRequest.flareId,
      read: false
    })

    if (error) {
      console.error('Error sending message:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      toast.error('Failed to send message. Please try again.')
    }
  }

  // Complete a flare and transfer lanterns
  const handleCompleteFlare = async (flareId: string, helperId: string) => {
    if (!authUser || !profile) return

    // Check if user has enough lanterns
    if (profile.lantern_balance < LANTERN_TRANSFER_AMOUNT) {
      toast.error('Not enough lanterns to complete this task')
      return
    }

    try {
      // Update flare status
      await supabase
        .from('flares')
        .update({ status: 'completed' })
        .eq('id', flareId)

      // Update help request status
      await supabase
        .from('flare_participants')
        .update({ status: 'completed' })
        .eq('flare_id', flareId)
        .eq('user_id', helperId)

      // Transfer lantern from owner to helper
      // 1. Deduct from owner
      await supabase
        .from('profiles')
        .update({ 
          lantern_balance: profile.lantern_balance - LANTERN_TRANSFER_AMOUNT,
          trust_score: (profile.trust_score || 0) + REPUTATION_GAIN_OWNER
        })
        .eq('user_id', authUser.id)

      // 2. Get helper's current balance
      const { data: helperProfile } = await supabase
        .from('profiles')
        .select('lantern_balance, trust_score')
        .eq('user_id', helperId)
        .single()

      // 3. Add to helper (max hoard limit)
      const newBalance = Math.min((helperProfile?.lantern_balance || 0) + LANTERN_TRANSFER_AMOUNT, HOARD_LIMIT)
      await supabase
        .from('profiles')
        .update({ 
          lantern_balance: newBalance,
          trust_score: (helperProfile?.trust_score || 0) + REPUTATION_GAIN_HELPER
        })
        .eq('user_id', helperId)

      // 4. Record transactions
      await supabase.from('transactions').insert([
        {
          user_id: authUser.id,
          type: 'transfer_out',
          amount: -LANTERN_TRANSFER_AMOUNT,
          description: 'Sent as thanks for help',
          flare_id: flareId
        },
        {
          user_id: helperId,
          type: 'transfer_in',
          amount: LANTERN_TRANSFER_AMOUNT,
          description: 'Received for helping',
          flare_id: flareId
        }
      ])

      toast.success(`🏮 Task completed! ${LANTERN_TRANSFER_AMOUNT} Lantern sent as thanks!`)
      
      // Refresh data
      fetchFlares()
      fetchHelpRequests()
      fetchTransactions()
      refreshProfile()
      
      // Check for elder promotion
      checkElderPromotion(helperId)
    } catch (err) {
      console.error('Error completing flare:', err)
      toast.error('Failed to complete task')
    }
  }

  // Mark all messages as read for the current user
  const handleMarkAsRead = async () => {
    if (!authUser) return

    await supabase
      .from('messages')
      .update({ read: true })
      .eq('receiver_id', authUser.id)
      .eq('read', false)

    // Update the local unread count
    setUnreadCount(0)
  }

  // Fetch transactions
  const fetchTransactions = async () => {
    if (!authUser) return

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching transactions:', error)
      return
    }

    // Format transactions
    const formatted: LanternTransaction[] = (data || []).map(t => ({
      id: t.id,
      from: t.type === 'transfer_in' ? 'neighbor' : authUser.id,
      to: t.type === 'transfer_out' ? 'neighbor' : authUser.id,
      amount: Math.abs(t.amount),
      reason: t.description,
      timestamp: new Date(t.created_at).getTime()
    }))

    setTransactions(formatted)
  }

  // Fetch help count for profile
  const fetchHelpCount = async () => {
    if (!authUser) return

    const { count } = await supabase
      .from('flare_participants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authUser.id)
      .eq('status', 'completed')

    setHelpCount(count || 0)
  }

  // Fetch invite codes
  const fetchInviteCodes = async () => {
    if (!authUser) return

    const { data, error } = await supabase
      .from('invites')
      .select('*')
      .eq('inviter_id', authUser.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invites:', error)
      return
    }

    const formatted: InviteCode[] = (data || []).map(i => ({
      code: i.code,
      generatedBy: i.inviter_id,
      usedBy: i.used_by_id || undefined,
      usedAt: i.used ? new Date(i.created_at).getTime() : undefined,
      createdAt: new Date(i.created_at).getTime()
    }))

    setInviteCodes(formatted)
  }

  // Generate a new invite code
  const handleGenerateInvite = async () => {
    if (!authUser) return

    const code = generateInviteCode()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 day expiry

    const { error } = await supabase.from('invites').insert({
      inviter_id: authUser.id,
      code,
      expires_at: expiresAt.toISOString()
    })

    if (error) {
      console.error('Error generating invite:', error)
      toast.error('Failed to generate invite code')
    } else {
      toast.success('New invite code generated!')
      fetchInviteCodes()
    }
  }

  // Check for elder promotion
  const checkElderPromotion = async (userId: string) => {
    // Count completed helps
    const { count } = await supabase
      .from('flare_participants')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')

    if ((count || 0) >= ELDER_HELP_THRESHOLD) {
      // Get user's profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('trust_score')
        .eq('user_id', userId)
        .single()

      // If they've reached elder threshold, their trust_score should be high enough
      // The Elder badge is shown when trust_score >= ELDER_TRUST_THRESHOLD
      if ((userProfile?.trust_score || 0) >= ELDER_TRUST_THRESHOLD) {
        toast.success('🌟 Congratulations! You\'ve earned Elder status!')
      }
    }
  }

  // Subscribe to real-time flares
  useEffect(() => {
    if (!authUser) return

    fetchFlares()
    fetchHelpRequests()
    fetchTransactions()
    fetchHelpCount()
    fetchInviteCodes()
    fetchUnreadCount()

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

    // Also subscribe to flare_participants changes
    const participantsChannel = supabase
      .channel('participants-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flare_participants'
        },
        () => {
          fetchHelpRequests()
          fetchHelpCount()
        }
      )
      .subscribe()

    // Subscribe to messages for unread count updates
    // Only listen for new messages where user is the receiver
    const messagesChannel = supabase
      .channel('messages-unread')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${authUser.id}`
        },
        () => {
          fetchUnreadCount()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${authUser.id}`
        },
        () => {
          fetchUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(participantsChannel)
      supabase.removeChannel(messagesChannel)
    }
  }, [authUser])

  // Track admin user IDs - fetch once on load
  const [adminUserIds, setAdminUserIds] = useState<string[]>([])
  // Track moderator user IDs
  const [moderatorUserIds, setModeratorUserIds] = useState<string[]>([])
  
  // Fetch admin user IDs on mount
  useEffect(() => {
    const fetchAdminIds = async () => {
      // Get user IDs for admin emails from auth.users via profiles
      // Since we can't query auth.users directly, we check if current user is admin
      // and store their ID. For other admins, we'd need is_admin in profiles table.
      if (authUser && ADMIN_EMAILS.some(e => e.toLowerCase() === (authUser.email || '').toLowerCase())) {
        setAdminUserIds(prev => prev.includes(authUser.id) ? prev : [...prev, authUser.id])
      }
    }
    fetchAdminIds()
  }, [authUser])

  // Fetch campfire messages with sender names
  const fetchMessages = async () => {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .is('flare_id', null)
        .order('created_at', { ascending: true })
      
      if (messagesError || !messagesData) {
        console.error('Error fetching messages:', messagesError)
        return
      }

      // Get all unique sender IDs
      const senderIds = [...new Set(messagesData.map(m => m.sender_id))]
      
      // Fetch all profiles for these senders, including is_admin and is_moderator flags
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, is_admin, is_moderator')
        .in('user_id', senderIds)
      
      // Create a map of user_id to display_name and collect admin/moderator IDs
      const profileMap: Record<string, string> = {}
      const fetchedAdminIds: string[] = []
      const fetchedModeratorIds: string[] = []
      profilesData?.forEach(p => {
        profileMap[p.user_id] = p.display_name
        if (p.is_admin) {
          fetchedAdminIds.push(p.user_id)
        }
        if (p.is_moderator) {
          fetchedModeratorIds.push(p.user_id)
        }
      })
      
      // Update admin user IDs
      if (fetchedAdminIds.length > 0) {
        setAdminUserIds(prev => {
          const combined = [...new Set([...prev, ...fetchedAdminIds])]
          return combined
        })
      }

      // Update moderator user IDs
      if (fetchedModeratorIds.length > 0) {
        setModeratorUserIds(prev => {
          const combined = [...new Set([...prev, ...fetchedModeratorIds])]
          return combined
        })
      }

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

      // Also fetch mission messages (those with flare_id)
      await fetchMissionMessages()
    } catch (err) {
      console.error('Messages fetch error:', err)
    }
=======
    const flare = (flares || []).find(f => f.id === flareId)
    if (!flare) return

    // Update flare status
    setFlares((current) =>
      (current || []).map(f =>
        f.id === flareId
          ? { ...f, status: 'accepted' as const, acceptedBy: user.id }
          : f
      )
    )

    // Create a new chat for this flare
    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      flareId: flare.id,
      flareDescription: flare.description,
      flareCategory: flare.category,
      participants: {
        ownerId: flare.userId,
        ownerName: flare.username,
        helperId: user.id,
        helperName: user.username
      },
      createdAt: Date.now(),
      lastActivity: Date.now()
    }

    setChats((current) => [...(current || []), newChat])
    
    // Navigate to campfire and open the chat
    setCurrentView('campfire')
    setActiveChatId(newChat.id)
>>>>>>> Stashed changes
  }

  // Fetch mission/chat messages for help requests
  const [missionMessages, setMissionMessages] = useState<Message[]>([])
  
  const fetchMissionMessages = async () => {
    if (!authUser) return

    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .not('flare_id', 'is', null)
        .or(`sender_id.eq.${authUser.id},receiver_id.eq.${authUser.id}`)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching mission messages:', error)
        return
      }

      // Get sender profiles
      const senderIds = [...new Set(messagesData?.map(m => m.sender_id) || [])]
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', senderIds)

      const profileMap: Record<string, string> = {}
      profilesData?.forEach(p => {
        profileMap[p.user_id] = p.display_name
      })

      // Find help requests for each flare - include user_id to handle multiple participants per flare
      const flareIds = [...new Set(messagesData?.map(m => m.flare_id).filter(Boolean) || [])]
      const { data: participantsData } = await supabase
        .from('flare_participants')
        .select('id, flare_id, user_id')
        .in('flare_id', flareIds)

      // Get flare creator info to identify the flare owner
      const { data: flaresData } = await supabase
        .from('flares')
        .select('id, creator_id')
        .in('id', flareIds)

      const flareOwnerMap: Record<string, string> = {}
      flaresData?.forEach(f => {
        flareOwnerMap[f.id] = f.creator_id
      })

      // Create a map: flare_id + helper_user_id -> help_request_id
      // This handles multiple participants per flare with separate conversations
      const participantMap: Record<string, string> = {}
      participantsData?.forEach(p => {
        participantMap[`${p.flare_id}:${p.user_id}`] = p.id
      })

      const formatted: Message[] = (messagesData || []).map(m => {
        const flareId = m.flare_id || ''
        const flareOwnerId = flareOwnerMap[flareId] || ''
        
        // Determine the helper's user_id for this message
        // Flare messages are always 1:1 between the flare owner and a helper
        // If sender is the flare owner, the helper is the receiver; otherwise sender is the helper
        const helperId = m.sender_id === flareOwnerId ? m.receiver_id : m.sender_id
        
        // Look up the help request for this flare+helper combination
        const chatId = participantMap[`${flareId}:${helperId}`] || flareId
        
        return {
          id: m.id,
          userId: m.sender_id,
          username: profileMap[m.sender_id] || 'Anonymous',
          content: m.content,
          timestamp: new Date(m.created_at).getTime(),
          type: 'mission' as const,
          chatId
        }
      })

      setMissionMessages(formatted)
    } catch (err) {
      console.error('Mission messages fetch error:', err)
    }
  }

  // Subscribe to real-time messages + polling fallback
  useEffect(() => {
    if (!authUser) return

    fetchMessages()

    // Polling fallback - refresh every 3 seconds
    const pollInterval = setInterval(() => {
      fetchMessages()
    }, 3000)

    // Also try real-time subscription
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
      clearInterval(pollInterval)
      supabase.removeChannel(channel)
    }
  }, [authUser])

  // Send a campfire message
  const handleSendMessage = async (content: string) => {
    if (!authUser || !profile) return

    // Optimistic update - add message immediately to UI
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      userId: authUser.id,
      username: profile.display_name,
      content,
      timestamp: Date.now(),
      type: 'campfire' as const
    }
    setMessages(prev => [...prev, tempMessage])

    // Send to server
    const { error } = await supabase.from('messages').insert({
      sender_id: authUser.id,
      receiver_id: authUser.id,
      content,
      flare_id: null
    })

    if (error) {
      console.error('Error sending message:', error)
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id))
    } else {
      // Refetch to get the real message with proper ID
      fetchMessages()
    }
  }

<<<<<<< Updated upstream
  // Admin: Remove a flare
  const handleRemoveFlare = async (flareId: string) => {
    if (!authUser) return
=======
  const handleSendDM = (content: string, chatId: string) => {
    if (!user) return

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      userId: user.id,
      username: user.username,
      content,
      timestamp: Date.now(),
      type: 'dm',
      chatId
    }

    setMessages((current) => [...(current || []), newMessage])

    // Update chat's last activity
    setChats((current) =>
      (current || []).map(c =>
        c.id === chatId
          ? { ...c, lastActivity: Date.now() }
          : c
      )
    )
  }

  const handleOpenChat = (chatId: string) => {
    setActiveChatId(chatId)
  }

  const handleCloseChat = () => {
    setActiveChatId(null)
  }

  const handleGenerateInvite = () => {
    if (!user || !user.isElder) return
>>>>>>> Stashed changes

    const { error } = await supabase
      .from('flares')
      .delete()
      .eq('id', flareId)

    if (error) {
      console.error('Error removing flare:', error)
      throw new Error('Failed to remove flare')
    }

    fetchFlares()
  }

  // Admin: Clear all campfire messages
  const handleClearCampfire = async () => {
    if (!authUser) return

    // Delete all campfire messages (those without flare_id)
    const { error } = await supabase
      .from('messages')
      .delete()
      .is('flare_id', null)

    if (error) {
      console.error('Error clearing campfire:', error)
      throw new Error('Failed to clear campfire')
    }

    setMessages([])
<<<<<<< Updated upstream
=======
    setChats([])
    setTransactions([])
    setInviteCodes([])
    setAuthState('splash')
>>>>>>> Stashed changes
  }

  // Handle sign out
  const handleSignOut = async () => {
    await signOut()
    setShowSplash(true)
  }

  // Check for demo mode via URL parameter (for testing/screenshots)
  const urlParams = new URLSearchParams(window.location.search)
  const demoMode = urlParams.get('demo') === 'stats'

  // Demo mode: Show statistics view directly
  if (demoMode) {
    return (
      <div className="h-screen bg-background">
        <StatisticsView isAdmin={true} />
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

  // Logged in but no profile AND haven't completed onboarding - show profile setup
  // This check uses hasCompletedOnboarding flag to prevent showing ProfileSetup 
  // for existing users who have network issues or timeouts on profile fetch
  if (!profile && !hasCompletedOnboarding) {
    return <ProfileSetup />
  }

  // If we have no profile but hasCompletedOnboarding is true, show a loading/retry state
  // This handles the case where profile fetch failed for an existing user
  if (!profile && hasCompletedOnboarding) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground text-center">Loading your profile...</p>
        <button 
          onClick={refreshProfile}
          className="text-primary hover:underline text-sm"
        >
          Tap to retry
        </button>
      </div>
    )
  }

  // Check if current user is admin (case-insensitive)
  const isAdmin = ADMIN_EMAILS.some(email => 
    email.toLowerCase() === (authUser.email || '').toLowerCase()
  )

  // Check if current user is moderator
  const isModerator = (profile as Record<string, unknown>).is_moderator === true

  // User data for views
  const userData = {
    id: authUser.id,
    username: profile.display_name,
    skillTags: profile.vibe_tags || [],
    lanternBalance: profile.lantern_balance,
    reputation: profile.trust_score,
    createdAt: new Date(profile.created_at).getTime(),
    isElder: profile.trust_score >= ELDER_TRUST_THRESHOLD,
    location: profile.location as { lat: number; lng: number } | undefined,
    isAdmin,
    isModerator,
    badges: profile.badges || []
  }

  // Find active chat if one is selected
  const activeChat = activeChatId 
    ? (chats || []).find(c => c.id === activeChatId) 
    : null

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex-1 overflow-hidden">
        {currentView === 'flares' && (
          <FlaresView
            user={userData}
            flares={flares}
            helpRequests={helpRequests}
            onCreateFlare={handleCreateFlare}
            onJoinFlare={handleJoinFlare}
            onUserClick={handleUserClick}
          />
        )}
        {currentView === 'campfire' && !activeChat && (
          <CampfireView
<<<<<<< Updated upstream
            user={userData}
            messages={messages}
            onSendMessage={handleSendMessage}
            adminUserIds={isAdmin ? [...adminUserIds, authUser.id] : adminUserIds}
            moderatorUserIds={moderatorUserIds}
            onUserClick={handleUserClick}
=======
            user={user}
            messages={messages || []}
            chats={chats || []}
            onSendMessage={handleSendMessage}
            onOpenChat={handleOpenChat}
          />
        )}
        {currentView === 'campfire' && activeChat && (
          <ChatView
            user={user}
            chat={activeChat}
            messages={messages || []}
            onSendMessage={handleSendDM}
            onBack={handleCloseChat}
>>>>>>> Stashed changes
          />
        )}
        {currentView === 'wallet' && (
          <WalletView user={userData} transactions={transactions} />
        )}
        {currentView === 'messages' && (
          <MessagesView
            user={userData}
            flares={flares.map(f => ({
              id: f.id,
              userId: f.creator_id,
              username: f.creator_name || 'Anonymous',
              category: f.category as 'Mechanical' | 'Food' | 'Talk' | 'Other',
              description: f.description,
              location: f.location || { lat: 0, lng: 0 },
              status: f.status as 'active' | 'accepted' | 'completed',
              createdAt: new Date(f.created_at).getTime()
            }))}
            messages={missionMessages}
            helpRequests={helpRequests}
            onAcceptHelp={handleAcceptHelp}
            onDenyHelp={handleDenyHelp}
            onSendMessage={handleSendChatMessage}
            onCompleteFlare={handleCompleteFlare}
            onMarkAsRead={handleMarkAsRead}
          />
        )}
        {currentView === 'profile' && (
          <ProfileView
            user={userData}
            helpCount={helpCount}
            inviteCodes={inviteCodes}
            onGenerateInvite={handleGenerateInvite}
            onDeleteAccount={handleSignOut}
          />
        )}
        {currentView === 'admin' && isAdmin && (
          <AdminView
            onRemoveFlare={handleRemoveFlare}
            onClearCampfire={handleClearCampfire}
          />
        )}
        {currentView === 'moderator' && isModerator && !isAdmin && (
          <ModeratorView
            onRemoveFlare={handleRemoveFlare}
            onClearCampfire={handleClearCampfire}
          />
        )}
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        userId={selectedUserId}
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
      />

      {/* Enhanced Bottom Navigation */}
      <nav className="border-t border-border/50 bg-card/95 backdrop-blur-md safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-around p-1.5 max-w-lg mx-auto">
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
            badge={unreadCount}
          />
          <NavButton
            icon={UserCircle}
            label="Profile"
            active={currentView === 'profile'}
            onClick={() => setCurrentView('profile')}
          />
          {isModerator && !isAdmin && (
            <NavButton
              icon={ShieldCheck}
              label="Mod"
              active={currentView === 'moderator'}
              onClick={() => setCurrentView('moderator')}
              isModeratorButton
            />
          )}
          {isAdmin && (
            <NavButton
              icon={ShieldCheck}
              label="Admin"
              active={currentView === 'admin'}
              onClick={() => setCurrentView('admin')}
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

export default App
