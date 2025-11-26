# Planning Guide

A hyperlocal mutual aid platform where neighbors help each other through a trust-based economy powered by Lanterns—a limited-supply currency that prevents hoarding and incentivizes genuine community support.

**Experience Qualities**:
1. **Intimate** - The app should feel like a close-knit neighborhood, not a marketplace. Warm, human-centered design that prioritizes trust and connection over transactions.
2. **Grounded** - Real, tangible help for real neighbors. The interface should feel solid and dependable, never flashy or gamified beyond what serves the community purpose.
3. **Hopeful** - The visual language should convey possibility and mutual support. Glowing lanterns represent human warmth in darkness, creating an atmosphere of collective resilience.

**Complexity Level**: Light Application (multiple features with basic state)
- Core features include map-based request posting, chat, wallet system, and invite management. State management focuses on user balance, active flares, and reputation without requiring complex backend infrastructure beyond KV storage.

## Essential Features

### Invite Code Verification
- **Functionality**: Validates alphanumeric invite codes to grant new user access
- **Purpose**: Creates a trust network through invitation chains, preventing spam and maintaining community quality
- **Trigger**: First-time app launch or when user has no verified profile
- **Progression**: Splash screen → Input invite code → Validate → Profile creation (if valid) → Mint 3 Lanterns
- **Success criteria**: Valid codes grant access, invalid codes show clear error message, user enters the app with initial Lantern balance

### Profile Creation & Vibe Card
- **Functionality**: Users create identity with username, photo, and skill tags; view their reputation and help history
- **Purpose**: Establishes trust identity and showcases what help users can offer
- **Trigger**: After successful invite verification, or via settings to edit profile
- **Progression**: Enter username → Upload vibe photo → Select skill tags from preset list → View completed profile card with reputation score (starts at 0)
- **Success criteria**: Profile persists, displays reputation accurately, shows complete help history

### Lantern Wallet
- **Functionality**: Displays current balance (max 10), transaction history, and enables peer-to-peer transfers
- **Purpose**: Core economy that limits hoarding and encourages circulation through artificial scarcity
- **Trigger**: Accessible from main navigation; transfers initiated when helping someone or as gratitude gesture
- **Progression**: View balance widget → Tap for details → See transaction history → Tap transfer → Select recipient → Slide to confirm → Balance updates immediately
- **Success criteria**: Balance never exceeds 10, all transactions logged, transfers feel instant and satisfying

### Flare Creation & Map View
- **Functionality**: Post help requests with location, category, and description; view all active requests on a map or list
- **Purpose**: Makes neighborhood needs visible and actionable
- **Trigger**: User needs help (create) or wants to help (view map)
- **Progression**: Tap create flare → Select category (Mechanical/Food/Talk/Other) → Write description → Confirm GPS location → Post → Flare appears on map for nearby users
- **Success criteria**: Flares appear within 30 seconds, sorted by distance, clear visual hierarchy between urgent and casual needs

### Mission Control (1-on-1 Chat)
- **Functionality**: Private chat opens when someone accepts a Flare to coordinate help
- **Purpose**: Enables logistics coordination while keeping main Campfire space clean
- **Trigger**: User taps "I can help" on a Flare
- **Progression**: Accept Flare → Chat opens → Exchange messages → Complete help → Optional: Send Lantern tip → Chat archives after 48h of inactivity
- **Success criteria**: Messages deliver in real-time, both parties can end conversation, clear path to payment/gratitude

### The Campfire (Global Chat)
- **Functionality**: Ephemeral community chat visible to all verified users
- **Purpose**: Builds ambient community feeling and enables casual connection beyond transactional help
- **Trigger**: Accessible from main navigation
- **Progression**: Open Campfire → Read recent messages → Type message → Send → Message visible to all (disappears after 24h automatically)
- **Success criteria**: Messages feel lightweight and temporary, no permanent record creates safety, obvious visual aging of older messages

### Elder Status & Invite Generation
- **Functionality**: Long-standing helpful users earn ability to generate new invite codes
- **Purpose**: Rewards positive community members and grows network through trusted chains
- **Trigger**: Automatic when user reaches thresholds (20 completed helps OR 30 days active with 5+ reputation)
- **Progression**: User meets criteria → Notification appears → New invite code appears in Invite Inventory → User can share code → New member joins → Tree relationship established
- **Success criteria**: Clear criteria communicated, codes are unique and trackable, invite tree is viewable

