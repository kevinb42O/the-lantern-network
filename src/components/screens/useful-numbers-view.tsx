import { Phone, Buildings, Recycle, Fire, FirstAid, CheckCircle, Storefront, ChatCircle, ShieldPlus } from '@phosphor-icons/react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface UsefulNumbersViewProps {
  // Geen props nodig voor nu
}

export function UsefulNumbersView({}: UsefulNumbersViewProps) {
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with gradient */}
      <div className="p-5 border-b border-border bg-gradient-to-b from-card/80 to-transparent relative z-10">
        <div className="max-w-lg mx-auto space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/15">
              <Phone size={24} weight="duotone" className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Handige Nummers</h1>
              <p className="text-sm text-muted-foreground">Altijd bij de hand</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-5 max-w-lg mx-auto space-y-6 relative z-10">
          {/* Sectie 1: Belangrijke Nummers */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground px-1">
              Belangrijke Nummers
            </h2>
            
            <Card className="overflow-hidden">
              <CardContent className="p-0 divide-y divide-border">
                {/* Politie */}
                <a
                  href="tel:112"
                  className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10">
                    <span className="text-2xl">🚨</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Politie (Noodnummer)</p>
                    <p className="text-sm text-primary font-semibold">112</p>
                  </div>
                </a>

                {/* Brandweer */}
                <a
                  href="tel:050681720"
                  className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10">
                    <span className="text-2xl">🔥</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Brandweer Blankenberge</p>
                    <p className="text-sm text-primary font-semibold">050 68 17 20</p>
                  </div>
                </a>

                {/* De Bollaert */}
                <a
                  href="tel:050235850"
                  className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                    <span className="text-2xl">🏢</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">De Bollaert Blankenberge</p>
                    <p className="text-sm text-primary font-semibold">050 235 850</p>
                  </div>
                </a>

                {/* Stadhuis */}
                <a
                  href="tel:050636400"
                  className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                    <span className="text-2xl">🏛️</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Stadhuis Blankenberge</p>
                    <p className="text-sm text-primary font-semibold">050 63 64 00</p>
                  </div>
                </a>

                {/* Recyclagepark */}
                <a
                  href="tel:050636700"
                  className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/10">
                    <span className="text-2xl">♻️</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Recyclagepark</p>
                    <p className="text-sm text-primary font-semibold">050 636 700</p>
                  </div>
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Sectie 2: Vertrouwde Partners */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <h2 className="text-lg font-semibold text-foreground">
                Vertrouwde Partners
              </h2>
              <CheckCircle size={20} weight="fill" className="text-success" />
            </div>
            
            {/* Praten / Professionele begeleiding */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💬</span>
                  <CardTitle className="text-base">Praten / Professionele begeleiding</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium text-foreground">Praktijk Itransform Blankenberge</p>
                <a
                  href="tel:0469150584"
                  className="block text-sm text-primary font-semibold hover:underline"
                >
                  0469 15 05 84
                </a>
                <a
                  href="https://praktijk-itransform.be"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-primary hover:underline"
                >
                  praktijk-itransform.be
                </a>
              </CardContent>
            </Card>

            {/* Lokale winkels */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🛍️</span>
                  <CardTitle className="text-base">Lokale winkels open op zondag</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Bakkerij Hacke */}
                <div>
                  <p className="font-medium text-foreground">Bakkerij Hacke</p>
                  <a
                    href="tel:050411727"
                    className="block text-sm text-primary font-semibold hover:underline"
                  >
                    050 41 17 27
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">06:30–19:00</p>
                </div>

                {/* Okay City */}
                <div>
                  <p className="font-medium text-foreground">Okay City Blankenberge Grote Markt</p>
                  <p className="text-xs text-muted-foreground mt-1">8:00-19:30</p>
                </div>

                {/* Keurslager Demuynck */}
                <div>
                  <p className="font-medium text-foreground">Keurslager Demuynck</p>
                  <a
                    href="tel:050412332"
                    className="block text-sm text-primary font-semibold hover:underline"
                  >
                    050 41 23 32
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">08:30–12:00</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom spacing for safe area */}
          <div className="h-4" />
        </div>
      </ScrollArea>
    </div>
  )
}
