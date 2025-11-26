export interface User {
  id: string
  username: string
  vibePhoto?: string
  skillTags: string[]
  lanternBalance: number
  reputation: number
  createdAt: number
  isElder: boolean
  invitedBy?: string
  location?: {
    lat: number
    lng: number
  }
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
