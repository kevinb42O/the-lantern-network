# The Lantern Network - Projectdocumentatie

> **Live Demo**: [https://the-lantern-network.vercel.app/](https://the-lantern-network.vercel.app/)  
> **Laatst bijgewerkt**: December 2025

## 📋 Inhoudsopgave

1. [Projectoverzicht](#projectoverzicht)
2. [Doelgroep](#doelgroep)
3. [Tech Stack](#tech-stack)
4. [Features](#features)
5. [Applicatie Architectuur](#applicatie-architectuur)
6. [Database Schema](#database-schema)
7. [UI/UX Design Systeem](#uiux-design-systeem)
8. [Lantern Economie](#lantern-economie)
9. [Setup & Installatie](#setup--installatie)
10. [Deployment](#deployment)

---

## Projectoverzicht

**The Lantern Network** is een hyperlocaal wederzijdse hulpplatform waar buren elkaar helpen via een vertrouwensgebaseerde economie aangedreven door **Lanterns** — een virtuele munteenheid met beperkte voorraad die hamsterzucht voorkomt en echte community-steun stimuleert.

### Visie

De app voelt als een hechte buurt, geen marktplaats. Het platform prioriteert:

- **Intiem** - Warm, mensgericht ontwerp gericht op vertrouwen en verbinding boven transacties
- **Geworteld** - Echte, tastbare hulp voor echte buren met een solide, betrouwbare interface
- **Hoopvol** - Visuele taal die mogelijkheden en wederzijdse steun uitstraalt, met gloeiende lantaarns die menselijke warmte vertegenwoordigen

### Kernidee

Denk aan late-avond buurtwatch — warme gloed in de duisternis, het gevoel van uit ramen kijken en lichten zien branden in andere huizen, wetende dat je niet alleen bent.

---

## Doelgroep

1. **Buren & Lokale Gemeenschapsleden** - Mensen die willen helpen en hulp willen ontvangen van hun directe gemeenschap
2. **Community Organisatoren** - Degenen die vertrouwensgebaseerde wederzijdse hulpnetwerken willen bouwen in hun buurten
3. **Mensen die Verbinding Zoeken** - Individuen die meer verbonden willen voelen met hun lokale gemeenschap
4. **Vaardighedendelaars** - Mensen met vaardigheden zoals mechanisch werk, koken, bijles, huisdierenzorg, en meer
5. **Mensen die Hulp Nodig Hebben** - Gemeenschapsleden die af en toe hulp nodig hebben met dagelijkse taken

### Gebruik Cases

- Een buur heeft hulp nodig met het repareren van hun auto (Mechanisch flare)
- Iemand nieuw in de buurt heeft kooktips of een maaltijd nodig (Eten flare)
- Een persoon heeft een moeilijke tijd en heeft iemand nodig om mee te praten (Praten flare)
- Algemene community ondersteuningsverzoeken (Andere flare)

---

## Tech Stack

### Frontend

| Technologie | Versie | Doel |
|------------|---------|------|
| **React** | 19.0.0 | UI Framework |
| **TypeScript** | ~5.7.2 | Type Safety |
| **Vite** | 6.4.1 | Build Tool & Dev Server |
| **Tailwind CSS** | 4.1.11 | Styling |
| **Framer Motion** | 12.6.2 | Animaties |
| **React Hook Form** | 7.54.2 | Formulier Afhandeling |
| **Zod** | 3.25.76 | Schema Validatie |

### UI Components

| Bibliotheek | Doel |
|---------|------|
| **Radix UI** | Toegankelijke UI primitieven (Dialog, Avatar, Tabs, etc.) |
| **Phosphor Icons** | Icoonbibliotheek |
| **Sonner** | Toast notificaties |
| **Recharts** | Grafiekbibliotheek |

### Backend / Database

| Service | Doel |
|---------|------|
| **Supabase** | Backend-as-a-Service (Auth, PostgreSQL, Realtime) |
| **Supabase Auth** | Gebruikersauthenticatie (email/wachtwoord, magic links) |
| **PostgreSQL** | Database (via Supabase) |
| **Row Level Security (RLS)** | Data toegangscontrole |

### Testing & Deployment

| Service | Doel |
|---------|------|
| **Playwright** | End-to-end testing |
| **Vercel** | Frontend hosting & deployment |

---

## Features

### ✅ Werkende Features

#### Authenticatie Systeem
- Email/wachtwoord registratie en login
- Magic link authenticatie (wachtwoordloos inloggen)
- Sessiebeheer met automatische refresh
- Uitloggen functionaliteit

#### Profiel Systeem
- Profiel aanmaken met display naam, bio en vibe tags (1-5 vaardigheden/interesses)
- Vibe Card met gebruikersinfo, reputatie en vaardigheden
- Elder status indicator voor ervaren communityleden

#### Splash Screen
- Geanimeerde lancering met lantaarn logo en glow effecten
- "The Neighborhood That Moves With You" tagline
- Soepele overgang naar hoofdapp

#### Navigatie
- Bottom tab bar met 5 secties: Flares, Campfire, Wallet, Berichten, Profiel

#### Flares (Hulpverzoeken)
- Plaats hulpverzoeken met categorie (Mechanisch, Eten, Praten, Anders)
- Bekijk actieve flares in de gemeenschap
- "Bied Hulp Aan" knop voor anderen' flares
- Realtime updates via Supabase

#### Campfire (Community Chat)
- Globale chatruimte voor alle geverifieerde gebruikers
- Realtime messaging met 3-seconden polling fallback
- Berichten vervagen naarmate ze ouder worden
- Admin badges voor admin berichten
- Tijdstempels ("zojuist", "5m geleden", "2u geleden")

#### Wallet
- Lantern saldo display met voortgangsbalk (max 10)
- Hamsterlimiet indicator
- Transactiegeschiedenis layout

#### Berichten
- Help verzoekgesprekken
- Accept/Deny help verzoek functionaliteit
- Markeer flare als compleet workflow
- 1-op-1 messaging tussen gebruikers

#### Lantern Economie
- Saldo opslag in database (start op 5)
- Lantern overdrachten tussen gebruikers bij taak voltooiing
- Transactiegeschiedenis opname
- Hamsterlimiet handhaving (max 10 lantaarns)

#### Elder Systeem
- Elder badge op profiel (trust_score >= 100)
- Trust score verhoogt bij helpen (+10) en hulp ontvangen (+5)
- Elder-only invite generatie
- Invite codes kopiëren naar klembord

### 🔴 Nog Niet Geïmplementeerd

- Kaartweergave met flare pins
- Block/Report gebruiker functionaliteit
- Spam preventie (rate limiting)
- Bericht vervaltijd (Campfire berichten na 24u)
- Invite code validatie/inwisseling bij aanmelding
- Invite tree tracking

---

## Applicatie Architectuur

### Component Structuur

```
src/
├── App.tsx                    # Hoofdapp component met navigatie
├── main.tsx                   # React entry point
├── components/
│   ├── screens/               # Volledig-scherm weergave componenten
│   │   ├── auth-screen.tsx    # Login/signup flow
│   │   ├── campfire-view.tsx  # Community chat
│   │   ├── create-flare.tsx   # Flare aanmaak modal
│   │   ├── flares-view.tsx    # Flares lijst/feed
│   │   ├── messages-view.tsx  # DM gesprekken
│   │   ├── profile-setup.tsx  # Nieuw gebruikersprofiel aanmaken
│   │   ├── profile-view.tsx   # Gebruikersprofiel pagina
│   │   ├── splash-screen.tsx  # App lanceer animatie
│   │   └── wallet-view.tsx    # Lantern wallet
│   ├── ui/                    # Herbruikbare UI primitieven
│   ├── flare-card.tsx         # Flare display component
│   ├── lantern-balance.tsx    # Saldo widget
│   └── vibe-card.tsx          # Gebruikersprofiel kaart
├── contexts/
│   └── AuthContext.tsx        # Authenticatie state management
├── hooks/                     # Custom React hooks
│   ├── useFlares.ts           # Flare data management
│   ├── useInvites.ts          # Invite code management
│   ├── useMessages.ts         # Messaging state
│   └── useTransactions.ts     # Lantern transacties
├── lib/
│   ├── database.types.ts      # Supabase type definities
│   ├── economy.ts             # Lantern economie logica
│   ├── supabase.ts            # Supabase client
│   ├── types.ts               # TypeScript interfaces
│   └── utils.ts               # Hulpfuncties
└── styles/                    # CSS en styling
```

### Data Flow

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (React)                    │
├─────────────────────────────────────────────────────┤
│  AuthContext ─────► Components ◄───── Custom Hooks  │
│       │                  │                  │       │
│       ▼                  ▼                  ▼       │
│  ┌────────────────────────────────────────────────┐ │
│  │              Supabase Client                   │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                 Supabase Backend                     │
├─────────────────────────────────────────────────────┤
│  Authenticatie │ PostgreSQL │ Realtime │ Storage    │
└─────────────────────────────────────────────────────┘
```

---

## Database Schema

### Belangrijkste Tabellen

#### `profiles`
Breidt Supabase auth.users uit met aanvullende gebruikersdata.

| Kolom | Type | Beschrijving |
|--------|------|-------------|
| `id` | UUID | Primaire sleutel |
| `user_id` | UUID | Vreemde sleutel naar auth.users |
| `display_name` | VARCHAR(30) | Weergavenaam gebruiker |
| `avatar_url` | TEXT | Profielfoto URL |
| `bio` | VARCHAR(200) | Gebruiker bio |
| `vibe_tags` | TEXT[] | Vaardigheden/interesses array |
| `trust_score` | INTEGER | Reputatie score (standaard: 0) |
| `lantern_balance` | INTEGER | Huidig Lantern saldo (standaard: 5) |
| `location` | JSONB | Gebruikerslocatie {lat, lng} |
| `is_admin` | BOOLEAN | Admin status |
| `created_at` | TIMESTAMPTZ | Account aanmaaktijd |

#### `flares`
Hulpverzoeken geplaatst door gebruikers.

| Kolom | Type | Beschrijving |
|--------|------|-------------|
| `id` | UUID | Primaire sleutel |
| `creator_id` | UUID | Vreemde sleutel naar auth.users |
| `title` | VARCHAR(100) | Flare titel |
| `description` | TEXT | Volledige beschrijving |
| `category` | VARCHAR(50) | Categorie type |
| `location` | JSONB | Locatie {lat, lng} |
| `lantern_cost` | INTEGER | Lantaarns voor voltooiing (standaard: 1) |
| `status` | VARCHAR(20) | active/accepted/completed/cancelled |
| `created_at` | TIMESTAMPTZ | Aanmaaktijd |

#### `messages`
Directe berichten en campfire chat.

| Kolom | Type | Beschrijving |
|--------|------|-------------|
| `id` | UUID | Primaire sleutel |
| `sender_id` | UUID | Bericht verzender |
| `receiver_id` | UUID | Bericht ontvanger |
| `flare_id` | UUID | Gerelateerde flare (null voor campfire) |
| `content` | TEXT | Bericht inhoud |
| `read` | BOOLEAN | Gelezen status |
| `created_at` | TIMESTAMPTZ | Verzendtijd |

#### `transactions`
Lantern economie transactie log.

| Kolom | Type | Beschrijving |
|--------|------|-------------|
| `id` | UUID | Primaire sleutel |
| `user_id` | UUID | Account houder |
| `type` | VARCHAR(30) | Transactie type |
| `amount` | INTEGER | Lantern bedrag |
| `description` | TEXT | Transactie beschrijving |
| `flare_id` | UUID | Gerelateerde flare (optioneel) |
| `created_at` | TIMESTAMPTZ | Transactietijd |

**Transactie Types**:
- `welcome_bonus` - Initiële Lantaarns bij aanmelding
- `flare_creation` - Kosten om flare aan te maken
- `transfer_in` - Ontvangen van andere gebruiker
- `transfer_out` - Verzonden naar andere gebruiker
- `bonus` - Systeem bonus
- `invite_bonus` - Bonus voor uitnodigen van iemand
- `referral_bonus` - Bonus voor uitgenodigd worden

#### `invites`
Invite code systeem voor nieuwe gebruikersregistratie.

| Kolom | Type | Beschrijving |
|--------|------|-------------|
| `id` | UUID | Primaire sleutel |
| `inviter_id` | UUID | Wie de invite aanmaakte |
| `code` | VARCHAR(8) | Unieke invite code |
| `used` | BOOLEAN | Of code gebruikt is |
| `used_by_id` | UUID | Wie het inwissel de |
| `expires_at` | TIMESTAMPTZ | Vervaltijd |
| `created_at` | TIMESTAMPTZ | Aanmaaktijd |

### Row Level Security (RLS)

Alle tabellen hebben RLS ingeschakeld met geschikte beleidsregels:

- **Profiles**: Public read, gebruikers kunnen alleen hun eigen bewerken
- **Flares**: Actieve flares zichtbaar voor allen, creators kunnen eigen bewerken/verwijderen
- **Messages**: Gebruikers kunnen alleen hun eigen gesprekken zien
- **Transactions**: Gebruikers kunnen alleen hun eigen zien
- **Invites**: Public read voor validatie, geauthenticeerde aanmaak

---

## UI/UX Design Systeem

### Kleurenpalet

Het ontwerp roept late-avond buurtwatch op met warme amber gloed tegen diepe navy duisternis.

| Kleur | OKLCH Waarde | Gebruik |
|-------|-------------|---------|
| **Primair (Amber)** | `oklch(0.75 0.15 75)` | Lantern valuta, CTAs |
| **Achtergrond (Deep Navy)** | `oklch(0.25 0.05 255)` | Hoofdachtergrond |
| **Kaart (Elevated Navy)** | `oklch(0.30 0.05 255)` | Kaarten, modals |
| **Succes (Sage Green)** | `oklch(0.65 0.08 145)` | Voltooide statussen |
| **Accent (Bright Amber)** | `oklch(0.85 0.18 70)` | Actieve flares, urgent |
| **Voorgrond (Warm White)** | `oklch(0.95 0 0)` | Tekst inhoud |

### Typografie

Gebruikt **Inter** font familie voor een warm, toegankelijk gevoel:

| Niveau | Stijl | Gebruik |
|-------|-------|---------|
| **H1** | SemiBold 32px | Scherm titels |
| **H2** | Medium 24px | Sectie headers |
| **H3** | Medium 18px | Kaart titels |
| **Body** | Regular 16px | Inhoud, chat |
| **Caption** | Regular 14px | Tijdstempels, metadata |
| **Label** | Medium 14px | Formulier labels, knoppen |

### Iconografie

Gebruikt **Phosphor Icons** met consistente gewichten:

- **Navigatie**: House, ChatCircle, Wallet, UserCircle
- **Acties**: Plus, PaperPlaneRight, HandHeart, X
- **Categorieën**: Wrench (Mechanisch), ForkKnife (Eten), ChatsCircle (Praten), Lightbulb (Andere)
- **Status**: CheckCircle, Clock, Fire, Star

### Animaties

Doelgerichte beweging met Framer Motion:

- **Kritieke waarschuwingen**: Zachte scale + glow
- **Navigatie**: Slide met fade
- **Micro-interacties**: 100ms easing
- **Ambient elementen**: Langzame 3-4s loop animaties

---

## Lantern Economie

### Lantaarns

Lantaarns zijn de vertrouwensgebaseerde valuta met ingebouwde schaarste:

| Regel | Waarde | Doel |
|------|-------|---------|
| **Initieel Saldo** | 5 Lantaarns | Start nieuwe gebruikers met valuta |
| **Hamsterlimiet** | 10 Lantaarns | Voorkomt hamsteren, stimuleert circulatie |
| **Flare Kosten** | 1 Lantaarn | Kosten om helper te bedanken bij voltooiing |

### Elder Status

Langdurige behulpzame gebruikers verdienen Elder status via:

1. **Hulp Drempel**: Voltooi 20 hulpacties, OF
2. **Tijd Drempel**: 30 dagen actief + 5+ reputatie

Elder voordelen:
- Mogelijkheid om invite codes te genereren
- Visuele Elder badge op profiel
- Helpt het vertrouwde netwerk te laten groeien

---

## Setup & Installatie

### Vereisten

- Node.js 18+ 
- npm of pnpm
- Supabase account (voor backend)

### Omgevingsvariabelen

Maak een `.env` bestand aan:

```env
VITE_SUPABASE_URL=jouw_supabase_project_url
VITE_SUPABASE_ANON_KEY=jouw_supabase_anon_key
```

### Installatiestappen

```bash
# Clone de repository
git clone https://github.com/kevinb42O/the-lantern-network.git
cd the-lantern-network

# Installeer dependencies
npm install

# Stel omgevingsvariabelen in
# Bewerk .env met jouw Supabase credentials

# Voer development server uit
npm run dev
```

### Database Setup

1. Maak een nieuw Supabase project
2. Ga naar SQL Editor in Supabase dashboard
3. Voer de inhoud van `supabase/schema.sql` uit
4. Schakel realtime in voor de messages tabel (gedaan in schema)

### Beschikbare Scripts

Zie [README.md](README.md) voor een volledige lijst van beschikbare npm scripts.

---

## Deployment

### Vercel (Aanbevolen)

De app is geconfigureerd voor Vercel deployment:

1. Verbind je GitHub repository met Vercel
2. Voeg omgevingsvariabelen toe in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy

Live versie: [https://the-lantern-network.vercel.app/](https://the-lantern-network.vercel.app/)

### Handmatige Deployment

```bash
# Build het project
npm run build

# De dist/ folder bevat de statische bestanden
# Deploy naar een willekeurige statische hosting service
```

---

## Aanvullende Documentatie

- [README.md](README.md) - Projectoverzicht en quickstart
- [e2e/README.md](e2e/README.md) - E2E test suite documentatie
- [E2E_TEST_SETUP.md](E2E_TEST_SETUP.md) - E2E test setup handleiding
- [SECURITY.md](SECURITY.md) - Beveiligingsbeleid

---

## Licentie

Dit project is gebaseerd op GitHub Spark Template en is gelicenseerd onder de MIT Licentie. Zie [LICENSE](LICENSE) bestand voor details.

---

## Dankbetuigingen

- Gebouwd met [GitHub Spark](https://github.com/github/spark)
- UI componenten gebaseerd op [shadcn/ui](https://ui.shadcn.com/)
- Iconen door [Phosphor Icons](https://phosphoricons.com/)
- Animaties door [Framer Motion](https://www.framer.com/motion/)
- Backend door [Supabase](https://supabase.com/)
