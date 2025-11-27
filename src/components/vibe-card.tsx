import { Star, Sparkle } from '@phosphor-icons/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { User } from '@/lib/types'

interface VibeCardProps {
  user: User
  helpCount?: number
}

export function VibeCard({ user, helpCount = 0 }: VibeCardProps) {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarImage src={user.vibePhoto} alt={user.username} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {user.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {user.isElder && (
            <div className="absolute -bottom-1 -right-1 bg-accent rounded-full p-1">
              <Sparkle size={14} weight="fill" className="text-accent-foreground" />
            </div>
          )}
        </div>
        
        <div className="flex-1 space-y-1">
          <h2 className="text-lg font-semibold text-foreground">
            {user.username}
          </h2>
          {user.isElder && (
            <p className="text-xs text-accent font-medium">Elder Member</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <Star size={14} weight="fill" className="text-primary" />
            <span className="text-xs text-muted-foreground">
              {user.reputation} rep • {helpCount} helps
            </span>
          </div>
        </div>
      </div>
      
      {user.skillTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {user.skillTags.map((tag) => (
            <Badge 
              key={tag} 
              variant="secondary"
              className="text-xs bg-secondary/50"
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  )
}
