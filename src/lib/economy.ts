import type { User, LanternTransaction, SupporterBadgeInfo, SupporterBadgeTier } from './types'

// Lantern economy constants
export const HOARD_LIMIT = 10
export const INITIAL_LANTERNS = 3
export const LANTERN_TRANSFER_AMOUNT = 1

// Elder/reputation constants
export const ELDER_HELP_THRESHOLD = 20
export const ELDER_DAYS_THRESHOLD = 30
export const ELDER_MIN_REPUTATION = 5
export const ELDER_TRUST_THRESHOLD = 100

// Reputation gains
export const REPUTATION_GAIN_HELPER = 10
export const REPUTATION_GAIN_OWNER = 5

// Badge system - based on completed flares count
export interface BadgeInfo {
  id: string
  name: string
  emoji: string
  description: string
  minFlares: number
  color: string
  bgColor: string
  borderColor: string
}

// Badge definitions - each tier shows trustworthiness based on completed flares
export const BADGES: BadgeInfo[] = [
  {
    id: 'newcomer',
    name: 'Newcomer',
    emoji: '🌱',
    description: 'Just starting their journey',
    minFlares: 0,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30'
  },
  {
    id: 'helper',
    name: 'Helper',
    emoji: '🤝',
    description: 'Has helped neighbors a few times',
    minFlares: 3,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30'
  },
  {
    id: 'trusted',
    name: 'Trusted Neighbor',
    emoji: '⭐',
    description: 'A reliable member of the community',
    minFlares: 10,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30'
  },
  {
    id: 'guardian',
    name: 'Guardian',
    emoji: '🛡️',
    description: 'Protector of the neighborhood',
    minFlares: 25,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30'
  },
  {
    id: 'champion',
    name: 'Community Champion',
    emoji: '🏆',
    description: 'An exceptional helper',
    minFlares: 50,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30'
  },
  {
    id: 'legend',
    name: 'Legend',
    emoji: '👑',
    description: 'A true pillar of the community',
    minFlares: 100,
    color: 'text-rose-400',
    bgColor: 'bg-gradient-to-r from-rose-500/10 to-amber-500/10',
    borderColor: 'border-rose-500/30'
  }
]

// Get badge based on completed flares count
export function getBadgeForFlareCount(completedFlares: number): BadgeInfo {
  // Return the highest badge the user qualifies for
  for (let i = BADGES.length - 1; i >= 0; i--) {
    if (completedFlares >= BADGES[i].minFlares) {
      return BADGES[i]
    }
  }
  return BADGES[0]
}

// Get all badges a user has earned
export function getEarnedBadges(completedFlares: number): BadgeInfo[] {
  return BADGES.filter(badge => completedFlares >= badge.minFlares)
}

// Get next badge info for progress display
export function getNextBadge(completedFlares: number): { badge: BadgeInfo; flaresNeeded: number } | null {
  for (const badge of BADGES) {
    if (completedFlares < badge.minFlares) {
      return {
        badge,
        flaresNeeded: badge.minFlares - completedFlares
      }
    }
  }
  return null // User has all badges
}

// Get the highest badge considering both earned badges (from completed flares) and admin-granted badges
export function getHighestBadge(completedFlares: number, adminBadges?: string[]): BadgeInfo {
  // Get the badge earned through completed flares
  const earnedBadge = getBadgeForFlareCount(completedFlares)
  
  // If no admin-granted badges, return the earned badge
  if (!adminBadges || adminBadges.length === 0) {
    return earnedBadge
  }
  
  // Find the highest admin-granted badge
  let highestAdminBadge: BadgeInfo | null = null
  for (let i = BADGES.length - 1; i >= 0; i--) {
    if (adminBadges.includes(BADGES[i].id)) {
      highestAdminBadge = BADGES[i]
      break
    }
  }
  
  // If no valid admin badge found, return earned badge
  if (!highestAdminBadge) {
    return earnedBadge
  }
  
  // Compare and return the higher one based on minFlares (higher minFlares = higher tier)
  return earnedBadge.minFlares >= highestAdminBadge.minFlares ? earnedBadge : highestAdminBadge
}

// Get all badges a user has (combining earned and admin-granted, without duplicates)
export function getAllUserBadges(completedFlares: number, adminBadges?: string[]): BadgeInfo[] {
  const earnedBadges = getEarnedBadges(completedFlares)
  
  if (!adminBadges || adminBadges.length === 0) {
    return earnedBadges
  }
  
  // Get admin-granted badges as BadgeInfo objects
  const grantedBadges = BADGES.filter(b => adminBadges.includes(b.id))
  
  // Combine and remove duplicates (keep unique by badge id)
  const allBadges = [...earnedBadges]
  for (const grantedBadge of grantedBadges) {
    if (!allBadges.some(b => b.id === grantedBadge.id)) {
      allBadges.push(grantedBadge)
    }
  }
  
  // Sort by minFlares (tier) descending
  return allBadges.sort((a, b) => b.minFlares - a.minFlares)
}

export function canReceiveLantern(user: User): boolean {
  return user.lanternBalance < HOARD_LIMIT
}

export function checkElderStatus(
  user: User,
  completedHelps: number,
  accountAgeDays: number
): boolean {
  if (user.isElder) return true
  
  const meetsHelpThreshold = completedHelps >= ELDER_HELP_THRESHOLD
  const meetsTimeThreshold = 
    accountAgeDays >= ELDER_DAYS_THRESHOLD && 
    user.reputation >= ELDER_MIN_REPUTATION
  
  return meetsHelpThreshold || meetsTimeThreshold
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m away`
  }
  return `${km.toFixed(1)}km away`
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
    if (i === 3) code += '-'
  }
  return code
}

export function mintUBI(): LanternTransaction[] {
  return Array(INITIAL_LANTERNS).fill(null).map((_, i) => ({
    id: `${Date.now()}-${i}`,
    from: 'system',
    to: 'current-user',
    amount: 1,
    reason: 'Welcome to the neighborhood',
    timestamp: Date.now()
  }))
}

// Supporter Badge system - for users who donate to support the project
export const SUPPORTER_BADGES: SupporterBadgeInfo[] = [
  {
    id: 'supporter',
    name: 'Lantern Supporter',
    emoji: '🌟',
    description: 'Supporting the Lantern Network',
    minAmount: 1,
    tier: 1,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30'
  },
  {
    id: 'flame_keeper',
    name: 'Flame Keeper',
    emoji: '🔥',
    description: 'Keeping the flame alive',
    minAmount: 5,
    tier: 2,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30'
  },
  {
    id: 'beacon',
    name: 'Beacon',
    emoji: '✨',
    description: 'A guiding light for the community',
    minAmount: 15,
    tier: 3,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30'
  },
  {
    id: 'lighthouse',
    name: 'Lighthouse',
    emoji: '🏆',
    description: 'A pillar of support for the network',
    minAmount: 50,
    tier: 4,
    color: 'text-yellow-300',
    bgColor: 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10',
    borderColor: 'border-yellow-500/30'
  }
]

// Get supporter badge info by tier ID
export function getSupporterBadgeInfo(badgeType: SupporterBadgeTier): SupporterBadgeInfo {
  return SUPPORTER_BADGES.find(b => b.id === badgeType) || SUPPORTER_BADGES[0]
}

// Get the highest supporter badge a user has based on badge type
export function getHighestSupporterBadge(badgeType?: SupporterBadgeTier): SupporterBadgeInfo | null {
  if (!badgeType) return null
  return getSupporterBadgeInfo(badgeType)
}
