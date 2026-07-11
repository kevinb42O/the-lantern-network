import { cn } from '@/lib/utils'
import { getSupporterBadgeInfo } from '@/lib/economy'
import type { SupporterBadgeTier } from '@/lib/types'

interface SupporterBadgeProps {
  badgeType: SupporterBadgeTier
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function SupporterBadge({ 
  badgeType, 
  size = 'md', 
  showLabel = false,
  className 
}: SupporterBadgeProps) {
  const badge = getSupporterBadgeInfo(badgeType)
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  }
  
  const emojiSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        'transition-all duration-200 hover:scale-105',
        badge.bgColor,
        badge.color,
        'border',
        badge.borderColor,
        sizeClasses[size],
        className
      )}
      title={badge.description}
    >
      <span className={cn('animate-pulse', emojiSizes[size])}>{badge.emoji}</span>
      {showLabel && <span>{badge.name}</span>}
    </span>
  )
}

// A minimal inline version for use next to usernames
export function SupporterBadgeInline({ 
  badgeType, 
  className 
}: { 
  badgeType: SupporterBadgeTier
  className?: string 
}) {
  const badge = getSupporterBadgeInfo(badgeType)
  
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'text-xs rounded-full w-5 h-5',
        badge.bgColor,
        'border',
        badge.borderColor,
        'transition-all duration-200 hover:scale-110',
        className
      )}
      title={`${badge.name}: ${badge.description}`}
    >
      <span className="text-xs">{badge.emoji}</span>
    </span>
  )
}
