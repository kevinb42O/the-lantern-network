import { Lamp } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface LanternBalanceProps {
  balance: number
  max?: number
  className?: string
  onClick?: () => void
  compact?: boolean
}

export function LanternBalance({ 
  balance, 
  max = 10, 
  className,
  onClick,
  compact = false
}: LanternBalanceProps) {
  const percentage = (balance / max) * 100
  const isAtLimit = balance >= max
  const isLow = balance <= 2

  // Generate lantern icons for visual display
  const lanterns = Array.from({ length: max }, (_, i) => i < balance)

  if (compact) {
    return (
      <div 
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl bg-card/50 border border-border/50",
          onClick && "cursor-pointer hover:border-primary/50 transition-all hover:bg-card",
          className
        )}
        onClick={onClick}
      >
        <Lamp 
          className={cn(
            "text-primary",
            isAtLimit && "lantern-glow"
          )} 
          size={20} 
          weight="duotone"
        />
        <span className="text-lg font-bold text-foreground">{balance}</span>
        <span className="text-xs text-muted-foreground">🏮</span>
      </div>
    )
  }

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-card/80 border border-border p-5",
        onClick && "cursor-pointer transition-all duration-300 hover:border-primary/40",
        isAtLimit && "warm-glow",
        className
      )}
      onClick={onClick}
    >
      {/* Decorative background glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-accent/5 blur-xl" />
      
      <div className="relative">
        {/* Header with icon and balance */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-xl bg-primary/15",
              isAtLimit && "glow-ring"
            )}>
              <Lamp 
                className={cn(
                  "text-primary",
                  isAtLimit && "lantern-glow"
                )} 
                size={28} 
                weight="duotone"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                Je Lichtpuntjes
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">
                  {balance}
                </span>
                <span className="text-sm text-muted-foreground">/ {max}</span>
              </div>
            </div>
          </div>
          {isAtLimit && (
            <span className="text-xs font-semibold text-accent px-3 py-1.5 rounded-full bg-accent/15 border border-accent/20">
              ✨ Vol
            </span>
          )}
          {isLow && !isAtLimit && (
            <span className="text-xs font-medium text-amber-400 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              Laag
            </span>
          )}
        </div>

        {/* Visual lantern display */}
        <div className="flex gap-1.5 mb-4">
          {lanterns.map((filled, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 h-3 rounded-full transition-all duration-300",
                filled 
                  ? "bg-gradient-to-r from-primary/90 to-accent/80" 
                  : "bg-muted/50"
              )}
              style={{
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>

        {/* Progress bar with gradient */}
        <div className="h-2 rounded-full bg-muted/30 overflow-hidden mb-3">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              isAtLimit 
                ? "bg-gradient-to-r from-accent via-primary to-accent shimmer" 
                : "bg-gradient-to-r from-primary/80 to-primary"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        {/* Helper text */}
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          {isAtLimit ? (
            <>
              <span className="text-accent">✦</span>
              <span>Je hebt je maximum bereikt — deel het licht met je buren!</span>
            </>
          ) : isLow ? (
            <>
              <span className="text-amber-400">💡</span>
              <span>Help een buur om meer lichtpuntjes te verdienen</span>
            </>
          ) : (
            <>
              <span className="text-primary/70">🏮</span>
              <span>Nog {max - balance} tot je maximum</span>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