## Edge Case Handling

- **Hoard Limit Reached**: When attempting to receive Lantern while at 10 balance, show friendly modal explaining the limit with suggestion to spend or gift
- **No Active Flares**: Empty map shows illustration with "Your neighborhood is quiet right now" message and encourage posting
- **Offline Mode**: Core features (viewing profile, reading chat history) work offline; posting/accepting requires connection with clear "reconnecting" indicator
- **Invalid Location**: If GPS unavailable, allow manual neighborhood selection from predefined zones
- **Spam Prevention**: Rate limit Flare posting to 3 per day; Campfire messages to 20 per hour with progressive cooldown
- **Safety Reports**: Immediate block and report flow with required category selection (harassment/spam/safety concern)

## Design Direction

The design should evoke late-night neighborhood watch—warm glows in darkness, the feeling of looking out windows and seeing lights on in other homes, knowing you're not alone. Interface should be minimal and calm, letting the human connections take center stage rather than competing for attention. Think dim amber lighting, deep navy backgrounds, and soft rounded shapes that feel welcoming rather than clinical.

## Color Selection

**Triadic** - Using amber (lantern glow), deep navy (night sky), and muted green (hope/growth) to create depth and emotional resonance around the core metaphor of neighbors as guiding lights.

- **Primary Color**: Amber/Honey (oklch(0.75 0.15 75)) - Represents the Lantern currency itself, warm and inviting like candlelight, used for all currency-related UI and primary CTAs
- **Secondary Colors**: Deep Navy (oklch(0.25 0.05 255)) for backgrounds creating nighttime atmosphere; Muted Sage (oklch(0.65 0.08 145)) for success states and completed helps
- **Accent Color**: Bright Amber (oklch(0.85 0.18 70)) - High-contrast version of primary for active Flares and urgent attention states
- **Foreground/Background Pairings**:
  - Background (Deep Navy oklch(0.25 0.05 255)): Warm White (oklch(0.95 0 0)) - Ratio 10.5:1 ✓
  - Card (Elevated Navy oklch(0.30 0.05 255)): Warm White (oklch(0.95 0 0)) - Ratio 8.9:1 ✓
  - Primary (Amber oklch(0.75 0.15 75)): Deep Navy (oklch(0.25 0.05 255)) - Ratio 4.8:1 ✓
  - Secondary (Charcoal oklch(0.35 0.02 255)): Warm White (oklch(0.95 0 0)) - Ratio 7.2:1 ✓
  - Accent (Bright Amber oklch(0.85 0.18 70)): Deep Navy (oklch(0.25 0.05 255)) - Ratio 6.5:1 ✓
  - Muted (Dark Navy oklch(0.28 0.04 255)): Soft White (oklch(0.85 0 0)) - Ratio 5.1:1 ✓

## Font Selection

Typography should feel human and approachable while maintaining clarity for wayfinding. A warm sans-serif for UI elements paired with slightly rounded letterforms conveys accessibility without feeling childish—this is serious mutual aid, but with heart.

- **Typographic Hierarchy**:
  - H1 (Screen Titles): Inter SemiBold/32px/tight tracking/-0.02em - For main screen headers like "The Campfire"
  - H2 (Section Headers): Inter Medium/24px/normal tracking - For wallet sections, profile categories
  - H3 (Card Titles): Inter Medium/18px/normal tracking - For Flare titles, user names
  - Body (Primary Content): Inter Regular/16px/1.5 line height - For descriptions, chat messages
  - Caption (Metadata): Inter Regular/14px/1.4 line height/muted color - For timestamps, distances, transaction details
  - Label (Form Fields): Inter Medium/14px/normal tracking/letter-spacing 0.01em - For input labels, button text

## Animations

Motion should feel purposeful and grounded—think gentle transitions like lanterns swaying or fire flickering, not rapid gamified celebrations. Animations primarily serve to guide attention to important state changes (Lantern received, new Flare nearby) and maintain spatial continuity when navigating between map and detail views.

