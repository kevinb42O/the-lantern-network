import { useState } from 'react'
import { ArrowUp, ArrowDown, Coins } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
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
    return date.toLocaleDateString()
  }

  const groupedTransactions = sortedTransactions.reduce((groups, tx) => {
    const date = formatDate(tx.timestamp)
    if (!groups[date]) groups[date] = []
    groups[date].push(tx)
    return groups
  }, {} as Record<string, LanternTransaction[]>)

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="p-4 border-b border-border">
        <h1 className="text-2xl font-semibold text-foreground mb-4">
          Lantern Wallet
        </h1>
        <LanternBalance balance={user.lanternBalance} />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="mb-4">
            <h2 className="text-lg font-medium text-foreground mb-3">
              Transaction History
            </h2>
            {transactions.length === 0 ? (
              <Card className="p-8 text-center">
                <Coins size={48} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  No transactions yet
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Help neighbors to earn Lanterns
                </p>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedTransactions).map(([date, txs]) => (
                  <div key={date}>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      {date}
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
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`
          p-2 rounded-full
          ${isReceived 
            ? 'bg-success/10 text-success' 
            : 'bg-destructive/10 text-destructive'
          }
        `}>
          {isReceived ? (
            <ArrowDown size={20} weight="bold" />
          ) : (
            <ArrowUp size={20} weight="bold" />
          )}
        </div>
        
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            {isReceived ? 'Received' : 'Sent'} {transaction.amount} Lantern{transaction.amount !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-muted-foreground">
            {transaction.reason}
          </p>
          {!isSystem && (
            <p className="text-xs text-muted-foreground mt-1">
              {isReceived ? `From ${transaction.from}` : `To ${transaction.to}`}
            </p>
          )}
        </div>
        
        <div className={`
          text-lg font-semibold
          ${isReceived ? 'text-success' : 'text-destructive'}
        `}>
          {isReceived ? '+' : '-'}{transaction.amount}
        </div>
      </div>
    </Card>
  )
}
