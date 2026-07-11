import React, { useMemo } from 'react'
import { Plus } from '@phosphor-icons/react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Story } from '@/lib/types'

interface StoriesTrayProps {
  stories: Story[]
  currentUserId: string
  currentUserAvatar?: string | null
  currentUserName: string
  onOpenCreator: () => void
  onOpenViewer: (userId: string) => void
}

export function StoriesTray({ stories, currentUserId, currentUserAvatar, currentUserName, onOpenCreator, onOpenViewer }: StoriesTrayProps) {
  // Group stories by creator
  const groupedStories = useMemo(() => {
    const groups: Record<string, Story[]> = {}
    stories.forEach(story => {
      if (!groups[story.creatorId]) groups[story.creatorId] = []
      groups[story.creatorId].push(story)
    })
    return groups
  }, [stories])

  const hasOwnStory = !!groupedStories[currentUserId]?.length

  // Sort: own story first, then others by most recent story
  const orderedUserIds = Object.keys(groupedStories)
    .filter(id => id !== currentUserId)
    .sort((a, b) => {
      const aLatest = Math.max(...groupedStories[a].map(s => s.createdAt))
      const bLatest = Math.max(...groupedStories[b].map(s => s.createdAt))
      return bLatest - aLatest
    })

  const handleOwnClick = () => {
    if (hasOwnStory) {
      onOpenViewer(currentUserId)
    } else {
      onOpenCreator()
    }
  }

  return (
    <div className="w-full bg-card/40 border-b border-border/50 py-4 px-2 overflow-hidden">
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide px-2">
        
        {/* Own Story / Create Story Button */}
        <button 
          onClick={handleOwnClick}
          className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
        >
          <div className="relative">
            <div className={`p-[2px] rounded-full transition-transform group-hover:scale-105 ${hasOwnStory ? 'bg-gradient-to-tr from-amber-500 to-rose-500' : 'bg-transparent border border-border'}`}>
              <Avatar className="w-16 h-16 border-2 border-background">
                {currentUserAvatar ? (
                  <img src={currentUserAvatar} alt="You" className="object-cover" />
                ) : (
                  <AvatarFallback className="bg-muted text-foreground">
                    {currentUserName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            {!hasOwnStory && (
              <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 border-2 border-background shadow-sm">
                <Plus size={12} weight="bold" />
              </div>
            )}
          </div>
          <span className="text-[11px] font-medium text-muted-foreground truncate w-16 text-center">
            Jouw verhaal
          </span>
        </button>

        {/* Other Users' Stories */}
        {orderedUserIds.map(userId => {
          const userStories = groupedStories[userId]
          const avatar = userStories[0]?.creatorAvatar
          const name = userStories[0]?.creatorName || 'B'
          
          return (
            <button 
              key={userId}
              onClick={() => onOpenViewer(userId)}
              className="flex flex-col items-center gap-1.5 shrink-0 group focus:outline-none"
            >
              <div className="p-[2px] rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 transition-transform group-hover:scale-105">
                <Avatar className="w-16 h-16 border-2 border-background">
                  {avatar ? (
                    <img src={avatar} alt={name} className="object-cover" />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-500 font-semibold">
                      {name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
              <span className="text-[11px] font-medium text-foreground truncate w-16 text-center">
                {name.split(' ')[0]}
              </span>
            </button>
          )
        })}

      </div>
    </div>
  )
}
