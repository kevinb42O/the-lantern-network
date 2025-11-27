import { Wrench, ForkKnife, ChatsCircle, Lightbulb, MapPin, Clock, ChatCircle, CheckCircle, Hourglass, XCircle } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Flare } from '@/lib/types'
import { formatDistance } from '@/lib/economy'

interface FlareCardProps {
  flare: Flare
  distance?: number
  isOwner?: boolean
  pendingHelpCount?: number
  helpRequestStatus?: 'pending' | 'accepted' | 'denied'
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

const statusColors = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  accepted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed: 'bg-muted text-muted-foreground border-muted'
}

export function FlareCard({ flare, distance, isOwner, pendingHelpCount, helpRequestStatus, onHelp, onClick }: FlareCardProps) {
  const Icon = categoryIcons[flare.category]
  const iconColor = categoryColors[flare.category]
  const timeAgo = getTimeAgo(flare.createdAt)

  return (
    <Card 
      className={`p-4 space-y-3 transition-colors ${isOwner ? 'border-primary/30 bg-primary/5' : ''} ${onClick ? 'cursor-pointer hover:border-primary/50' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-card ${iconColor} ${flare.status === 'active' ? 'flare-pulse' : ''}`}>
          <Icon size={24} weight="duotone" />
        </div>
        
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="bg-secondary/50">
                {flare.category}
              </Badge>
              {isOwner && (
                <Badge className={statusColors[flare.status]}>
                  {flare.status === 'active' ? '🔥 Active' : flare.status === 'accepted' ? '🤝 Accepted' : '✅ Done'}
                </Badge>
              )}
              {isOwner && pendingHelpCount !== undefined && pendingHelpCount > 0 && (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  {pendingHelpCount} help offer{pendingHelpCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
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
            <span className="text-xs text-muted-foreground">
              {isOwner ? 'You' : flare.username}
            </span>
            <span className="text-muted-foreground">•</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock size={12} />
              {timeAgo}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-1 border-t border-border/50">
        {isOwner ? (
          <div className="text-xs text-muted-foreground">
            {pendingHelpCount !== undefined && pendingHelpCount > 0 ? (
              <span className="text-primary font-medium">
                {pendingHelpCount} help offer{pendingHelpCount > 1 ? 's' : ''} • Check Messages
              </span>
            ) : flare.status === 'accepted' ? (
              <span className="text-blue-400">Help accepted • Check Messages</span>
            ) : flare.status === 'completed' ? (
              <span>✅ Completed</span>
            ) : (
              <span>Waiting for offers...</span>
            )}
          </div>
        ) : (
          <>
            {helpRequestStatus === 'pending' ? (
              <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
                <Hourglass size={12} className="mr-1" />
                Pending
              </Badge>
            ) : helpRequestStatus === 'accepted' ? (
              <Badge variant="outline" className="text-green-500 border-green-500/30">
                <CheckCircle size={12} weight="fill" className="mr-1" />
                Accepted
              </Badge>
            ) : helpRequestStatus === 'denied' ? (
              <Badge variant="outline" className="text-muted-foreground">
                <XCircle size={12} className="mr-1" />
                Declined
              </Badge>
            ) : (
              onHelp && flare.status === 'active' && (
                <Button 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onHelp()
                  }}
                >
                  I can help
                </Button>
              )
            )}
          </>
        )}
      </div>
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
