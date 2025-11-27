# The Lantern Network - Project Documentation

> **Live Demo**: [https://the-lantern-network.vercel.app/](https://the-lantern-network.vercel.app/)

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Target Audience](#target-audience)
3. [Tech Stack](#tech-stack)
4. [Features Overview](#features-overview)
5. [Working Features](#working-features)
6. [Features In Progress / Not Working](#features-in-progress--not-working)
7. [Application Architecture](#application-architecture)
8. [Database Schema](#database-schema)
9. [UI/UX Design System](#uiux-design-system)
10. [Economy System](#economy-system)
11. [Setup & Installation](#setup--installation)
12. [Deployment](#deployment)
13. [Contributing](#contributing)

---

## Project Overview

**The Lantern Network** is a hyperlocal mutual aid platform where neighbors help each other through a trust-based economy powered by **Lanterns** — a limited-supply virtual currency that prevents hoarding and incentivizes genuine community support.

### Vision

The app is designed to feel like a close-knit neighborhood, not a marketplace. It prioritizes:

- **Intimate** - Warm, human-centered design that focuses on trust and connection over transactions
- **Grounded** - Real, tangible help for real neighbors with a solid, dependable interface
- **Hopeful** - Visual language that conveys possibility and mutual support, with glowing lanterns representing human warmth

### Core Concept

Think of it as late-night neighborhood watch — warm glows in darkness, the feeling of looking out windows and seeing lights on in other homes, knowing you're not alone.

---

## Target Audience

The Lantern Network is designed for:

1. **Neighbors & Local Community Members** - People who want to help and receive help from their immediate community
2. **Community Organizers** - Those looking to build trust-based mutual aid networks in their neighborhoods
3. **People Seeking Connection** - Individuals who want to feel more connected to their local community
4. **Skill Sharers** - People with skills like mechanical work, cooking, tutoring, pet care, and more who want to offer help
5. **Those In Need** - Community members who need occasional help with everyday tasks

### Use Cases

- A neighbor needs help fixing their car (Mechanical flare)
- Someone new to the area needs cooking tips or a meal (Food flare)
- A person is going through a tough time and needs someone to talk to (Talk flare)
- General community support requests (Other flare)

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.0.0 | UI Framework |
| **TypeScript** | ~5.7.2 | Type Safety |
| **Vite** | 6.4.1 | Build Tool & Dev Server |
| **Tailwind CSS** | 4.1.11 | Styling |
| **Framer Motion** | 12.6.2 | Animations |
| **React Hook Form** | 7.54.2 | Form Handling |
| **Zod** | 3.25.76 | Schema Validation |

### UI Components

| Library | Purpose |
|---------|---------|
| **Radix UI** | Accessible UI primitives (Dialog, Avatar, Tabs, etc.) |
| **Phosphor Icons** | Icon library |
| **Sonner** | Toast notifications |
| **D3** | Data visualization (for map features) |
| **Recharts** | Charting library |

### Backend / Database

| Service | Purpose |
|---------|---------|
| **Supabase** | Backend-as-a-Service (Auth, PostgreSQL, Realtime) |
| **Supabase Auth** | User authentication (email/password, magic links) |
| **PostgreSQL** | Database (via Supabase) |
| **Row Level Security (RLS)** | Data access control |

### Deployment

| Service | Purpose |
|---------|---------|
| **Vercel** | Frontend hosting & deployment |

---

## Features Overview

### Feature Status Legend

- ✅ **Working** - Fully functional
- 🟡 **Partially Working** - Basic functionality exists, needs improvements
- 🔴 **Not Working / Planned** - Not yet implemented or broken

---

## Working Features

### ✅ Authentication System

- **Email/Password Sign Up & Sign In** - Full registration and login flow
- **Magic Link Authentication** - Passwordless sign-in via email
- **Session Management** - Persistent sessions with automatic refresh
- **Sign Out** - Clean logout functionality

### ✅ Profile System

- **Profile Creation** - New users can create profiles with:
  - Display name (max 30 characters)
  - Bio (max 200 characters, optional)
  - Vibe Tags (1-5 skills/interests)
- **Profile Display** - Vibe Card showing user info, reputation, and skills
- **Elder Status Indicator** - Visual badge for elder community members

### ✅ Splash Screen

- **Animated Launch** - Beautiful lantern logo with glow effects
- **Brand Introduction** - "The Neighborhood That Moves With You" tagline
- **Smooth Transition** - Framer Motion animations to main app

### ✅ Navigation

- **Bottom Tab Bar** - Mobile-first navigation with 5 main sections:
  - Flares (help requests)
  - Campfire (community chat)
  - Wallet (Lantern balance)
  - Messages (1:1 conversations)
  - Profile (user settings)

### ✅ Flares (Help Requests)

- **Create Flare** - Post help requests with:
  - Category selection (Mechanical, Food, Talk, Other)
  - Title (max 100 characters)
  - Description (max 500 characters)
  - Optional GPS location sharing
- **View Active Flares** - See all active flares in the community
- **Flare Cards** - Beautiful cards showing:
  - Creator info and avatar
  - Category badge with icons
  - Description preview
  - Time ago
  - Location indicator (if shared)
  - "Offer Help" button (for others' flares)
  - "Your Flare" badge (for own flares)
- **Real-time Updates** - Flares sync via Supabase realtime + polling

### ✅ Campfire (Community Chat)

- **Global Chat Room** - All verified users can see and send messages
- **Real-time Messaging** - Messages appear instantly (realtime + 3-second polling fallback)
- **Message Fading** - Messages visually fade as they age (opacity based on hours old)
- **User Avatars** - Display initials with color coding
- **Admin Badges** - Special amber styling for admin messages
- **"You" Indicator** - Clear distinction between own and others' messages
- **Timestamps** - Relative time display ("just now", "5m ago", "2h ago")
- **Live Status Indicator** - Green pulse showing active connection

### ✅ Wallet View

- **Lantern Balance Display** - Current balance with progress bar (max 10)
- **Hoard Limit Indicator** - Visual warning when at limit
- **Transaction History Layout** - Prepared for displaying transaction history (currently empty state)

### ✅ Profile View

- **Vibe Card Display** - Full profile card with all user details
- **Stats Display** - Helps completed count and reputation score
- **Elder Status Section** - (Shown for Elder users) with invite code management
- **Account Actions**:
  - Sign Out button
  - Report button (UI only)
  - Delete Account button with confirmation dialog

### ✅ UI/UX Components

- **Dark Theme** - Deep navy backgrounds with amber accents
- **Responsive Design** - Mobile-first with max-width containers
- **Toast Notifications** - Sonner-based feedback for actions
- **Modal Dialogs** - For flare creation, confirmations, etc.
- **Form Validation** - Character limits and required field handling
- **Accessibility** - Radix UI primitives with proper ARIA support

---

## Features In Progress / Not Working

### 🟡 Messages View (Partially Working)

**Current Status**: UI is complete but lacks backend integration

- ✅ UI for displaying help request categories:
  - Incoming help requests (on your flares)
  - Your pending offers (waiting for response)
  - Declined requests
  - Active conversations
- ✅ Chat interface with message bubbles
- ✅ Empty states for no messages
- 🔴 **Not Connected**: Help requests are passed as empty arrays
- 🔴 **Not Connected**: 1-on-1 messaging between users
- 🔴 **Not Connected**: Accept/Deny help request functionality
- 🔴 **Not Connected**: Mark flare as complete workflow

### 🟡 "Offer Help" Button (Partially Working)

**Current Status**: Button exists but only shows a toast

- ✅ Button displays on other users' flares
- 🔴 **Not Implemented**: Actual help request creation
- 🔴 **Not Implemented**: Notification to flare owner
- 🔴 **Not Implemented**: Creating chat thread on acceptance

### 🔴 Lantern Economy (Not Implemented)

**Current Status**: Balance displays but no transactions occur

- ✅ Balance display in wallet
- ✅ Balance stored in database (starts at 5)
- 🔴 **Not Implemented**: Lantern transfers between users
- 🔴 **Not Implemented**: Lantern cost for flares
- 🔴 **Not Implemented**: Transaction history recording
- 🔴 **Not Implemented**: Hoard limit enforcement (sending when at 10)
- 🔴 **Not Implemented**: Task completion Lantern exchange

### 🔴 Invite System (Not Implemented)

**Current Status**: Database tables exist but not connected

- ✅ Database schema for invites table
- ✅ Elder status display on profile
- 🔴 **Not Implemented**: Invite code generation
- 🔴 **Not Implemented**: Invite code validation/redemption
- 🔴 **Not Implemented**: Invite-only registration flow
- 🔴 **Not Implemented**: Invite tree tracking

### 🔴 Map View (Not Implemented)

**Current Status**: Map view component exists but not integrated

- ✅ Component file exists (`map-view.tsx`)
- 🔴 **Not Implemented**: Actual map rendering
- 🔴 **Not Implemented**: Flare pins on map
- 🔴 **Not Implemented**: Distance calculations
- 🔴 **Not Implemented**: Location-based flare filtering

### 🔴 Elder System (Partially Implemented)

**Current Status**: Basic display only

- ✅ Elder badge displays on profile
- ✅ Elder threshold constants defined (20 helps OR 30 days + 5 rep)
- 🔴 **Not Implemented**: Automatic Elder promotion
- 🔴 **Not Implemented**: Elder-only invite generation
- 🔴 **Not Implemented**: Elder status notifications

### 🔴 Trust/Reputation System (Minimal)

**Current Status**: Stored but not updated

- ✅ Trust score stored in database
- ✅ Displayed on profile
- 🔴 **Not Implemented**: Reputation increases from helping
- 🔴 **Not Implemented**: Reputation from receiving help
- 🔴 **Not Implemented**: Trust levels in connections

### 🔴 Safety Features (Not Implemented)

- 🔴 **Not Implemented**: Block user functionality
- 🔴 **Not Implemented**: Report user functionality
- 🔴 **Not Implemented**: Spam prevention (rate limiting)
- 🔴 **Not Implemented**: Content moderation

### 🔴 Message Expiration (Not Implemented)

- 🔴 **Not Implemented**: Campfire messages auto-delete after 24h
- 🔴 **Not Implemented**: Chat archival after 48h inactivity

---

## Application Architecture

### Component Structure

```
src/
├── App.tsx                    # Main app component with navigation
├── main.tsx                   # React entry point
├── components/
│   ├── screens/               # Full-page view components
│   │   ├── auth-screen.tsx    # Login/signup flow
│   │   ├── campfire-view.tsx  # Community chat
│   │   ├── create-flare.tsx   # Flare creation modal
│   │   ├── flares-view.tsx    # Flares list/feed
│   │   ├── messages-view.tsx  # DM conversations
│   │   ├── profile-setup.tsx  # New user profile creation
│   │   ├── profile-view.tsx   # User profile page
│   │   ├── splash-screen.tsx  # App launch animation
│   │   └── wallet-view.tsx    # Lantern wallet
│   ├── ui/                    # Reusable UI primitives (shadcn/ui style)
│   ├── flare-card.tsx         # Flare display component
│   ├── lantern-balance.tsx    # Balance widget
│   └── vibe-card.tsx          # User profile card
├── contexts/
│   └── AuthContext.tsx        # Authentication state management
├── hooks/                     # Custom React hooks
│   ├── use-mobile.ts          # Mobile detection
│   ├── useConnections.ts      # User connections
│   ├── useFlares.ts           # Flare data management
│   ├── useInvites.ts          # Invite code management
│   ├── useMessages.ts         # Messaging state
│   └── useTransactions.ts     # Lantern transactions
├── lib/
│   ├── database.types.ts      # Supabase type definitions
│   ├── economy.ts             # Lantern economy logic
│   ├── supabase.ts            # Supabase client
│   ├── types.ts               # TypeScript interfaces
│   └── utils.ts               # Utility functions
└── styles/                    # CSS and styling
```

### Data Flow

```
┌─────────────────────────────────────────────────────┐
│                     Frontend (React)                 │
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
│  Authentication │ PostgreSQL │ Realtime │ Storage   │
└─────────────────────────────────────────────────────┘
```

---

## Database Schema

### Tables Overview

#### `profiles`
Extends Supabase auth.users with additional user data.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to auth.users |
| `display_name` | VARCHAR(30) | User's display name |
| `avatar_url` | TEXT | Profile photo URL |
| `bio` | VARCHAR(200) | User bio |
| `vibe_tags` | TEXT[] | Skills/interests array |
| `trust_score` | INTEGER | Reputation score (default: 0) |
| `lantern_balance` | INTEGER | Current Lantern balance (default: 5) |
| `location` | JSONB | User's location {lat, lng} |
| `is_admin` | BOOLEAN | Admin status |
| `created_at` | TIMESTAMPTZ | Account creation time |
| `updated_at` | TIMESTAMPTZ | Last update time |

#### `flares`
Help requests posted by users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `creator_id` | UUID | Foreign key to auth.users |
| `title` | VARCHAR(100) | Flare title |
| `description` | TEXT | Full description |
| `category` | VARCHAR(50) | Category type |
| `vibe_tags` | TEXT[] | Related tags |
| `location` | JSONB | Location {lat, lng} |
| `radius_miles` | DECIMAL | Visibility radius (default: 5) |
| `max_participants` | INTEGER | Max helpers allowed |
| `current_participants` | INTEGER | Current count (default: 0) |
| `lantern_cost` | INTEGER | Lanterns for completion (default: 1) |
| `starts_at` | TIMESTAMPTZ | Start time |
| `ends_at` | TIMESTAMPTZ | End time (optional) |
| `status` | VARCHAR(20) | active/accepted/completed/cancelled |
| `created_at` | TIMESTAMPTZ | Creation time |

#### `flare_participants`
Tracks who joins which flares.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `flare_id` | UUID | Foreign key to flares |
| `user_id` | UUID | Foreign key to auth.users |
| `status` | VARCHAR(20) | joined/completed/left |
| `joined_at` | TIMESTAMPTZ | Join time |

#### `connections`
Friendship/trust relationships between users.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | First user |
| `connected_user_id` | UUID | Second user |
| `trust_level` | INTEGER | Trust rating 1-5 |
| `met_through_flare_id` | UUID | How they connected |
| `created_at` | TIMESTAMPTZ | Connection time |

#### `messages`
Direct messages and campfire chat.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `sender_id` | UUID | Message sender |
| `receiver_id` | UUID | Message receiver |
| `flare_id` | UUID | Related flare (null for campfire) |
| `content` | TEXT | Message content |
| `read` | BOOLEAN | Read status |
| `created_at` | TIMESTAMPTZ | Send time |

#### `transactions`
Lantern economy transaction log.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Account holder |
| `type` | VARCHAR(30) | Transaction type |
| `amount` | INTEGER | Lantern amount |
| `description` | TEXT | Transaction description |
| `flare_id` | UUID | Related flare (optional) |
| `created_at` | TIMESTAMPTZ | Transaction time |

**Transaction Types**:
- `welcome_bonus` - Initial Lanterns on signup
- `flare_creation` - Cost to create flare
- `transfer_in` - Received from another user
- `transfer_out` - Sent to another user
- `bonus` - System bonus
- `invite_bonus` - Bonus for inviting someone
- `referral_bonus` - Bonus for being invited

#### `invites`
Invite code system for new user registration.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `inviter_id` | UUID | Who created the invite |
| `code` | VARCHAR(8) | Unique invite code |
| `used` | BOOLEAN | Whether code was used |
| `used_by_id` | UUID | Who redeemed it |
| `expires_at` | TIMESTAMPTZ | Expiration time |
| `created_at` | TIMESTAMPTZ | Creation time |

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

- **Profiles**: Public read, users can only edit their own
- **Flares**: Active flares visible to all, creators can edit/delete own
- **Messages**: Users can only see their own conversations
- **Transactions**: Users can only see their own
- **Invites**: Public read for validation, authenticated create

---

## UI/UX Design System

### Color Palette

The design evokes late-night neighborhood watch with warm amber glows against deep navy darkness.

| Color | OKLCH Value | Usage |
|-------|-------------|-------|
| **Primary (Amber)** | `oklch(0.75 0.15 75)` | Lantern currency, CTAs |
| **Background (Deep Navy)** | `oklch(0.25 0.05 255)` | Main background |
| **Card (Elevated Navy)** | `oklch(0.30 0.05 255)` | Cards, modals |
| **Success (Sage Green)** | `oklch(0.65 0.08 145)` | Completed states |
| **Accent (Bright Amber)** | `oklch(0.85 0.18 70)` | Active flares, urgent |
| **Foreground (Warm White)** | `oklch(0.95 0 0)` | Text content |

### Typography

Using **Inter** font family for a warm, approachable feel:

| Level | Style | Usage |
|-------|-------|-------|
| **H1** | SemiBold 32px | Screen titles |
| **H2** | Medium 24px | Section headers |
| **H3** | Medium 18px | Card titles |
| **Body** | Regular 16px | Content, chat |
| **Caption** | Regular 14px | Timestamps, metadata |
| **Label** | Medium 14px | Form labels, buttons |

### Iconography

Using **Phosphor Icons** with consistent weights:

- **Navigation**: House, ChatCircle, Wallet, UserCircle
- **Actions**: Plus, PaperPlaneRight, HandHeart, X
- **Categories**: Wrench (Mechanical), ForkKnife (Food), ChatsCircle (Talk), Lightbulb (Other)
- **Status**: CheckCircle, Clock, Fire, Star

### Animations

Purposeful motion with Framer Motion:

- **Critical alerts**: Gentle scale + glow
- **Navigation**: Slide with fade
- **Micro-interactions**: 100ms easing
- **Ambient elements**: Slow 3-4s loop animations

---

## Economy System

### Lanterns

Lanterns are the trust-based currency with built-in scarcity:

| Rule | Value | Purpose |
|------|-------|---------|
| **Initial Balance** | 5 Lanterns | Start new users with some currency |
| **Hoard Limit** | 10 Lanterns | Prevents hoarding, encourages circulation |
| **Flare Cost** | 1 Lantern | Cost to complete/thank a helper |

### Elder Status

Long-standing helpful users earn Elder status through either:

1. **Help Threshold**: Complete 20 helps, OR
2. **Time Threshold**: 30 days active + 5+ reputation

Elder benefits:
- Ability to generate invite codes
- Visual Elder badge on profile
- Helps grow the trusted network

---

## Setup & Installation

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Supabase account (for backend)

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation Steps

```bash
# Clone the repository
git clone https://github.com/kevinb42O/the-lantern-network.git
cd the-lantern-network

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
npm run dev
```

### Database Setup

1. Create a new Supabase project
2. Go to SQL Editor in Supabase dashboard
3. Run the contents of `supabase/schema.sql`
4. Enable realtime for the messages table (done in schema)

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 5000) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run kill` | Kill process on port 5000 |

---

## Deployment

### Vercel (Recommended)

The app is configured for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy

The live version is available at: [https://the-lantern-network.vercel.app/](https://the-lantern-network.vercel.app/)

### Manual Deployment

```bash
# Build the project
npm run build

# The dist/ folder contains the static files
# Deploy to any static hosting service
```

---

## Contributing

### Project Structure

The project follows a clean component-based architecture:

- **Screens**: Full-page views in `src/components/screens/`
- **UI Components**: Reusable primitives in `src/components/ui/`
- **Business Logic**: Hooks in `src/hooks/`, utilities in `src/lib/`
- **State Management**: React Context in `src/contexts/`

### Code Style

- TypeScript strict mode
- ESLint for linting
- Tailwind CSS for styling
- Radix UI for accessible primitives

### Known Admin Emails

The app has admin functionality for certain emails (defined in `App.tsx`):

```typescript
const ADMIN_EMAILS = [
  'kevinb42O@hotmail.com',
]
```

Admins get special styling in the Campfire chat and may have additional privileges in future updates.

---

## License

This project is based on GitHub Spark Template and is licensed under the MIT License. See [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Built with [GitHub Spark](https://github.com/github/spark)
- UI components based on [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Phosphor Icons](https://phosphoricons.com/)
- Animations by [Framer Motion](https://www.framer.com/motion/)
- Backend by [Supabase](https://supabase.com/)

---

*Last Updated: November 2024*
