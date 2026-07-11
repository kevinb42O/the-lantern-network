import { Plus, X } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'

export const messageReactionOptions = [
  { key: 'heart', label: '❤️', title: 'Hart' },
  { key: 'rofl', label: '🤣', title: 'ROFL' },
  { key: 'sad_tear', label: '😢', title: 'Tranen' },
  { key: 'xd', label: '😆', title: 'XD' },
  { key: 'fire', label: '🔥', title: 'Vuur' },
]

export const messageReactionKeys = messageReactionOptions.map((option) => option.key)

interface MessageReactionsProps {
  align?: 'left' | 'right'
  currentUserId: string
  disabled?: boolean
  message: {
    id: string
    reactions?: Record<string, string[]>
  }
  onReact: (messageId: string, reaction: string) => void
}

export function MessageReactions({ align = 'left', currentUserId, disabled = false, message, onReact }: MessageReactionsProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const reactionsMap = message?.reactions ?? {}
  
  // Find which reaction the current user has, if any
  let myReaction = ''
  for (const [reaction, users] of Object.entries(reactionsMap)) {
    const hasReacted = users.some(u => typeof u === 'string' ? u === currentUserId : u.userId === currentUserId)
    if (hasReacted) {
      myReaction = reaction
      break
    }
  }

  // Get the most common or last used reaction for the badge
  let badgeReaction = myReaction
  if (!badgeReaction && Object.keys(reactionsMap).length > 0) {
    badgeReaction = Object.keys(reactionsMap)[0]
  }

  const badgeOption = messageReactionOptions.find((option) => option.key === badgeReaction)
  const badgeUsers = badgeReaction ? (reactionsMap[badgeReaction] ?? []) : []
  const badgeCount = badgeUsers.length
  
  // Format user names for tooltip
  const userNames = badgeUsers.map(u => typeof u === 'string' ? 'Iemand' : u.username).join(', ')
  const tooltipTitle = userNames ? `${badgeOption?.title} van: ${userNames}` : badgeOption?.title

  useEffect(() => {
    if (!open) {
      return undefined
    }

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  async function handleReact(optionKey: string) {
    onReact(message.id, optionKey)
    setOpen(false)
  }

  return (
    <div
      ref={containerRef}
      className="contents"
    >
      {badgeOption && badgeCount > 0 ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={disabled}
          title={tooltipTitle}
          aria-label={tooltipTitle}
          className={`absolute -bottom-3 ${align === 'right' ? 'left-2' : 'right-2'} z-10 inline-flex h-7 min-w-7 items-center justify-center gap-0.5 rounded-full border border-border bg-card px-1.5 text-sm shadow-sm ring-1 ring-black/5 transition hover:bg-muted disabled:opacity-60`}
        >
          <span>{badgeOption.label}</span>
          {badgeCount > 1 ? <span className="text-[0.65rem] font-bold text-muted-foreground ml-0.5">{badgeCount}</span> : null}
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((currentlyOpen) => !currentlyOpen)}
        disabled={disabled}
        aria-expanded={open}
        aria-label="Voeg reactie toe"
        title="Voeg reactie toe"
        className={`absolute -bottom-3 ${align === 'right' ? (badgeCount > 0 ? 'left-10' : 'left-2') : (badgeCount > 0 ? 'right-10' : 'right-2')} z-10 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground disabled:opacity-60 opacity-60 md:opacity-0 md:group-hover/message:opacity-100 focus:opacity-100 ${open ? '!opacity-100' : ''}`}
      >
        {open ? <X className="h-3.5 w-3.5" aria-hidden="true" /> : <Plus className="h-3.5 w-3.5" aria-hidden="true" />}
      </button>

      {open ? (
        <div
          className={`absolute bottom-6 z-20 flex items-center gap-1 rounded-full border border-border bg-card/95 p-1.5 shadow-xl backdrop-blur ${
            align === 'right' ? 'left-0' : 'right-0'
          }`}
        >
          {messageReactionOptions.map((option) => {
            const selected = myReaction === option.key

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => handleReact(option.key)}
                disabled={disabled}
                title={option.title}
                aria-label={`${selected ? 'Verwijder' : 'Reageer met'} ${option.title}`}
                className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full border text-base transition hover:-translate-y-0.5 disabled:opacity-60 ${
                  selected
                    ? 'border-primary/30 bg-primary/10 text-primary shadow-sm'
                    : 'border-transparent bg-muted/30 text-foreground hover:bg-muted'
                }`}
              >
                <span>{option.label}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
