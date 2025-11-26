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
    <Card className="p-6 space-y-4">
      <div className="flex items-start gap-4">
        <div className="relative">
          <Avatar className="h-20 w-20 border-2 border-primary/20">
            <AvatarImage src={user.vibePhoto} alt={user.username} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl">
              {user.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {user.isElder && (
            <div className="absolute -bottom-1 -right-1 bg-accent rounded-full p-1">
              <Sparkle size={16} weight="fill" className="text-accent-foreground" />
            </div>
          )}
        </div>
        
        <div className="flex-1 space-y-1">
          <h2 className="text-2xl font-semibold text-foreground">
            {user.username}
          </h2>
          {user.isElder && (
            <p className="text-sm text-accent font-medium">Elder Member</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <Star size={16} weight="fill" className="text-primary" />
            <span className="text-sm text-muted-foreground">
              {user.reputation} reputation
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">
              {helpCount} helps completed
            </span>
          </div>
        </div>
      </div>
      
      {user.skillTags.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {user.skillTags.map((tag) => (
              <Badge 
                key={tag} 
                variant="secondary"
                className="bg-secondary/50"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
