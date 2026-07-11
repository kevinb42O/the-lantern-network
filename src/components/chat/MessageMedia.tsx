import { ArrowsOut, Trash, X } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface MediaLightboxProps {
  media: { mediaUrl: string; mediaType: string }
  onClose: () => void
}

function MediaLightbox({ media, onClose }: MediaLightboxProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const isGif = media.mediaType === 'gif'

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const lightbox = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-label={isGif ? 'Fullscreen GIF preview' : 'Fullscreen image preview'}
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card/80 text-foreground shadow-lg transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Close image preview"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
      <img
        src={media.mediaUrl}
        alt={isGif ? 'Gedeelde GIF' : 'Gedeelde afbeelding'}
        className="max-h-[92svh] max-w-full select-none rounded-xl border border-border object-contain shadow-2xl sm:max-h-[90vh]"
        draggable="false"
      />
    </div>
  )

  return createPortal(lightbox, document.body)
}

interface MessageMediaProps {
  mediaUrl?: string
  mediaType?: string
  onDelete?: () => void
  deleting?: boolean
}

export function MessageMedia({ mediaUrl, mediaType, onDelete, deleting = false }: MessageMediaProps) {
  const [open, setOpen] = useState(false)
  const isGif = mediaType === 'gif'

  if (!mediaUrl) return null

  const media = { mediaUrl, mediaType: mediaType || 'image' }
  const deleteLabel = isGif ? 'Verwijder GIF' : 'Verwijder afbeelding'

  return (
    <>
      <div className="relative mb-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group block w-full overflow-hidden rounded-xl border border-border bg-muted/30 text-left"
          aria-label={isGif ? 'Open GIF' : 'Open afbeelding'}
        >
          <span className="block w-[240px] sm:w-[280px] max-w-full relative pb-[75%]">
            <img
              src={mediaUrl}
              alt={isGif ? 'Gedeelde GIF' : 'Gedeelde afbeelding'}
              loading="lazy"
              decoding="async"
              draggable="false"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </span>
          <span className="absolute left-2 top-2 rounded-full border border-black/30 bg-black/70 px-2 py-1 text-[0.56rem] font-bold uppercase tracking-wider text-white">
            {isGif ? 'GIF' : 'IMG'}
          </span>
          <span className="absolute bottom-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-black/70 text-white/80 opacity-0 transition group-hover:opacity-100">
            <ArrowsOut className="h-4 w-4" aria-hidden="true" />
          </span>
        </button>

        {onDelete ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onDelete()
            }}
            disabled={deleting}
            className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-card/80 text-foreground shadow-lg transition hover:bg-muted disabled:opacity-60"
            aria-label={deleteLabel}
            title={deleteLabel}
          >
            <Trash className="h-4 w-4 text-destructive" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {open ? <MediaLightbox media={media} onClose={() => setOpen(false)} /> : null}
    </>
  )
}
