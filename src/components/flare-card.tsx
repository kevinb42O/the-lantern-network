import { Wrench, ForkKnife, ChatsCircle, Lightbulb, MapPin, Clock } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Flare } from '@/lib/types'
import { formatDistance } from '@/lib/economy'

interface FlareCardProps {
  flare: Flare
  distance?: number
  onHelp?: () => void
  onClick?: () => void
}

const categoryIcons = {
  Mechanical: Wrench,
  Food: ForkKnife,
  Talk: ChatsCircle,
  Other: Lightbulb
}

const categoryColors = {
  Mechanical: 'text-blue-400',
  Food: 'text-green-400',
  Talk: 'text-purple-400',
  Other: 'text-yellow-400'
}

export function FlareCard({ flare, distance, onHelp, onClick }: FlareCardProps) {
  const Icon = categoryIcons[flare.category]
  const iconColor = categoryColors[flare.category]
  const timeAgo = getTimeAgo(flare.createdAt)

  return (
    <Card 
      className="p-4 space-y-3 hover:border-primary/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-card ${iconColor} flare-pulse`}>
          <Icon size={24} weight="duotone" />
        </div>
        
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="bg-secondary/50">
              {flare.category}
            </Badge>
            {distance !== undefined && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin size={12} />
                {formatDistance(distance)}
              </div>
            )}
          </div>
          
          <p className="text-sm text-foreground line-clamp-2">
            {flare.description}
          </p>
          
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {flare.username.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{flare.username}</span>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={12} />
              {timeAgo}
            </div>
          </div>
        </div>
      </div>
      
      {onHelp && flare.status === 'active' && (
        <Button 
          className="w-full" 
          onClick={(e) => {
            e.stopPropagation()
            onHelp()
          }}
        >
          I can help
        </Button>
      )}
    </Card>
  )
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
