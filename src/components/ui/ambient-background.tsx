import { cn } from '@/lib/utils'
import { FireflyBackground } from './firefly-background'

interface AmbientBackgroundProps {
  variant: 'campfire' | 'flares'
  className?: string
}

export function AmbientBackground({ variant, className }: AmbientBackgroundProps) {
  return (
    <div 
      className={cn(
        'absolute inset-0 overflow-hidden pointer-events-none',
        variant === 'campfire' ? 'campfire-ambient' : 'flares-ambient',
        className
      )}
    >
      {/* Firefly canvas layer */}
      <FireflyBackground variant={variant} particleCount={22} />
      
      {/* Ambient floating orbs */}
      <div 
        className="ambient-orb ambient-orb-orange w-64 h-64 top-1/4 -left-32"
        style={{ animationDelay: '0s' }}
      />
      <div 
        className="ambient-orb ambient-orb-amber w-48 h-48 bottom-1/3 -right-24"
        style={{ animationDelay: '-7s' }}
      />
      {variant === 'flares' && (
        <div 
          className="ambient-orb ambient-orb-emerald w-56 h-56 top-1/2 left-1/4"
          style={{ animationDelay: '-14s' }}
        />
      )}
      {variant === 'campfire' && (
        <div 
          className="ambient-orb ambient-orb-orange w-40 h-40 top-2/3 right-1/4"
          style={{ animationDelay: '-10s' }}
        />
      )}
    </div>
  )
}
