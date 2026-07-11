import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useIsMobile'

interface CampfireEffectsProps {
  className?: string
}

interface Ember {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  life: number
  maxLife: number
}

export function CampfireEffects({ className }: CampfireEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const embersRef = useRef<Ember[]>([])
  const animationRef = useRef<number | null>(null)
  const prefersReducedMotion = useRef(false)
  const isMobile = useIsMobile()
  const flickerPhase = useRef(0)

  // Reduce ember count on mobile
  const emberCount = isMobile ? 8 : 15

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.current = mediaQuery.matches

    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion.current = e.matches
    }
    mediaQuery.addEventListener('change', handleMotionChange)

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Handle resize with viewport-based sizing
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    
    // Throttled resize handler
    let resizeTimeout: ReturnType<typeof setTimeout> | undefined
    const handleResize = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout)
      }
      resizeTimeout = setTimeout(resizeCanvas, 100)
    }
    
    window.addEventListener('resize', handleResize)

    // Create ember particle
    const createEmber = (): Ember => {
      return {
        x: window.innerWidth * (0.3 + Math.random() * 0.4), // Center-ish horizontal
        y: window.innerHeight + Math.random() * 100, // Start from bottom
        vx: (Math.random() - 0.5) * 0.5, // Gentle horizontal drift
        vy: -0.8 - Math.random() * 1.2, // Upward movement
        size: 2 + Math.random() * 4,
        opacity: 0,
        life: 0,
        maxLife: 150 + Math.random() * 150
      }
    }

    // Initialize embers
    embersRef.current = Array.from({ length: emberCount }, createEmber)

    // Animation loop
    const animate = () => {
      if (prefersReducedMotion.current) {
        // Draw static fire glow only
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        // Static warm glow at bottom
        const gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height,
          0,
          canvas.width / 2, canvas.height,
          canvas.height * 0.4
        )
        gradient.addColorStop(0, 'rgba(251, 146, 60, 0.15)')
        gradient.addColorStop(0.3, 'rgba(251, 191, 36, 0.08)')
        gradient.addColorStop(1, 'rgba(251, 191, 36, 0)')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        return
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Flickering fire glow at bottom
      flickerPhase.current += 0.05
      const flicker = 0.7 + Math.sin(flickerPhase.current) * 0.15 + Math.sin(flickerPhase.current * 2.3) * 0.1
      
      // Main fire glow
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height,
        0,
        canvas.width / 2, canvas.height,
        canvas.height * 0.5
      )
      gradient.addColorStop(0, `rgba(251, 146, 60, ${0.2 * flicker})`)
      gradient.addColorStop(0.3, `rgba(251, 191, 36, ${0.12 * flicker})`)
      gradient.addColorStop(0.6, `rgba(245, 158, 11, ${0.06 * flicker})`)
      gradient.addColorStop(1, 'rgba(251, 191, 36, 0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw rising embers
      embersRef.current.forEach((ember, index) => {
        // Update ember
        ember.life++
        ember.x += ember.vx
        ember.y += ember.vy
        
        // Add wind/turbulence
        ember.x += Math.sin(ember.life * 0.03) * 0.3
        ember.vx += (Math.random() - 0.5) * 0.05

        // Calculate opacity based on life
        const lifeRatio = ember.life / ember.maxLife
        if (lifeRatio < 0.1) {
          ember.opacity = lifeRatio * 10 // Fade in
        } else if (lifeRatio > 0.7) {
          ember.opacity = (1 - lifeRatio) * 3.33 // Fade out
        } else {
          ember.opacity = 1
        }

        // Draw ember with glow
        ctx.beginPath()
        const emberGradient = ctx.createRadialGradient(
          ember.x, ember.y, 0,
          ember.x, ember.y, ember.size * 3
        )
        emberGradient.addColorStop(0, `rgba(255, 220, 100, ${ember.opacity * 0.9})`)
        emberGradient.addColorStop(0.3, `rgba(251, 146, 60, ${ember.opacity * 0.6})`)
        emberGradient.addColorStop(1, `rgba(251, 146, 60, 0)`)
        ctx.fillStyle = emberGradient
        ctx.arc(ember.x, ember.y, ember.size * 3, 0, Math.PI * 2)
        ctx.fill()

        // Draw brighter core
        ctx.beginPath()
        ctx.fillStyle = `rgba(255, 240, 180, ${ember.opacity * 0.8})`
        ctx.arc(ember.x, ember.y, ember.size * 0.6, 0, Math.PI * 2)
        ctx.fill()

        // Reset ember if dead or off screen
        if (ember.life >= ember.maxLife || 
            ember.y < -50 || 
            ember.x < -50 || 
            ember.x > canvas.width + 50) {
          embersRef.current[index] = createEmber()
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (resizeTimeout) {
        clearTimeout(resizeTimeout)
      }
      window.removeEventListener('resize', handleResize)
      mediaQuery.removeEventListener('change', handleMotionChange)
    }
  }, [emberCount])

  return (
    <canvas
      ref={canvasRef}
      className={cn('fixed inset-0 pointer-events-none z-0', className)}
      style={{ 
        opacity: 0.6,
        mixBlendMode: 'screen',
        willChange: 'transform'
      }}
    />
  )
}
