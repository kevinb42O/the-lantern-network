import { motion } from 'framer-motion'
import { 
  Heart, 
  UsersThree, 
  HandHeart, 
  Sparkle, 
  Scales, 
  ShieldCheck, 
  Fire,
  ArrowLeft,
  Lightbulb,
  Handshake,
  TreeStructure
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  HOARD_LIMIT, 
  INITIAL_LANTERNS, 
  ELDER_HELP_THRESHOLD, 
  ELDER_TRUST_THRESHOLD 
} from '@/lib/economy'

interface PhilosophyViewProps {
  onBack: () => void
}

export function PhilosophyView({ onBack }: PhilosophyViewProps) {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border/50 bg-gradient-to-b from-orange-950/20 to-transparent">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="rounded-xl shrink-0"
          >
            <ArrowLeft size={22} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Our Philosophy</h1>
            <p className="text-sm text-muted-foreground">Why we do what we do</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-5 max-w-2xl mx-auto space-y-8 pb-12">
          
          {/* Hero Section */}
          <motion.div 
            className="text-center py-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-amber-500/30 blur-2xl animate-pulse" />
              <div className="relative p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                <Fire size={48} weight="duotone" className="text-amber-400" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Neighbors, Not Strangers
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
              In a world of infinite scroll and distant connections, 
              we believe the people who can help you most are the ones 
              who live closest to you.
            </p>
          </motion.div>

          {/* The Why */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-border/50">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-xl bg-rose-500/15">
                  <Heart size={24} weight="duotone" className="text-rose-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Why We Built This</h3>
                  <p className="text-sm text-muted-foreground">The honest truth</p>
                </div>
              </div>
              <div className="space-y-4 text-foreground/90 leading-relaxed">
                <p>
                  We're tired of apps that promise community but deliver algorithms. 
                  Tired of platforms that turn every interaction into a transaction, 
                  every favor into a gig, every neighbor into a rating.
                </p>
                <p>
                  The Lantern Network exists because real community can't be 
                  bought—it has to be built. One small help at a time. 
                  A ride to the airport. A cup of sugar. Someone to talk to 
                  when you're locked out at 2am.
                </p>
                <p>
                  We're not here to disrupt anything. We're here to remember 
                  something we forgot: <span className="text-primary font-medium">that looking out for each other 
                  is how neighborhoods actually work.</span>
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Who It's For */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-border/50">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-xl bg-blue-500/15">
                  <UsersThree size={24} weight="duotone" className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Who This Is For</h3>
                  <p className="text-sm text-muted-foreground">Real people, real needs</p>
                </div>
              </div>
              <div className="space-y-4 text-foreground/90 leading-relaxed">
                <p>
                  <span className="text-primary font-medium">The new parent</span> who needs 
                  20 minutes of babysitting to take a shower. <span className="text-primary font-medium">The 
                  elderly neighbor</span> who just needs someone to reach the top shelf. 
                  <span className="text-primary font-medium"> The student</span> whose car won't 
                  start before an exam.
                </p>
                <p>
                  <span className="text-primary font-medium">The person who works from home</span> and 
                  hasn't had a real conversation in days. <span className="text-primary font-medium">The 
                  skilled mechanic</span> who'd rather help a neighbor than watch them get 
                  ripped off. <span className="text-primary font-medium">Anyone</span> who believes 
                  that asking for help isn't weakness—it's trust.
                </p>
                <p className="italic text-muted-foreground">
                  If you've ever thought "I wish I knew someone who could help with this," 
                  this is for you.
                </p>
              </div>
            </Card>
          </motion.div>

          {/* The Rules Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/15">
                <Lightbulb size={20} weight="duotone" className="text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">How It Works</h3>
            </div>
            <p className="text-muted-foreground mb-5 leading-relaxed">
              We designed simple rules that encourage genuine help and discourage hoarding, 
              exploitation, and the usual platform nonsense.
            </p>

            <div className="space-y-4">
              {/* Lanterns */}
              <Card className="p-5 bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-amber-500/20">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-amber-500/20">
                    <Sparkle size={22} weight="duotone" className="text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-2">🏮 Lanterns — Our Currency of Trust</h4>
                    <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                      Lanterns aren't money. You can't buy them. You can't cash them out. 
                      They're a way to say "thank you" that actually means something.
                    </p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• Start with <span className="text-primary font-medium">{INITIAL_LANTERNS} Lanterns</span> when you join</p>
                      <p>• Maximum of <span className="text-primary font-medium">{HOARD_LIMIT} Lanterns</span> at any time (no hoarding)</p>
                      <p>• Give 1 Lantern when someone helps you</p>
                      <p>• <span className="italic">The cap keeps things flowing. Help more, give more, receive more.</span></p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Flares */}
              <Card className="p-5 bg-gradient-to-r from-rose-500/10 to-pink-500/5 border-rose-500/20">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-rose-500/20">
                    <Fire size={22} weight="duotone" className="text-rose-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-2">🔥 Flares — When You Need Help</h4>
                    <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                      A Flare is a signal to your neighbors. Not a job posting. 
                      Not a marketplace listing. Just an honest ask.
                    </p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• <span className="text-primary font-medium">Mechanical</span> — Car trouble, fixing things, moving stuff</p>
                      <p>• <span className="text-primary font-medium">Food</span> — Need a meal, groceries, cooking help</p>
                      <p>• <span className="text-primary font-medium">Talk</span> — Loneliness, advice, just need a human</p>
                      <p>• <span className="text-primary font-medium">Other</span> — Everything else life throws at you</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Trust & Elders */}
              <Card className="p-5 bg-gradient-to-r from-purple-500/10 to-indigo-500/5 border-purple-500/20">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-purple-500/20">
                    <ShieldCheck size={22} weight="duotone" className="text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-2">⭐ Trust & Elders — Earned, Not Given</h4>
                    <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                      Your reputation here means something. It's built through action, 
                      not profiles or verifications.
                    </p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• Help others → earn trust points → unlock badges</p>
                      <p>• After <span className="text-primary font-medium">{ELDER_HELP_THRESHOLD} completed helps</span> or <span className="text-primary font-medium">{ELDER_TRUST_THRESHOLD} trust points</span>: become an Elder</p>
                      <p>• Elders can invite new members — you vouch for who you bring in</p>
                      <p>• <span className="italic">This isn't a popularity contest. It's a web of trust.</span></p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Invite System */}
              <Card className="p-5 bg-gradient-to-r from-green-500/10 to-emerald-500/5 border-green-500/20">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-green-500/20">
                    <TreeStructure size={22} weight="duotone" className="text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-2">🌳 Invites — Quality Over Quantity</h4>
                    <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                      We grow slowly and intentionally. Every member is vouched 
                      for by someone already in the network.
                    </p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• You can only join if someone invites you</p>
                      <p>• Invite codes are limited — use them wisely</p>
                      <p>• You're responsible for who you bring in</p>
                      <p>• <span className="italic">This keeps out the trolls, spammers, and bad actors.</span></p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>

          {/* The Campfire */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="p-6 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-card border-orange-500/20">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-xl bg-orange-500/20">
                  <Fire size={24} weight="duotone" className="text-orange-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">The Campfire</h3>
                  <p className="text-sm text-muted-foreground">Where neighbors gather</p>
                </div>
              </div>
              <p className="text-foreground/90 leading-relaxed">
                Not every interaction needs to be a "help request." Sometimes you 
                just want to say good morning, share a sunset photo, or ask if 
                anyone heard that weird noise last night. The Campfire is our 
                shared space—ephemeral, casual, human. Messages fade after 24 hours 
                because some things don't need to be permanent.
              </p>
            </Card>
          </motion.div>

          {/* Our Promise */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-card border-primary/20">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <Handshake size={24} weight="duotone" className="text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Our Promise</h3>
                  <p className="text-sm text-muted-foreground">What you won't find here</p>
                </div>
              </div>
              <div className="space-y-3 text-foreground/90">
                <p className="flex items-center gap-2">
                  <span className="text-primary">✗</span> No ads. Ever.
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-primary">✗</span> No selling your data.
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-primary">✗</span> No algorithms deciding who you see.
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-primary">✗</span> No gamification tricks to keep you scrolling.
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-primary">✗</span> No premium tiers. No "pro" features.
                </p>
                <p className="mt-4 text-primary font-medium">
                  ✓ Just neighbors, helping neighbors.
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Closing */}
          <motion.div 
            className="text-center py-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 w-16 h-16 mx-auto rounded-full bg-primary/30 blur-xl animate-pulse" />
              <HandHeart size={40} weight="duotone" className="text-primary relative z-10" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Ready to Light the Way?
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              Every community starts small. Every trust is built one help at a time. 
              Welcome to the neighborhood.
            </p>
            <Button 
              onClick={onBack}
              className="mt-6 rounded-xl btn-glow gap-2"
              size="lg"
            >
              <Sparkle size={18} weight="duotone" />
              Let's Get Started
            </Button>
          </motion.div>

        </div>
      </ScrollArea>
    </div>
  )
}
