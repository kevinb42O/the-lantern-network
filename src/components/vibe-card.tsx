import { Star, Sparkle, HandHeart, Clock, ShieldCheck } from '@phosphor-icons/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { User } from '@/lib/types'
import { getBadgeForFlareCount } from '@/lib/economy'

interface VibeCardProps {
  user: User
  helpCount?: number
  isModerator?: boolean
}

export function VibeCard({ user, helpCount = 0, isModerator = false }: VibeCardProps) {
  // Calculate member duration
  const memberSince = user.createdAt ? new Date(user.createdAt) : new Date()
  const daysSinceJoined = Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24))

  // Get trust badge based on completed flares
  const trustBadge = getBadgeForFlareCount(helpCount)

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-card via-card to-card/80 border-border/50">
      {/* Decorative header gradient */}
      <div className="h-20 bg-gradient-to-r from-primary/20 via-accent/15 to-primary/20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
        {/* Decorative circles */}
        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-primary/10 blur-2xl" />
        <div className="absolute -top-2 left-8 w-16 h-16 rounded-full bg-accent/10 blur-xl" />
      </div>
      
      {/* Profile content */}
      <div className="px-5 pb-5 -mt-12 relative">
        <div className="flex items-end gap-4 mb-4">
          <div className="relative">
            <Avatar className="h-20 w-20 border-4 border-card ring-2 ring-primary/30 shadow-xl">
              <AvatarImage src={user.vibePhoto} alt={user.username} />
              <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/20 text-foreground text-2xl font-bold">
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* Trust badge icon */}
            <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-full ${trustBadge.bgColor} shadow-lg ring-2 ring-card`}>
              <span className="text-sm">{trustBadge.emoji}</span>
            </div>
          </div>
          
          <div className="flex-1 pb-1">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 flex-wrap">
              {user.username}
              {user.isAdmin && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs gap-1">
                  <Sparkle size={10} weight="fill" />
                  Admin
                </Badge>
              )}
              {isModerator && !user.isAdmin && (
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs gap-1">
                  <ShieldCheck size={10} weight="fill" />
                  Mod
                </Badge>
              )}
            </h2>
            {/* Trust badge name */}
            <p className={`text-sm font-medium ${trustBadge.color} flex items-center gap-1`}>
              <span>{trustBadge.emoji}</span>
              {trustBadge.name}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock size={12} />
              {daysSinceJoined === 0 ? 'Joined today' : `Member for ${daysSinceJoined} day${daysSinceJoined !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 mb-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded bg-primary/15">
              <Star size={14} weight="fill" className="text-primary" />
            </div>
            <span className="font-semibold text-foreground">{user.reputation}</span>
            <span className="text-muted-foreground">rep</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded bg-success/15">
              <HandHeart size={14} weight="duotone" className="text-success" />
            </div>
            <span className="font-semibold text-foreground">{helpCount}</span>
            <span className="text-muted-foreground">helps</span>
          </div>
        </div>
        
        {/* Skill tags */}
        {user.skillTags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {user.skillTags.map((tag) => (
              <Badge 
                key={tag} 
                variant="secondary"
                className="text-xs bg-secondary/80 hover:bg-secondary border-0 rounded-lg px-3 py-1"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
