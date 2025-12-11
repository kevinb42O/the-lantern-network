import { useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useIsMobile'

interface FireflyBackgroundProps {
  variant: 'campfire' | 'flares' | 'messages' | 'wallet'
  particleCount?: number
  className?: string
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  hue: number
  life: number
  maxLife: number
}

export function FireflyBackground({ 
  variant, 
  particleCount = 22, 
  className 
}: FireflyBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number | null>(null)
  const prefersReducedMotion = useRef(false)
  const isMobile = useIsMobile()

  // Adjust particle count for mobile
  const effectiveParticleCount = isMobile ? Math.max(5, Math.floor(particleCount * 0.4)) : particleCount

  // Get hue range based on variant
  const getHue = useCallback(() => {
    switch (variant) {
      case 'campfire':
        // Warm orange/amber hues (25-45)
        return 25 + Math.random() * 20
      case 'wallet':
        // Golden/amber hues (35-55)
        return 35 + Math.random() * 20
      case 'messages':
        // Soft amber hues (40-50)
        return 40 + Math.random() * 10
      case 'flares':
      default:
        // Mix of orange (30-45) and emerald (140-160) for flares
        return Math.random() > 0.5 
          ? 30 + Math.random() * 15 // Orange
          : 140 + Math.random() * 20 // Emerald
    }
  }, [variant])

  const createParticle = useCallback((canvas: HTMLCanvasElement): Particle => {
    return {
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * 50,
      vx: (Math.random() - 0.5) * 0.3, // Gentle horizontal drift
      vy: -0.3 - Math.random() * 0.4, // Slow upward movement
      size: 2 + Math.random() * 3,
      opacity: 0,
      hue: getHue(),
      life: 0,
      maxLife: 200 + Math.random() * 200
    }
  }, [getHue])

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
    
    // Throttled resize handler for better performance
    let resizeTimeout: ReturnType<typeof setTimeout> | undefined
    const handleResize = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout)
      }
      resizeTimeout = setTimeout(resizeCanvas, 100)
    }
    
    window.addEventListener('resize', handleResize)

    // Initialize particles
    particlesRef.current = Array.from({ length: effectiveParticleCount }, () => 
      createParticle(canvas)
    )

    // Draw static particles once for reduced motion
    const drawStaticParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particlesRef.current.forEach(particle => {
        // Position particles statically across the canvas
        particle.y = Math.random() * canvas.height
        ctx.beginPath()
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 2
        )
        gradient.addColorStop(0, `hsla(${particle.hue}, 80%, 60%, 0.3)`)
        gradient.addColorStop(1, `hsla(${particle.hue}, 80%, 60%, 0)`)
        ctx.fillStyle = gradient
        ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // Animation loop
    const animate = () => {
      if (prefersReducedMotion.current) {
        // Draw static particles only once, then stop
        drawStaticParticles()
        return
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particlesRef.current.forEach((particle, index) => {
        // Update particle
        particle.life++
        particle.x += particle.vx
        particle.y += particle.vy

        // Add slight sine wave for more organic movement
        particle.x += Math.sin(particle.life * 0.02) * 0.2

        // Calculate opacity based on life (fade in and out)
        const lifeRatio = particle.life / particle.maxLife
        if (lifeRatio < 0.1) {
          particle.opacity = lifeRatio * 10 * 0.6 // Fade in
        } else if (lifeRatio > 0.8) {
          particle.opacity = (1 - lifeRatio) * 5 * 0.6 // Fade out
        } else {
          particle.opacity = 0.6
        }

        // Draw particle with glow effect
        ctx.beginPath()
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 3
        )
        gradient.addColorStop(0, `hsla(${particle.hue}, 80%, 60%, ${particle.opacity})`)
        gradient.addColorStop(0.4, `hsla(${particle.hue}, 70%, 50%, ${particle.opacity * 0.5})`)
        gradient.addColorStop(1, `hsla(${particle.hue}, 60%, 40%, 0)`)
        ctx.fillStyle = gradient
        ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2)
        ctx.fill()

        // Reset particle if it's dead or off screen
        if (particle.life >= particle.maxLife || 
            particle.y < -50 || 
            particle.x < -50 || 
            particle.x > canvas.width + 50) {
          particlesRef.current[index] = createParticle(canvas)
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
  }, [variant, effectiveParticleCount, createParticle])

  return (
    <canvas
      ref={canvasRef}
      className={cn('fixed inset-0 pointer-events-none', className)}
      style={{ 
        opacity: variant === 'messages' ? 0.35 : variant === 'wallet' ? 0.45 : 0.55,
        willChange: 'transform'
      }}
    />
  )
}