- **Purposeful Meaning**: Lantern transactions use a gentle "float away" animation suggesting the currency moving between people; Flares pulse subtly on the map like breathing to indicate they're active requests from real humans
- **Hierarchy of Movement**: 
  1. Critical alerts (new Mission Control message, Elder status earned) use gentle scale + glow
  2. Navigation transitions use slide with slight fade to maintain spatial context
  3. Micro-interactions (button press, input focus) use minimal 100ms easing
  4. Ambient elements (Campfire background glow, Lantern widget) use slow 3-4s loop animations

## Component Selection

- **Components**:
  - **Dialog**: Invite code verification modal, transfer confirmation, safety reports
  - **Card**: Flare detail cards, Vibe Card profile view, transaction history items
  - **Input**: Invite code field, profile creation, Flare descriptions, chat composition
  - **Button**: Primary for "I can help", "Post Flare"; Secondary for "Cancel"; Destructive for "Block User"
  - **Avatar**: User profile photos in chat and Vibe Cards
  - **Tabs**: Switch between Map View / List View for Flares; Campfire / Mission Control chats
  - **Badge**: Skill tags, reputation score display, Elder status indicator
  - **Progress**: Visual Lantern balance bar (3/10 display)
  - **Slider**: Slide-to-confirm for Lantern transfers
  - **ScrollArea**: Transaction history, chat message lists, Flare feed
  - **Select**: Category picker for Flare creation, neighborhood zone fallback
  - **Separator**: Between chat messages (time-based), transaction groups
  - **Switch**: GPS toggle in Flare creation, notification settings
  - **Toast**: Subtle notifications for background events (someone accepted your Flare, Lantern received)

- **Customizations**:
  - Custom Map Component: Using D3 or simple SVG overlay to show neighborhood with glowing pins for Flares
  - Lantern Balance Widget: Custom progress ring showing fill level with pulsing glow at capacity
  - Campfire Message Bubble: Custom component with fade-out effect based on message age
  - Vibe Card Component: Custom profile card with hexagon photo frame and reputation constellation

- **States**:
  - Buttons: Default has subtle inner shadow for depth; Hover adds slight glow; Active compresses with 95% scale; Disabled reduces opacity to 40%
  - Inputs: Default shows soft border; Focus shows amber ring glow; Error state shows muted red border with shake animation; Success shows brief green border flash
  - Cards: Default has subtle elevation; Hover on interactive cards lifts slightly (2px translate); Active state adds amber border
  - Map Pins: Default pulsing glow; Hover expands 110%; Selected shows full detail card anchored to pin

- **Icon Selection**:
  - Navigation: House (home/map), ChatCircle (Campfire), Wallet (Lanterns), UserCircle (profile)
  - Actions: Plus (create Flare), PaperPlaneRight (send message/Lantern), HandHeart (accept help), X (close/cancel)
  - Categories: Wrench (Mechanical), ForkKnife (Food), ChatsCircle (Talk), Lightbulb (Other)
  - Status: CheckCircle (completed), Clock (pending), Fire (urgent), Star (reputation)
  - Safety: ShieldWarning (report), Prohibit (block), SignOut (delete account)

- **Spacing**:
  - Container padding: 20px (mobile) / 32px (desktop)
  - Card internal padding: 16px
  - Stack spacing (vertical lists): 12px between items
  - Button padding: 12px vertical / 24px horizontal
  - Input padding: 10px vertical / 14px horizontal
  - Section separation: 32px between major sections
  - Grid gaps (skill tags, avatars): 8px

- **Mobile**:
  - Map view defaults to full screen on mobile with floating action button for "Create Flare"
  - Navigation uses fixed bottom tab bar (4 core tabs: Map, Campfire, Wallet, Profile)
  - Chat composition sticks to bottom with input growing up to 4 lines max before scrolling
  - Profile/Vibe Card stacks vertically with full-width photo at top
  - Transaction history uses full-width cards with left-aligned metadata
  - Flare detail slides up from bottom as drawer (80vh) rather than modal
  - Double-tap map to recenter on user location
  - Swipe right on Mission Control to dismiss back to Flare list
