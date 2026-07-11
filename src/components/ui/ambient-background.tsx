import { cn } from '@/lib/utils'
import { FireflyBackground } from './firefly-background'

interface AmbientBackgroundProps {
  variant: 'campfire' | 'flares' | 'messages' | 'wallet'
  className?: string
}

export function AmbientBackground({ variant, className }: AmbientBackgroundProps) {
  // Get particle count based on variant
  const getParticleCount = () => {
    switch (variant) {
      case 'messages':
        return 10 // Minimal for messages
      case 'wallet':
        return 15 // Moderate for wallet
      case 'campfire':
        return 25 // More for campfire
      case 'flares':
        return 22 // Default for flares
      default:
        return 22
    }
  }

  // Get ambient class based on variant
  const getAmbientClass = () => {
    switch (variant) {
      case 'campfire':
        return 'campfire-ambient'
      case 'messages':
        return 'messages-ambient'
      case 'wallet':
        return 'wallet-ambient'
      case 'flares':
      default:
        return 'flares-ambient'
    }
  }

  return (
    <div 
      className={cn(
        'fixed inset-0 overflow-hidden pointer-events-none z-0',
        getAmbientClass(),
        className
      )}
    >
      {/* Firefly canvas layer */}
      <FireflyBackground variant={variant} particleCount={getParticleCount()} />
      
      {/* Ambient floating orbs */}
      {variant === 'campfire' && (
        <>
          <div 
            className="ambient-orb ambient-orb-orange w-64 h-64 top-1/4 -left-32"
            style={{ animationDelay: '0s' }}
          />
          <div 
            className="ambient-orb ambient-orb-amber w-48 h-48 bottom-1/3 -right-24"
            style={{ animationDelay: '-7s' }}
          />
          <div 
            className="ambient-orb ambient-orb-orange w-40 h-40 top-2/3 right-1/4"
            style={{ animationDelay: '-10s' }}
          />
        </>
      )}
      
      {variant === 'flares' && (
        <>
          <div 
            className="ambient-orb ambient-orb-orange w-64 h-64 top-1/4 -left-32"
            style={{ animationDelay: '0s' }}
          />
          <div 
            className="ambient-orb ambient-orb-amber w-48 h-48 bottom-1/3 -right-24"
            style={{ animationDelay: '-7s' }}
          />
          <div 
            className="ambient-orb ambient-orb-emerald w-56 h-56 top-1/2 left-1/4"
            style={{ animationDelay: '-14s' }}
          />
        </>
      )}
      
      {variant === 'messages' && (
        <>
          <div 
            className="ambient-orb ambient-orb-amber w-40 h-40 top-1/3 -left-20"
            style={{ animationDelay: '0s' }}
          />
          <div 
            className="ambient-orb ambient-orb-amber w-36 h-36 bottom-1/4 -right-18"
            style={{ animationDelay: '-5s' }}
          />
        </>
      )}
      
      {variant === 'wallet' && (
        <>
          <div 
            className="ambient-orb ambient-orb-amber w-56 h-56 top-1/4 -left-28"
            style={{ animationDelay: '0s' }}
          />
          <div 
            className="ambient-orb ambient-orb-orange w-44 h-44 bottom-1/3 -right-22"
            style={{ animationDelay: '-8s' }}
          />
          <div 
            className="ambient-orb ambient-orb-amber w-40 h-40 top-2/3 right-1/3"
            style={{ animationDelay: '-15s' }}
          />
        </>
      )}
    </div>
  )
}
