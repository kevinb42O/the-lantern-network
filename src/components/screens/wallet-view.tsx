import { ArrowUp, ArrowDown, Lamp, Sparkle, HandCoins } from '@phosphor-icons/react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { LanternBalance } from '@/components/lantern-balance'
import type { User, LanternTransaction } from '@/lib/types'

interface WalletViewProps {
  user: User
  transactions: LanternTransaction[]
}

export function WalletView({ user, transactions }: WalletViewProps) {
  const sortedTransactions = [...transactions].sort((a, b) => b.timestamp - a.timestamp)

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const groupedTransactions = sortedTransactions.reduce((groups, tx) => {
    const date = formatDate(tx.timestamp)
    if (!groups[date]) groups[date] = []
    groups[date].push(tx)
    return groups
  }, {} as Record<string, LanternTransaction[]>)

  // Calculate stats
  const totalReceived = transactions.filter(tx => tx.to === user.id || tx.to === 'current-user').reduce((sum, tx) => sum + tx.amount, 0)
  const totalSent = transactions.filter(tx => tx.from === user.id && tx.from !== 'system').reduce((sum, tx) => sum + tx.amount, 0)

  return (
    <div className="flex flex-col h-full bg-background">
<<<<<<< Updated upstream
      {/* Header with Balance */}
      <div className="p-5 border-b border-border bg-gradient-to-b from-card/80 to-transparent">
        <div className="max-w-lg mx-auto space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/15">
              <Lamp size={24} weight="duotone" className="text-primary lantern-glow" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Lantern Wallet</h1>
              <p className="text-sm text-muted-foreground">Your community currency</p>
            </div>
          </div>
          
          <LanternBalance balance={user.lanternBalance} />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-success/10 border border-success/20">
              <div className="flex items-center gap-2 mb-1">
                <ArrowDown size={16} className="text-success" />
                <span className="text-xs font-medium text-success uppercase tracking-wide">Received</span>
              </div>
              <p className="text-2xl font-bold text-success">{totalReceived}</p>
            </div>
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUp size={16} className="text-primary" />
                <span className="text-xs font-medium text-primary uppercase tracking-wide">Given</span>
              </div>
              <p className="text-2xl font-bold text-primary">{totalSent}</p>
            </div>
          </div>
        </div>
=======
      <div className="p-4 border-b border-border">
        <h1 className="text-2xl font-semibold text-foreground mb-4">
          Lantern Wallet
        </h1>
        <LanternBalance balance={user.lanternBalance} />
>>>>>>> Stashed changes
      </div>

      {/* Transactions */}
      <ScrollArea className="flex-1">
        <div className="p-5 max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              Transaction History
            </h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
              {transactions.length} total
            </span>
          </div>
          
          {transactions.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 mb-6">
                <HandCoins size={48} weight="duotone" className="text-primary bounce-subtle" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No transactions yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Help a neighbor to earn your first Lantern, or receive one as a welcome gift!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTransactions).map(([date, txs], groupIndex) => (
                <div key={date} className="fade-in-up" style={{ animationDelay: `${groupIndex * 0.1}s` }}>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
                    <span className="w-8 h-px bg-border" />
                    {date}
                    <span className="flex-1 h-px bg-border" />
                  </h3>
                  <div className="space-y-2">
                    {txs.map((tx) => (
                      <TransactionItem
                        key={tx.id}
                        transaction={tx}
                        currentUserId={user.id}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

interface TransactionItemProps {
  transaction: LanternTransaction
  currentUserId: string
}

function TransactionItem({ transaction, currentUserId }: TransactionItemProps) {
  const isReceived = transaction.to === currentUserId || transaction.to === 'current-user'
  const isSystem = transaction.from === 'system'

  return (
    <Card className="p-4 card-hover border-border/50 bg-card/80">
      <div className="flex items-center gap-4">
        <div className={`
          p-3 rounded-xl transition-all
          ${isReceived 
            ? 'bg-success/15 text-success' 
            : 'bg-primary/15 text-primary'
          }
        `}>
          {isReceived ? (
            <ArrowDown size={22} weight="bold" />
          ) : (
            <ArrowUp size={22} weight="bold" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground flex items-center gap-2">
            {isReceived ? 'Received' : 'Sent'} {transaction.amount} 🏮
            {isSystem && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                <Sparkle size={10} weight="fill" />
                Gift
              </span>
            )}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {transaction.reason}
          </p>
          {!isSystem && (
            <p className="text-xs text-muted-foreground/70 mt-1">
              {isReceived ? `From ${transaction.from}` : `To ${transaction.to}`}
            </p>
          )}
        </div>
        
        <div className={`
          text-xl font-bold tabular-nums
          ${isReceived ? 'text-success' : 'text-primary'}
        `}>
          {isReceived ? '+' : '-'}{transaction.amount}
        </div>
      </div>
    </Card>
  )
}
