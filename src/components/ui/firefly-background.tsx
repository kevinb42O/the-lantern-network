import { useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface FireflyBackgroundProps {
  variant: 'campfire' | 'flares'
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

  // Get hue range based on variant
  const getHue = useCallback(() => {
    if (variant === 'campfire') {
      // Warm orange/amber hues (25-45)
      return 25 + Math.random() * 20
    } else {
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

    // Handle resize
    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
      }
    }

    resizeCanvas()
    const resizeObserver = new ResizeObserver(resizeCanvas)
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement)
    }

    // Initialize particles
    particlesRef.current = Array.from({ length: particleCount }, () => 
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
      resizeObserver.disconnect()
      mediaQuery.removeEventListener('change', handleMotionChange)
    }
  }, [variant, particleCount, createParticle])

  return (
    <canvas
      ref={canvasRef}
      className={cn('absolute inset-0 pointer-events-none', className)}
      style={{ opacity: 0.55 }}
    />
  )
}
