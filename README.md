# 🏮 The Lantern Network

**Een hyperlocaal wederzijdse hulpplatform waar buren elkaar helpen via een vertrouwenseconomie aangedreven door Lanterns.**

> **Live Demo**: [https://the-lantern-network.vercel.app/](https://the-lantern-network.vercel.app/)

## 📋 Overzicht

The Lantern Network is een platform waar buurten elkaar steunen via een vertrouwensgebaseerde economie. Het platform gebruikt **Lanterns** — een virtuele munteenheid met beperkte voorraad die hamsterzucht voorkomt en echte community-steun stimuleert.

### Kernfuncties

- **Flares**: Plaats hulpverzoeken in categorieën (Mechanisch, Eten, Praten, Anders)
- **Campfire**: Community chatruimte voor alle leden
- **Berichten**: 1-op-1 gesprekken en hulpaanvragen
- **Wallet**: Beheer je Lantern-saldo en transacties
- **Profiel**: Vibe tags, reputatie en Elder-status

## 🚀 Quickstart

### Vereisten

- Node.js 18 of hoger
- npm of pnpm
- Supabase account (voor backend)

### Installatie

```bash
# Clone de repository
git clone https://github.com/kevinb42O/the-lantern-network.git
cd the-lantern-network

# Installeer dependencies
npm install

# Configureer omgevingsvariabelen
# Maak een .env bestand aan met:
VITE_SUPABASE_URL=jouw_supabase_project_url
VITE_SUPABASE_ANON_KEY=jouw_supabase_anon_key

# Start development server
npm run dev
```

### Database Setup

1. Maak een nieuw Supabase project
2. Ga naar SQL Editor in Supabase dashboard
3. Voer de inhoud van `supabase/schema.sql` uit
4. Schakel realtime in voor de messages tabel

## 📜 Beschikbare Scripts

| Commando | Beschrijving |
|----------|--------------|
| `npm run dev` | Start development server |
| `npm run build` | Build voor productie |
| `npm run preview` | Preview productie build |
| `npm run lint` | Voer ESLint uit |
| `npm run optimize` | Optimaliseer Vite dependencies |
| `npm run test:e2e` | Voer Playwright E2E tests uit (headless) |
| `npm run test:e2e:ui` | Voer E2E tests uit met UI mode |
| `npm run test:e2e:headed` | Voer E2E tests uit in headed mode |
| `npm run test:e2e:debug` | Debug E2E tests |
| `npm run test:e2e:report` | Bekijk test rapport |

## 🧪 Testing

Het project gebruikt [Playwright](https://playwright.dev/) voor end-to-end testing. Zie [e2e/README.md](e2e/README.md) en [E2E_TEST_SETUP.md](E2E_TEST_SETUP.md) voor volledige documentatie.

Voor het draaien van tests heb je test credentials nodig in je `.env` bestand:

```env
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=test-password
```

## 🚢 Deployment

### Vercel (Aanbevolen)

De app is geconfigureerd voor Vercel deployment:

1. Verbind je GitHub repository met Vercel
2. Voeg omgevingsvariabelen toe in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy

Live versie: [https://the-lantern-network.vercel.app/](https://the-lantern-network.vercel.app/)

### GitHub Pages (Optioneel)

Voor statische deployment:

```bash
npm run build
# Deploy de dist/ folder naar je hosting service
```

## 📚 Documentatie

- [DOCUMENTATION.md](DOCUMENTATION.md) - Volledige project documentatie (Nederlands)
- [e2e/README.md](e2e/README.md) - E2E test suite documentatie
- [E2E_TEST_SETUP.md](E2E_TEST_SETUP.md) - E2E test setup handleiding
- [SECURITY.md](SECURITY.md) - Beveiligingsbeleid

## 🛡️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4, Framer Motion
- **Backend**: Supabase (Auth, PostgreSQL, Realtime)
- **UI Components**: Radix UI, Phosphor Icons
- **Testing**: Playwright
- **Deployment**: Vercel

## 📄 Licentie

Dit project is gelicenseerd onder de MIT Licentie. Zie het [LICENSE](LICENSE) bestand voor details.

---

Voor meer gedetailleerde informatie over architectuur, features en ontwikkeling, zie [DOCUMENTATION.md](DOCUMENTATION.md).
