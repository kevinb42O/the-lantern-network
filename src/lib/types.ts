export interface User {
  id: string
  username: string
  vibePhoto?: string
  skillTags: string[]
  lanternBalance: number
  reputation: number
  createdAt: number
  isElder: boolean
  isAdmin?: boolean
  isModerator?: boolean
  invitedBy?: string
  location?: {
    lat: number
    lng: number
  }
  lastSeenMessagesAt?: number
}

export interface LanternTransaction {
  id: string
  from: string
  to: string
  amount: number
  reason: string
  timestamp: number
}

export interface Flare {
  id: string
  userId: string
  username: string
  category: 'Mechanical' | 'Food' | 'Talk' | 'Other'
  description: string
  location: {
    lat: number
    lng: number
  }
  status: 'active' | 'accepted' | 'completed'
  createdAt: number
  acceptedBy?: string
}

export interface Message {
  id: string
  userId: string
  username: string
  vibePhoto?: string
  content: string
  timestamp: number
  type: 'campfire' | 'mission'
  chatId?: string
}

export interface InviteCode {
  code: string
  generatedBy: string
  usedBy?: string
  usedAt?: number
  createdAt: number
}

export interface Chat {
  id: string
  flareId: string
  participants: string[]
  createdAt: number
  lastActivity: number
}

export interface HelpRequest {
  id: string
  flareId: string
  helperId: string
  helperUsername: string
  flareOwnerId: string
  flareOwnerUsername: string
  message: string
  status: 'pending' | 'accepted' | 'denied'
  createdAt: number
  respondedAt?: number
  helperNotifiedAt?: number
  ownerNotifiedAt?: number
}

export interface Notification {
  id: string
  userId: string
  type: 'help_request' | 'help_accepted' | 'help_denied' | 'task_completed'
  relatedId: string // flareId or helpRequestId
  message: string
  read: boolean
  createdAt: number
}
