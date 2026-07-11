import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const tenorBaseUrl = 'https://tenor.googleapis.com/v2'
const giphyBaseUrl = 'https://api.giphy.com/v1/gifs'

function normalizeTenorGif(result: any) {
  const mediaFormats = result?.media_formats ?? {}
  const full = mediaFormats.gif?.url || mediaFormats.mediumgif?.url || mediaFormats.tinygif?.url
  const preview = mediaFormats.tinygif?.url || mediaFormats.nanogif?.url || full

  if (!full) return null

  return {
    id: result.id,
    title: result.content_description || result.title || 'GIF',
    previewUrl: preview,
    mediaUrl: full,
  }
}

function normalizeGiphyGif(result: any) {
  const full = result?.images?.original?.url || result?.images?.downsized?.url
  const preview = result?.images?.fixed_width_small?.url || result?.images?.preview_gif?.url || full

  if (!full) return null

  return {
    id: result.id,
    title: result.title || 'GIF',
    previewUrl: preview,
    mediaUrl: full,
  }
}

interface GifPickerModalProps {
  onClose: () => void
  onSelect: (media: { mediaUrl: string; mediaType: 'gif' }) => void
}

export function GifPickerModal({ onClose, onSelect }: GifPickerModalProps) {
  const selectingRef = useRef(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const giphyApiKey = import.meta.env.VITE_GIPHY_API_KEY
  const tenorApiKey = import.meta.env.VITE_TENOR_API_KEY
  const provider = giphyApiKey ? 'giphy' : 'tenor'
  const apiKey = giphyApiKey || tenorApiKey
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const trimmedQuery = query.trim()
  const missingApiKey = !apiKey

  const selectGif = useCallback((gif: any) => {
    if (selectingRef.current || !gif?.mediaUrl) return

    selectingRef.current = true
    onSelect({ mediaUrl: gif.mediaUrl, mediaType: 'gif' })
  }, [onSelect])

  const touchStartRef = useRef<{ x: number, y: number } | null>(null)

  const handleGifTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }, [])

  const handleGifTouchEnd = useCallback((event: React.TouchEvent, gif: any) => {
    if (!touchStartRef.current) return
    const touch = event.changedTouches[0]
    const dx = touch.clientX - touchStartRef.current.x
    const dy = touch.clientY - touchStartRef.current.y
    touchStartRef.current = null
    if (Math.sqrt(dx * dx + dy * dy) < 8) {
      event.preventDefault()
      selectGif(gif)
    }
  }, [selectGif])

  const endpoint = useMemo(() => {
    if (!apiKey) return ''

    if (provider === 'giphy') {
      const params = new URLSearchParams({
        api_key: apiKey,
        limit: '24',
        rating: 'pg-13',
        lang: 'en',
      })

      if (trimmedQuery) {
        params.set('q', trimmedQuery)
        return `${giphyBaseUrl}/search?${params.toString()}`
      }

      return `${giphyBaseUrl}/trending?${params.toString()}`
    }

    const params = new URLSearchParams({
      key: apiKey,
      client_key: 'lanternnetwork',
      limit: '24',
      media_filter: 'gif,tinygif,nanogif',
    })

    if (trimmedQuery) {
      params.set('q', trimmedQuery)
      return `${tenorBaseUrl}/search?${params.toString()}`
    }

    return `${tenorBaseUrl}/featured?${params.toString()}`
  }, [apiKey, provider, trimmedQuery])

  useEffect(() => {
    if (missingApiKey) return

    let cancelled = false
    const timeoutId = window.setTimeout(() => {
      setLoading(true)
      setError('')

      fetch(endpoint)
        .then((response) => {
          if (!response.ok) throw new Error('GIF search failed.')
          return response.json()
        })
        .then((data) => {
          if (cancelled) return
          const incomingResults = provider === 'giphy' ? data.data : data.results
          const normalizeGif = provider === 'giphy' ? normalizeGiphyGif : normalizeTenorGif
          setResults((incomingResults ?? []).map(normalizeGif).filter(Boolean))
        })
        .catch((gifError) => {
          if (!cancelled) setError(gifError.message)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, trimmedQuery ? 280 : 0)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [endpoint, missingApiKey, provider, trimmedQuery])

  useEffect(() => {
    const id = window.setTimeout(() => searchInputRef.current?.focus(), 60)
    return () => window.clearTimeout(id)
  }, [])

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-end bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4" role="dialog" aria-modal="true">
      <div className="max-h-[88vh] w-full overflow-hidden rounded-t-[1.35rem] border border-border bg-card pb-[env(safe-area-inset-bottom)] shadow-2xl sm:max-w-3xl sm:rounded-2xl sm:pb-0">
        <div className="flex items-center gap-2 border-b border-border bg-card/50 p-3">
          <div className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-muted/50 px-3">
            <MagnifyingGlass className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-h-10 min-w-0 flex-1 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              placeholder="Zoek GIFs..."
              inputMode="search"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Close GIF picker"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[68vh] overflow-y-auto overscroll-contain p-3 [-webkit-overflow-scrolling:touch] [touch-action:pan-y]">
          {missingApiKey || error ? (
            <p className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
              {missingApiKey ? 'GIF zoeken vereist een GIPHY of Tenor API sleutel in .env.' : error}
            </p>
          ) : null}
          {!missingApiKey && !error && loading ? (
            <p className="rounded-xl border border-border bg-muted/30 p-4 text-sm font-medium text-muted-foreground">GIFs laden...</p>
          ) : null}
          {!missingApiKey && !error && !loading && results.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {results.map((gif) => (
                <button
                  key={gif.id}
                  type="button"
                  onTouchStart={handleGifTouchStart}
                  onTouchEnd={(event) => handleGifTouchEnd(event, gif)}
                  onClick={() => selectGif(gif)}
                  className="group aspect-square overflow-hidden rounded-xl border border-border bg-muted/30 transition hover:border-primary/50"
                  aria-label={`Selecteer ${gif.title}`}
                >
                  <img src={gif.previewUrl} alt={gif.title} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                </button>
              ))}
            </div>
          ) : null}
          {!missingApiKey && !error && !loading && !results.length ? (
            <p className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm font-medium text-muted-foreground">Geen GIFs gevonden.</p>
          ) : null}
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
