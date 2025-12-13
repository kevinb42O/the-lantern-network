import { useState, useEffect } from 'react'
import { 
  Heart, 
  Coffee, 
  Flame, 
  Sparkle, 
  Lighthouse,
  ArrowLeft,
  ArrowSquareOut,
  HandHeart,
  Users,
  Star
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SupporterBadge } from '@/components/ui/supporter-badge'
import { SUPPORTER_BADGES } from '@/lib/economy'
import { supabase } from '@/lib/supabase'
import type { SupporterBadgeTier } from '@/lib/types'
import { lanternCopy } from '@/copy/nl-BE'

interface SupportPageProps {
  onBack: () => void
}

interface Supporter {
  user_id: string
  display_name: string
  avatar_url: string | null
  badge_type: SupporterBadgeTier
  granted_at: string
}

const DONATION_TIERS = [
  {
    amount: 3,
    name: lanternCopy.support.donationTiers.coffee.name,
    icon: Coffee,
    badge: 'supporter' as SupporterBadgeTier,
    description: lanternCopy.support.donationTiers.coffee.description
  },
  {
    amount: 5,
    name: lanternCopy.support.donationTiers.flame.name,
    icon: Flame,
    badge: 'flame_keeper' as SupporterBadgeTier,
    description: lanternCopy.support.donationTiers.flame.description
  },
  {
    amount: 15,
    name: lanternCopy.support.donationTiers.beacon.name,
    icon: Sparkle,
    badge: 'beacon' as SupporterBadgeTier,
    description: lanternCopy.support.donationTiers.beacon.description
  },
  {
    amount: 50,
    name: lanternCopy.support.donationTiers.lighthouse.name,
    icon: Lighthouse,
    badge: 'lighthouse' as SupporterBadgeTier,
    description: lanternCopy.support.donationTiers.lighthouse.description
  }
]

