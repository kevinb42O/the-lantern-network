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
import { LanternBackground } from '@/components/ui/lantern-background'

interface PhilosophyViewProps {
  onBack: () => void
}

export function PhilosophyView({ onBack }: PhilosophyViewProps) {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden relative">
      {/* Lantern mascot background */}
      <LanternBackground opacity={0.3} />
      
      {/* Header */}
      <div className="p-5 border-b border-border/50 bg-gradient-to-b from-orange-950/20 to-transparent relative z-10">
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
            <h1 className="text-2xl font-bold text-foreground">Onze Filosofie</h1>
            <p className="text-sm text-muted-foreground">Waarom we doen wat we doen</p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 relative z-10">
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
              Buren, Geen Vreemden
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
              In een wereld van eindeloos scrollen en verre verbindingen, 
              geloven we dat de mensen die je het best kunnen helpen, 
              degenen zijn die het dichtst bij je wonen.
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
                  <h3 className="text-xl font-semibold text-foreground">Waarom We Dit Bouwden</h3>
                  <p className="text-sm text-muted-foreground">De eerlijke waarheid</p>
                </div>
              </div>
              <div className="space-y-4 text-foreground/90 leading-relaxed">
                <p>
                  We zijn het moe van apps die gemeenschap beloven maar algoritmes leveren. 
                  Moe van platforms die elke interactie in een transactie veranderen, 
                  elke gunst in een opdracht, elke buur in een beoordeling.
                </p>
                <p>
                  De Lantaarn bestaat omdat echte gemeenschap niet gekocht kan worden—
                  het moet gebouwd worden. Één kleine hulp tegelijk. 
                  Een rit naar de luchthaven. Een kopje suiker. Iemand om mee te praten 
                  als je om 2 uur 's nachts buitengesloten bent.
                </p>
                <p>
                  We zijn hier niet om iets te ontwrichten. We zijn hier om iets te herinneren 
                  dat we vergeten zijn: <span className="text-primary font-medium">dat voor elkaar zorgen 
                  is hoe de buurt eigenlijk werkt.</span>
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
                  <h3 className="text-xl font-semibold text-foreground">Voor Wie Dit Is</h3>
                  <p className="text-sm text-muted-foreground">Echte mensen, echte behoeften</p>
                </div>
              </div>
              <div className="space-y-4 text-foreground/90 leading-relaxed">
                <p>
                  <span className="text-primary font-medium">De jonge ouder</span> die 
                  20 minuten kinderopvang nodig heeft om te kunnen douchen. <span className="text-primary font-medium">De 
                  oudere buur</span> die gewoon iemand nodig heeft om de bovenste plank te bereiken. 
                  <span className="text-primary font-medium"> De student</span> wiens auto niet 
                  wil starten voor een examen.
                </p>
                <p>
                  <span className="text-primary font-medium">De persoon die thuis werkt</span> en 
                  al dagen geen echt gesprek heeft gehad. <span className="text-primary font-medium">De 
                  ervaren monteur</span> die liever een buur helpt dan hem te zien opgelicht worden. 
                  <span className="text-primary font-medium">Iedereen</span> die gelooft 
                  dat om hulp vragen geen zwakte is—het is vertrouwen.
                </p>
                <p className="italic text-muted-foreground">
                  Als je ooit gedacht hebt "Ik wou dat ik iemand kende die hiermee kon helpen," 
                  dan is dit voor jou.
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
              <h3 className="text-xl font-semibold text-foreground">Hoe Het Werkt</h3>
            </div>
            <p className="text-muted-foreground mb-5 leading-relaxed">
              We hebben eenvoudige regels ontworpen die oprechte hulp aanmoedigen en hamsteren, 
              uitbuiting en de gebruikelijke platform-onzin ontmoedigen.
            </p>

            <div className="space-y-4">
              {/* Lanterns */}
              <Card className="p-5 bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-amber-500/20">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-amber-500/20">
                    <Sparkle size={22} weight="duotone" className="text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-2">🏮 Lichtpuntjes — Onze Valuta van Vertrouwen</h4>
                    <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                      Lichtpuntjes zijn geen geld. Je kunt ze niet kopen. Je kunt ze niet uitbetalen. 
                      Ze zijn een manier om "dank je wel" te zeggen die echt iets betekent.
                    </p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• Begin met <span className="text-primary font-medium">{INITIAL_LANTERNS} Lichtpuntjes</span> als je lid wordt</p>
                      <p>• Maximum van <span className="text-primary font-medium">{HOARD_LIMIT} Lichtpuntjes</span> op elk moment (niet hamsteren)</p>
                      <p>• Geef 1 Lichtpuntje als iemand je helpt</p>
                      <p>• <span className="italic">De limiet houdt alles in beweging. Meer helpen, meer geven, meer ontvangen.</span></p>
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
                    <h4 className="font-semibold text-foreground mb-2">🔥 Lichtjes — Als Je Hulp Nodig Hebt</h4>
                    <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                      Een Lichtje is een signaal naar je buren. Geen vacature. 
                      Geen advertentie. Gewoon een eerlijk verzoek.
                    </p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• <span className="text-primary font-medium">Technisch</span> — Autopech, dingen repareren, verhuizen</p>
                      <p>• <span className="text-primary font-medium">Eten</span> — Een maaltijd nodig, boodschappen, kookhulp</p>
                      <p>• <span className="text-primary font-medium">Gezelschap</span> — Eenzaamheid, advies, gewoon een mens nodig</p>
                      <p>• <span className="text-primary font-medium">Overig</span> — Alles wat het leven je nog meer voorschotelt</p>
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
                    <h4 className="font-semibold text-foreground mb-2">⭐ Vertrouwen & Buurhelden — Verdiend, Niet Gegeven</h4>
                    <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                      Je reputatie hier betekent iets. Het wordt gebouwd door actie, 
                      niet door profielen of verificaties.
                    </p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• Help anderen → verdien vertrouwenspunten → ontgrendel badges</p>
                      <p>• Na <span className="text-primary font-medium">{ELDER_HELP_THRESHOLD} voltooide hulpacties</span> of <span className="text-primary font-medium">{ELDER_TRUST_THRESHOLD} vertrouwenspunten</span>: word een Buurheld</p>
                      <p>• Buurhelden kunnen nieuwe leden uitnodigen — je staat in voor wie je meebrengt</p>
                      <p>• <span className="italic">Dit is geen populariteitswedstrijd. Het is een web van vertrouwen.</span></p>
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
                    <h4 className="font-semibold text-foreground mb-2">🌳 Uitnodigingen — Kwaliteit Boven Kwantiteit</h4>
                    <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                      We groeien langzaam en bewust. Elk lid wordt aanbevolen 
                      door iemand die al in het netwerk zit.
                    </p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• Je kunt alleen lid worden als iemand je uitnodigt</p>
                      <p>• Uitnodigingscodes zijn beperkt — gebruik ze verstandig</p>
                      <p>• Je bent verantwoordelijk voor wie je meebrengt</p>
                      <p>• <span className="italic">Dit houdt trollen, spammers en kwaadwilligen buiten.</span></p>
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
                  <h3 className="text-xl font-semibold text-foreground">'t Kampvuur</h3>
                  <p className="text-sm text-muted-foreground">Waar buren samenkomen</p>
                </div>
              </div>
              <p className="text-foreground/90 leading-relaxed">
                Niet elke interactie hoeft een "hulpvraag" te zijn. Soms wil je 
                gewoon goedemorgen zeggen, een zonsondergangfoto delen, of vragen of 
                iemand dat vreemde geluid gisteravond ook gehoord heeft. 't Kampvuur is onze 
                gedeelde ruimte—vluchtig, informeel, menselijk. Berichten vervagen na 24 uur 
                omdat sommige dingen niet permanent hoeven te zijn.
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
                  <h3 className="text-xl font-semibold text-foreground">Onze Belofte</h3>
                  <p className="text-sm text-muted-foreground">Wat je hier niet zult vinden</p>
                </div>
              </div>
              <div className="space-y-3 text-foreground/90">
                <p className="flex items-center gap-2">
                  <span className="text-primary">✗</span> Geen advertenties. Nooit.
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-primary">✗</span> Je gegevens worden niet verkocht.
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-primary">✗</span> Geen algoritmes die bepalen wie je ziet.
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-primary">✗</span> Geen gamificatie-trucs om je te laten scrollen.
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-primary">✗</span> Geen premium-abonnementen. Geen "pro" functies.
                </p>
                <p className="mt-4 text-primary font-medium">
                  ✓ Gewoon buren die buren helpen.
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
              Klaar Om De Weg Te Verlichten?
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
              Elke buurtgemeenschap begint klein. Elk vertrouwen wordt opgebouwd, één hulp tegelijk. 
              Welkom in de buurt.
            </p>
            <Button 
              onClick={onBack}
              className="mt-6 rounded-xl btn-glow gap-2"
              size="lg"
            >
              <Sparkle size={18} weight="duotone" />
              Laten We Beginnen
            </Button>
          </motion.div>

        </div>
      </ScrollArea>
    </div>
  )
}
