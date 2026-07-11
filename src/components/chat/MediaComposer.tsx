import { CircleNotch, Image as ImageIcon, PaperPlaneRight, Sticker, X } from '@phosphor-icons/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { GifPickerModal } from './GifPickerModal'
import { uploadChatMedia } from '@/lib/media'

const composerMinHeight = 36
const composerMaxHeight = 128

interface MediaComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (event?: React.FormEvent) => void
  pendingMedia: { mediaUrl: string; mediaType: string } | null
  onPendingMediaChange: (media: { mediaUrl: string; mediaType: string } | null) => void
  onError?: (error: string) => void
  placeholder?: string
  maxLength?: number
  disabled?: boolean
  sending?: boolean
  onTyping?: () => void
  replyToContext?: { username: string } | null
  onCancelReply?: () => void
}

export function MediaComposer({
  value,
  onChange,
  onSubmit,
  pendingMedia,
  onPendingMediaChange,
  onError,
  placeholder = 'Typ een bericht...',
  maxLength = 1000,
  disabled = false,
  sending = false,
  onTyping,
  replyToContext,
  onCancelReply,
}: MediaComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const lastTextAreaHeightRef = useRef(composerMinHeight)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [gifPickerOpen, setGifPickerOpen] = useState(false)

  const canSend = !disabled && !sending && !uploading && Boolean(value.trim() || pendingMedia?.mediaUrl)

  useLayoutEffect(() => {
    const textArea = textAreaRef.current
    if (!textArea) return

    if (!value) {
      if (lastTextAreaHeightRef.current !== composerMinHeight) {
        lastTextAreaHeightRef.current = composerMinHeight
        textArea.style.height = `${composerMinHeight}px`
      }
      textArea.scrollTop = 0
      return
    }

    const nextHeight = Math.min(Math.max(textArea.scrollHeight, composerMinHeight), composerMaxHeight)
    const shouldGrow = nextHeight > lastTextAreaHeightRef.current + 1
    const shouldInitialize = !textArea.style.height

    if (shouldGrow || shouldInitialize) {
      lastTextAreaHeightRef.current = nextHeight
      textArea.style.height = `${nextHeight}px`
    }
  }, [value])

  async function processFile(file: File | undefined) {
    if (!file) return

    setUploading(true)
    setUploadProgress(0)
    onError?.('')

    try {
      const media = await uploadChatMedia(file, setUploadProgress)
      onPendingMediaChange(media as { mediaUrl: string; mediaType: 'image' | 'gif' })
    } catch (uploadError: any) {
      onError?.(uploadError.message || 'Fout bij uploaden')
    } finally {
      setUploading(false)
      window.setTimeout(() => setUploadProgress(0), 400)
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    processFile(file)
  }

  async function handlePaste(event: React.ClipboardEvent) {
    if (uploading) return
    const items = event.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) {
          event.preventDefault()
          processFile(file)
          break
        }
      }
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (canSend) {
        onSubmit(event)
      }
    } else {
      onTyping?.()
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-end">
      {gifPickerOpen ? (
        <GifPickerModal
          onClose={() => setGifPickerOpen(false)}
          onSelect={(media) => {
            onPendingMediaChange(media)
            setGifPickerOpen(false)
          }}
        />
      ) : null}

      <div className="mx-auto w-full max-w-4xl border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
        {replyToContext && (
          <div className="flex items-center justify-between bg-muted/30 px-4 py-2 text-xs text-muted-foreground border-b border-border">
            <span>Antwoorden op <span className="font-bold">{replyToContext.username}</span></span>
            <button type="button" onClick={onCancelReply} className="rounded-full p-1 hover:bg-muted">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        
        {pendingMedia ? (
          <div className="relative mx-4 mt-2 h-20 w-20 overflow-hidden rounded-xl border border-border bg-muted">
            <img src={pendingMedia.mediaUrl} alt="Preview" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onPendingMediaChange(null)}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : null}

        {uploading ? (
          <div className="mx-4 mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <CircleNotch className="h-4 w-4 animate-spin" />
            Uploaden...
          </div>
        ) : null}

        <form
          ref={formRef}
          onSubmit={(e) => {
            e.preventDefault()
            if (canSend) onSubmit(e)
          }}
          className="flex min-h-[3.5rem] items-end gap-2 px-2 py-2 sm:px-4 sm:py-3"
        >
          <div className="flex items-center gap-1 pb-1">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={disabled || uploading || sending}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading || sending}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
              title="Voeg afbeelding toe"
            >
              <ImageIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setGifPickerOpen(true)}
              disabled={disabled || uploading || sending}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
              title="Zoek GIF"
            >
              <Sticker className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex min-h-[2.5rem] flex-1 items-end rounded-2xl border border-border bg-muted/50 px-4 py-2 transition-colors focus-within:border-primary/50 focus-within:bg-card">
            <textarea
              ref={textAreaRef}
              value={value}
              onChange={(e) => {
                onChange(e.target.value)
                onTyping?.()
              }}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={placeholder}
              maxLength={maxLength}
              disabled={disabled || sending}
              className="w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              rows={1}
            />
          </div>

          <div className="pb-1">
            <button
              type="submit"
              disabled={!canSend}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
            >
              {sending ? (
                <CircleNotch className="h-5 w-5 animate-spin" />
              ) : (
                <PaperPlaneRight className="h-5 w-5 -ml-0.5" weight="fill" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