export function SupportPage({ onBack }: SupportPageProps) {
  const [supporters, setSupporters] = useState<Supporter[]>([])
  const [stats, setStats] = useState({ totalSupporters: 0, totalConnections: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSupporters()
    fetchStats()
  }, [])

  const fetchSupporters = async () => {
    try {
      // First get supporter badges
      const { data: badgesData, error: badgesError } = await supabase
        .from('supporter_badges')
        .select('user_id, badge_type, granted_at')
        .order('granted_at', { ascending: false })
        .limit(20)

      if (badgesError || !badgesData) {
        console.error('Error fetching supporters:', badgesError)
        return
      }

      if (badgesData.length === 0) {
        setSupporters([])
        return
      }

      // Get user profiles
      const userIds = badgesData.map(b => b.user_id)
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds)

      const profileMap: Record<string, { display_name: string; avatar_url: string | null }> = {}
      profilesData?.forEach(p => {
        profileMap[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url }
      })

      const formattedSupporters: Supporter[] = badgesData.map((s) => ({
        user_id: s.user_id,
        display_name: profileMap[s.user_id]?.display_name || 'Onbekende buur',
        avatar_url: profileMap[s.user_id]?.avatar_url || null,
        badge_type: s.badge_type as SupporterBadgeTier,
        granted_at: s.granted_at
      }))

      setSupporters(formattedSupporters)
    } catch (err) {
      console.error('Supporters fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Count total unique supporters
      const { count: supporterCount } = await supabase
        .from('supporter_badges')
        .select('*', { count: 'exact', head: true })

      // Count total connections made (completed flares)
      const { count: connectionCount } = await supabase
        .from('flare_participants')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')

      setStats({
        totalSupporters: supporterCount || 0,
        totalConnections: connectionCount || 0
      })
    } catch (err) {
      console.error('Stats fetch error:', err)
    }
  }

  const handleDonateClick = (platform: 'kofi' | 'paypal') => {
    // These URLs would be configured for the actual project
    const urls = {
      kofi: 'https://ko-fi.com/thelanternnetwork',
      paypal: 'https://paypal.me/thelanternnetwork'
    }
    window.open(urls[platform], '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-5 border-b border-border bg-gradient-to-b from-emerald-950/20 via-card/80 to-transparent">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="rounded-xl"
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Heart size={24} weight="duotone" className="text-rose-400" />
                {lanternCopy.support.pageTitle}
              </h1>
              <p className="text-sm text-muted-foreground">
                {lanternCopy.support.pageSubtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-5 max-w-lg mx-auto space-y-6">
          {/* Hero Section */}
          <Card className="p-6 bg-gradient-to-br from-emerald-500/10 via-card to-amber-500/5 border-emerald-500/20 overflow-hidden relative">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
            
            <div className="relative">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-amber-500/10 border border-emerald-500/20">
                  <HandHeart size={32} weight="duotone" className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {lanternCopy.support.heroTitle}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {lanternCopy.support.heroSubtitle}
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                {lanternCopy.support.heroBody}
              </p>

              {/* Impact Stats */}
              {stats.totalConnections > 0 && (
                <div className="flex items-center gap-4 p-3 rounded-xl bg-background/50 border border-border/50">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-emerald-400" />
                    <span className="text-sm">
                      <span className="font-bold text-foreground">{stats.totalConnections}</span>
                      <span className="text-muted-foreground"> {lanternCopy.support.impactConnections}</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Donation Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Star size={16} className="text-amber-400" />
              {lanternCopy.support.chooseLevelTitle}
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {DONATION_TIERS.map((tier) => {
                const Icon = tier.icon
                const badgeInfo = SUPPORTER_BADGES.find(b => b.id === tier.badge)
                
                return (
                  <Card
                    key={tier.name}
                    className={`p-4 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${badgeInfo?.bgColor} border ${badgeInfo?.borderColor}`}
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className={`p-2.5 rounded-xl ${badgeInfo?.bgColor} border ${badgeInfo?.borderColor}`}>
                        <Icon size={24} weight="duotone" className={badgeInfo?.color} />
                      </div>
                      <div>
                        <p className={`font-bold text-lg ${badgeInfo?.color}`}>${tier.amount}</p>
                        <p className="text-xs text-muted-foreground">{tier.name}</p>
                      </div>
                      <SupporterBadge badgeType={tier.badge} size="sm" />
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Donation Buttons */}
          <div className="space-y-3">
            <Button
              className="w-full gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 h-12 text-base font-semibold"
              onClick={() => handleDonateClick('kofi')}
            >
              <Coffee size={20} weight="fill" />
              {lanternCopy.support.buttonKofi}
              <ArrowSquareOut size={16} className="ml-auto opacity-60" />
            </Button>
            
            <Button
              variant="outline"
              className="w-full gap-2 rounded-xl border-border h-11"
              onClick={() => handleDonateClick('paypal')}
            >
              {lanternCopy.support.buttonPaypal}
              <ArrowSquareOut size={16} className="ml-auto opacity-60" />
            </Button>
          </div>

          {/* Badge Preview */}
          <Card className="p-4 bg-card/80 border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkle size={16} className="text-amber-400" />
              {lanternCopy.support.badgesTitle}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {lanternCopy.support.badgesSubtitle}
            </p>
            <div className="flex flex-wrap gap-2">
              {SUPPORTER_BADGES.map((badge) => (
                <div
                  key={badge.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${badge.bgColor} ${badge.color} border ${badge.borderColor}`}
                  title={badge.description}
                >
                  <span>{badge.emoji}</span>
                  <span>{badge.name}</span>
                  <span className="text-[10px] opacity-60">${DONATION_TIERS.find(t => t.badge === badge.id)?.amount}+</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Supporters Wall */}
          {supporters.length > 0 && (
            <Card className="p-4 bg-card/80 border-border/50">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Heart size={16} className="text-rose-400" />
                {lanternCopy.support.supportersTitle}
              </h3>
              <div className="flex flex-wrap gap-2">
                {supporters.map((supporter) => (
                  <div
                    key={supporter.user_id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-full bg-muted/30 border border-border/50"
                    title={`${supporter.display_name} - Supporter since ${new Date(supporter.granted_at).toLocaleDateString()}`}
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={supporter.avatar_url || undefined} />
                      <AvatarFallback className="text-[10px] bg-gradient-to-br from-primary/30 to-accent/20">
                        {supporter.display_name.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-foreground">{supporter.display_name}</span>
                    <SupporterBadge badgeType={supporter.badge_type} size="sm" />
                  </div>
                ))}
              </div>
              {stats.totalSupporters > supporters.length && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  {lanternCopy.support.supportersMore.replace('{count}', String(stats.totalSupporters - supporters.length))}
                </p>
              )}
            </Card>
          )}

          {/* Empty state when no supporters yet */}
          {!loading && supporters.length === 0 && (
            <Card className="p-6 text-center bg-muted/20 border-dashed">
              <Heart size={32} className="mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                {lanternCopy.support.emptyStateText}
              </p>
            </Card>
          )}

          {/* Bottom spacing for nav */}
          <div className="h-4" />
        </div>
      </ScrollArea>
    </div>
  )
}
