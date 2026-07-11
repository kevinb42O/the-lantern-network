import { ArrowElbowDownRight, Image as ImageIcon } from '@phosphor-icons/react'

interface MessageReplyPreviewProps {
  currentUserId: string
  message: {
    id: string
    content: string
    username: string
  }
}

export function MessageReplyPreview({ currentUserId, message }: MessageReplyPreviewProps) {
  if (!message) return null

  // The original has a concept of media replies, but we'll stick to text replies for simplicity,
  // or indicate media if content is empty (which happens if it's purely an image)
  const isMediaOnly = !message.content || message.content.trim() === ''
  
  return (
    <div className="mb-2 flex items-start gap-2 overflow-hidden rounded-lg border-l-4 border-primary/40 bg-black/10 px-3 py-2 text-xs opacity-80 shadow-inner">
      <div className="mt-0.5 shrink-0 text-muted-foreground">
        <ArrowElbowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 font-bold truncate text-muted-foreground">
          {message.username}
        </p>
        <p className="truncate text-foreground/80">
          {isMediaOnly ? (
            <span className="flex items-center gap-1 italic">
              <ImageIcon className="h-3 w-3" />
              Gedeelde media
            </span>
          ) : (
            message.content
          )}
        </p>
      </div>
    </div>
  )
}
