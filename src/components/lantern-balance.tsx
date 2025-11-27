import { Coins } from '@phosphor-icons/react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface LanternBalanceProps {
  balance: number
  max?: number
  className?: string
  onClick?: () => void
}

export function LanternBalance({ 
  balance, 
  max = 10, 
  className,
  onClick 
}: LanternBalanceProps) {
  const percentage = (balance / max) * 100
  const isAtLimit = balance >= max

  return (
    <div 
      className={cn(
        "flex flex-col gap-2 p-3 rounded-lg bg-card border border-border",
        onClick && "cursor-pointer hover:border-primary/50 transition-colors",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins 
            className={cn(
              "text-primary",
              isAtLimit ? "lantern-glow" : ""
            )} 
            size={20} 
            weight="duotone"
          />
          <span className="text-xl font-semibold text-foreground">
            {balance}
          </span>
          <span className="text-xs text-muted-foreground">/ {max}</span>
        </div>
        {isAtLimit && (
          <span className="text-xs font-medium text-accent px-2 py-0.5 rounded-full bg-accent/10">
            At Limit
          </span>
        )}
      </div>
      
      <Progress 
        value={percentage} 
        className="h-1.5"
      />
      
      <p className="text-xs text-muted-foreground">
        {isAtLimit 
          ? "At hoard limit - help or gift!" 
          : `${max - balance} until hoard limit`
        }
      </p>
    </div>
  )
}
