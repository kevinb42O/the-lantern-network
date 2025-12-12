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
  badges?: string[]
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
  flare_type: 'request' | 'offer'
  is_free: boolean
}

export interface Message {
  id: string
  userId: string
  username: string
  vibePhoto?: string
  content: string
  timestamp: number
  type: 'campfire' | 'dm'
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
  flareDescription: string
  flareCategory: 'Mechanical' | 'Food' | 'Talk' | 'Other'
  participants: {
    ownerId: string
    ownerName: string
    helperId: string
    helperName: string
  }
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

export type ReportType = 'message' | 'flare' | 'user'
export type ReportCategory = 'harassment' | 'spam' | 'inappropriate_content' | 'safety_concern' | 'other'
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'action_taken'
export type ReportAction = 'none' | 'warning' | 'content_removed' | 'user_banned'

export interface Report {
  id: string
  reporter_id: string
  reported_user_id: string
  report_type: ReportType
  target_id: string | null
  category: ReportCategory
  description: string
  status: ReportStatus
  reviewed_by: string | null
  review_notes: string | null
  action_taken: ReportAction | null
  created_at: string
  reviewed_at: string | null
  // Joined data
  reporter_name?: string
  reporter_avatar?: string | null
  reported_user_name?: string
  reported_user_avatar?: string | null
}

export interface Announcement {
  id: string
  sender_id: string
  title: string
  content: string
  gift_amount: number
  is_active: boolean
  created_at: string
  // Joined data
  sender_name?: string
  sender_avatar?: string | null
  // Stats (computed)
  read_count?: number
  claimed_count?: number
}

export interface AnnouncementRecipient {
  id: string
  announcement_id: string
  user_id: string
  read_at: string | null
  gift_claimed: boolean
  gift_claimed_at: string | null
  created_at: string
}
