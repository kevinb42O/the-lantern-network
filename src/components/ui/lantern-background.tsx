import { cn } from '@/lib/utils'

interface LanternBackgroundProps {
  className?: string
  imagePath?: string
  opacity?: number
  blurAmount?: number
  overlayOpacity?: number
}

/**
 * Lantern Background Component
 * 
 * Displays a background image (typically the lantern mascot) with:
 * - Blur effect to hide lower resolution
 * - Dark overlay for text readability
 * - Proper scaling and positioning
 * - Reduced opacity for subtlety
 * - Layerable beneath other effects
 */
export function LanternBackground({ 
  className,
  imagePath = '/lantern-logo.png', // Using logo as placeholder until lantern-background.png is added
  opacity = 0.4,
  blurAmount = 3,
  overlayOpacity = 0.6
}: LanternBackgroundProps) {
  return (
    <div 
      className={cn(
        'absolute inset-0 overflow-hidden pointer-events-none',
        className
      )}
      style={{ zIndex: 0 }}
    >
      {/* Background image layer with blur */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('${imagePath}')`,
          filter: `blur(${blurAmount}px)`,
          transform: 'scale(1.1)', // Slightly scale up to avoid blur edge artifacts
          opacity: opacity,
        }}
      />
      
      {/* Dark gradient overlay for text readability */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-background/80"
        style={{ opacity: overlayOpacity }}
      />
    </div>
  )
}
