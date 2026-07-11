import React, { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { X, Heart, HandsClapping, House, Clock } from '@phosphor-icons/react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Story, StoryReactionType } from '@/lib/types'

interface StoryViewerProps {
  stories: Story[]
  initialIndex?: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onReaction?: (storyId: string, reaction: StoryReactionType) => void
  onNextUser?: () => void
  onPrevUser?: () => void
}

const STORY_DURATION = 5000 // 5 seconds per story

export function StoryViewer({ stories, initialIndex = 0, open, onOpenChange, onReaction, onNextUser, onPrevUser }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Reset when opened
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex)
      setProgress(0)
      setIsPaused(false)
    }
  }, [open, initialIndex, stories])

  const nextStory = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setProgress(0)
    } else {
      // Last story reached, go to next user if possible, else close
      if (onNextUser) onNextUser()
      else onOpenChange(false)
    }
  }, [currentIndex, stories.length, onNextUser, onOpenChange])

  const prevStory = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setProgress(0)
    } else {
      if (onPrevUser) onPrevUser()
    }
  }, [currentIndex, onPrevUser])

  // Progress timer
  useEffect(() => {
    if (!open || isPaused) return
    
    const interval = 50 // Update every 50ms
    const step = (interval / STORY_DURATION) * 100
    
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(timer)
          nextStory()
          return 100
        }
        return p + step
      })
    }, interval)

    return () => clearInterval(timer)
  }, [open, isPaused, currentIndex, nextStory])

  if (!stories.length || !open) return null
  const currentStory = stories[currentIndex]

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsPaused(true)
  }

  const handlePointerUp = (e: React.MouseEvent | React.TouchEvent) => {
    setIsPaused(false)
    
    // Determine click position for navigation
    let clientX = 0
    if ('changedTouches' in e) {
      clientX = e.changedTouches[0].clientX
    } else {
      clientX = (e as React.MouseEvent).clientX
    }
    
    const width = window.innerWidth
    if (clientX < width * 0.3) {
      prevStory()
    } else if (clientX > width * 0.7) {
      nextStory()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full h-[100dvh] p-0 overflow-hidden bg-black border-none rounded-none sm:rounded-2xl sm:h-[90vh]">
        
        {/* Progress Bars */}
        <div className="absolute top-2 left-0 right-0 z-50 flex gap-1 px-2">
          {stories.map((story, idx) => (
            <div key={story.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-75"
                style={{ 
                  width: `${idx < currentIndex ? 100 : idx === currentIndex ? progress : 0}%` 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header (Avatar & Time) */}
        <div className="absolute top-4 left-0 right-0 z-50 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 ring-1 ring-white/50">
              {currentStory.creatorAvatar ? (
                <img src={currentStory.creatorAvatar} alt="" className="object-cover" />
              ) : (
                <AvatarFallback className="bg-amber-500 text-xs">
                  {(currentStory.creatorName || 'B').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="text-white drop-shadow-md">
              <p className="font-semibold text-sm">{currentStory.creatorName}</p>
              <p className="text-xs text-white/80 flex items-center gap-1">
                <Clock size={10} /> {(() => {
                const secs = Math.floor((Date.now() - currentStory.createdAt) / 1000)
                if (secs < 60) return 'zojuist'
                if (secs < 3600) return `${Math.floor(secs / 60)}m geleden`
                if (secs < 86400) return `${Math.floor(secs / 3600)}u geleden`
                return `${Math.floor(secs / 86400)}d geleden`
              })()}
              </p>
            </div>
          </div>
          <button 
            onClick={() => onOpenChange(false)}
            className="p-2 text-white/80 hover:text-white transition-colors drop-shadow-md z-50"
          >
            <X size={24} weight="bold" />
          </button>
        </div>

        {/* Media Container */}
        <div 
          className="relative w-full h-full flex items-center justify-center bg-zinc-950 select-none"
          onMouseDown={handlePointerDown}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchEnd={handlePointerUp}
        >
          {currentStory.photoUrl ? (
            <img 
              src={currentStory.photoUrl} 
              alt="Story" 
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-500/20 to-orange-600/40 flex items-center justify-center p-8 text-center">
              <p className="text-2xl text-white font-medium drop-shadow-lg">{currentStory.content}</p>
            </div>
          )}
          
          {/* Text Overlay if there's both photo and text */}
          {currentStory.photoUrl && currentStory.content && (
            <div className="absolute bottom-24 left-4 right-4 text-center">
              <span className="bg-black/60 text-white px-4 py-2 rounded-xl backdrop-blur-md inline-block max-w-full break-words">
                {currentStory.content}
              </span>
            </div>
          )}
        </div>

        {/* Reaction Footer */}
        {onReaction && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-50 flex justify-center gap-4">
            <button 
              onClick={(e) => { e.stopPropagation(); onReaction(currentStory.id, 'heart') }}
              className={`p-3 rounded-full backdrop-blur-md transition-transform hover:scale-110 ${currentStory.userReaction === 'heart' ? 'bg-rose-500 text-white' : 'bg-white/10 text-white/90 hover:bg-white/20'}`}
            >
              <Heart size={24} weight={currentStory.userReaction === 'heart' ? 'fill' : 'regular'} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onReaction(currentStory.id, 'celebrate') }}
              className={`p-3 rounded-full backdrop-blur-md transition-transform hover:scale-110 ${currentStory.userReaction === 'celebrate' ? 'bg-amber-500 text-white' : 'bg-white/10 text-white/90 hover:bg-white/20'}`}
            >
              <HandsClapping size={24} weight={currentStory.userReaction === 'celebrate' ? 'fill' : 'regular'} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onReaction(currentStory.id, 'home') }}
              className={`p-3 rounded-full backdrop-blur-md transition-transform hover:scale-110 ${currentStory.userReaction === 'home' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/90 hover:bg-white/20'}`}
            >
              <House size={24} weight={currentStory.userReaction === 'home' ? 'fill' : 'regular'} />
            </button>
          </div>
        )}

      </DialogContent>
    </Dialog>
  )
}
