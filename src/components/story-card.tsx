import { Heart, HandsClapping, House, Clock } from '@phosphor-icons/react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Story, StoryReactionType } from '@/lib/types'

interface StoryCardProps {
  story: Story
  isOwner?: boolean
  onReaction?: (storyId: string, reaction: StoryReactionType) => void
  onUserClick?: (userId: string) => void
}

const reactionConfig = {
  heart: {
    icon: Heart,
    emoji: '❤️',
    label: 'Love',
    activeColor: 'text-rose-400',
    activeBg: 'bg-rose-500/20',
  },
  celebrate: {
    icon: HandsClapping,
    emoji: '👏',
    label: 'Celebrate',
    activeColor: 'text-amber-400',
    activeBg: 'bg-amber-500/20',
  },
  home: {
    icon: House,
    emoji: '🏠',
    label: 'Home',
    activeColor: 'text-emerald-400',
    activeBg: 'bg-emerald-500/20',
  },
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function getTimeRemaining(expiresAt: number): string {
  const remaining = expiresAt - Date.now()
  if (remaining <= 0) return 'expired'
  
  const hours = Math.floor(remaining / (1000 * 60 * 60))
  if (hours < 1) {
    const minutes = Math.floor(remaining / (1000 * 60))
    return `${minutes}m left`
  }
  return `${hours}h left`
}

export function StoryCard({ story, isOwner, onReaction, onUserClick }: StoryCardProps) {
  const timeAgo = getTimeAgo(story.createdAt)
  const timeRemaining = getTimeRemaining(story.expiresAt)

  return (
    <Card className="overflow-hidden border-border/30 bg-gradient-to-br from-amber-500/5 via-card/95 to-card rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 space-y-3">
        {/* Header: Avatar, Name, Time */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onUserClick?.(story.creatorId)}
            className="focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-full transition-transform hover:scale-105"
            aria-label={`View ${story.creatorName}'s profile`}
          >
            <Avatar className="h-10 w-10 ring-2 ring-amber-500/20 cursor-pointer">
              {story.creatorAvatar ? (
                <img src={story.creatorAvatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <AvatarFallback className="font-semibold bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-200">
                  {story.creatorName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
          </button>
          <div className="flex-1 min-w-0">
            <button
              onClick={() => onUserClick?.(story.creatorId)}
              className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer text-sm block truncate"
              aria-label={`View ${story.creatorName}'s profile`}
            >
              {isOwner ? 'You' : story.creatorName}
            </button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {timeAgo}
              </span>
              <span>•</span>
              <span className="text-amber-500/70">{timeRemaining}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
          {story.content}
        </p>

        {/* Optional Photo */}
        {story.photoUrl && (
          <div className="relative rounded-xl overflow-hidden bg-muted/30">
            <img
              src={story.photoUrl}
              alt="Story photo"
              className="w-full h-auto max-h-64 object-cover"
            />
          </div>
        )}

        {/* Reactions Bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/30">
          {(Object.keys(reactionConfig) as StoryReactionType[]).map((reaction) => {
            const config = reactionConfig[reaction]
            const count = story.reactions[reaction]
            const isActive = story.userReaction === reaction

            return (
              <button
                key={reaction}
                onClick={() => onReaction?.(story.id, reaction)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 text-xs font-medium
                  ${isActive 
                    ? `${config.activeBg} ${config.activeColor}` 
                    : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                  }
                `}
                title={config.label}
              >
                <span className="text-base">{config.emoji}</span>
                {count > 0 && <span>{count}</span>}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
