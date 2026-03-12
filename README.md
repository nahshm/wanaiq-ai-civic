# WanaConnect Civic (ama/WanaIQ)

## 🇰🇪 Empowering Civic Engagement in Kenya

WanaConnect Civic is a comprehensive digital platform designed to strengthen civic engagement, government accountability, and community organizing in Kenya. By combining social networking, official tracking, and accountability tools, we're building a bridge between citizens and their government.

---

## 🌟 Key Features

### 🗳️ Governance & Accountability

- **Officials Tracker**: Search and monitor elected officials by level, party, and county
- **Promise Tracking**: Hold leaders accountable by tracking campaign promises and commitments
- **Project Monitoring**: Track government development projects from inception to completion
- **Position Claiming**: Officials can claim and verify their positions with proper documentation

### 💬 Community Engagement

- **Discussion Communities**: Reddit-style communities organized by location, interest, or topic
- **Threaded Discussions**: Rich text posts with media support, voting, and nested comments
- **County-Based Flairs**: Users represent their geographic identity (counties, constituencies, wards)
- **Community Moderation**: Comprehensive tools for community managers

### 📰 National Pulse Feed

- **Home Feed**: Curated content with Hot/New/Top/Rising sorting algorithms
- **Civic Clips**: Short-form video content for civic awareness
- **Rich Media**: Support for images, videos, and links in posts
- **Real-time Updates**: Live voting, comments, and engagement metrics

### 🎮 Gamification

- **Karma System**: Earn reputation points through quality contributions
- **Quests**: Complete civic engagement challenges
- **Badges**: Unlock achievements for civic participation
- **Leaderboards**: Recognize top contributors

### 🌍 Geographic Data Integration

- Complete hierarchy: 47 Counties → 290 Constituencies → 1,450 Wards
- Location-based content filtering
- Admin tools for managing geographic data

---

## 🛠️ Technology Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for fast builds and hot module replacement
- **React Router v6** for client-side routing
- **TanStack Query** for server state management
- **Tailwind CSS** for styling

### UI Components

- **shadcn/ui** - 48+ accessible component primitives
- **Radix UI** - Unstyled, accessible components
- **Lucide React** - Beautiful icon library
- **TipTap** - Rich text editor for posts

### Backend

- **Supabase** - PostgreSQL database with real-time capabilities
- **Supabase Auth** - JWT-based authentication
- **Supabase Storage** - Image and video uploads
- **Row Level Security** - Database-level access control

### Developer Tools

- **TypeScript** for type safety
- **ESLint** for code quality
- **Jest** for unit testing
- **Zod** for runtime validation

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- [nvm](https://github.com/nvm-sh/nvm) recommended for Node version management

### Installation

```bash
# Clone the repository
git clone <your-repository-url>
cd wana-connect-civic

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run type-check   # Run TypeScript compiler
npm run test         # Run Jest tests
npm run check        # Run lint + type-check
```

---

## 📁 Project Structure

```
src/
├── features/                 # Domain-driven feature modules
│   ├── governance/          # Officials, positions, verification
│   ├── community/           # Communities, chat, forums
│   ├── accountability/      # Projects, promises, reports
│   ├── feed/               # Posts, comments, clips
│   └── admin/              # Platform management
├── components/              # Shared UI components
│   ├── ui/                 # shadcn/ui primitives
│   ├── layout/             # AppLayout, Header, Sidebar
│   ├── posts/              # PostCard, CommentSection
│   └── video/              # VideoPlayer, CivicClipCard
├── hooks/                   # Custom React hooks
├── contexts/                # React Context providers
├── lib/                     # Utilities and helpers
└── types/                   # TypeScript type definitions
```

See [`PROJECT_STRUCTURE.md`](./PROJECT_STRUCTURE.md) for detailed architecture documentation.

---

## 🗺️ Routing

| Route                | Feature           | Description                      |
| -------------------- | ----------------- | -------------------------------- |
| `/`                  | Home Feed         | National pulse with all posts    |
| `/c/:slug`           | Community         | Community-specific feed and chat |
| `/g/:slug`           | Official Profile  | Elected official details         |
| `/p/:slug`           | Post Detail       | Individual post with comments    |
| `/officials`         | Officials Tracker | Browse all officials             |
| `/projects`          | Projects          | Development project monitoring   |
| `/communities`       | Communities       | Discover and join communities    |
| `/profile/:username` | User Profile      | User posts and activity          |
| `/onboarding`        | Onboarding        | New user location setup          |
| `/admin/*`           | Admin Dashboard   | Platform management              |

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these credentials from your [Supabase project dashboard](https://app.supabase.com).

---

## 🚢 Deployment

### Netlify (Recommended)

```bash
# Build the project
npm run build

# Deploy to Netlify
# The netlify.toml file is already configured
```

The platform includes:

- SPA routing configuration
- Environment variable templates
- Build optimization settings

### Other Platforms

The built `dist/` folder can be deployed to:

- Vercel
- Cloudflare Pages
- GitHub Pages
- Any static hosting service

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

---

## 📊 Current Status

**Completion:** ~92% | **Production Readiness:** ~85%

> _Updated via deep-dive code audit (March 2026). Every feature below was verified by reading actual source files and confirming real Supabase integration — not directory listings._

### ✅ Fully Implemented

#### Authentication & User Management
- Sign-in / sign-up with Zod schema validation and react-hook-form (`Auth.tsx` — 361 lines)
- Password reset flow with strength indicator (`ResetPassword.tsx` — 168 lines)
- Forgot-password dialog, email verification, rate-limit handling
- Role-based access control (citizen, admin, super_admin via `user_roles` table)

#### User Profiles (`Profile.tsx` — 1 333 lines)
- Full view/edit with avatar and banner image upload
- 8 tabs: Overview, Posts, Comments, Saved, History, Hidden, Upvoted, Downvoted
- Privacy-aware field selection (own profile vs. others)
- Badge showcase, verified badges, official position badges

#### Onboarding (5 files — `OnboardingFlow`, `Step1–4`, `WelcomeDashboard`)
- 4-step wizard: Location → Interests → Persona → Communities
- Progress recovery via `useOnboardingRecovery` hook
- Error boundary wrapper

#### Home Feed (`Home.tsx` — 375 lines)
- Unified feed via Supabase RPC (`get_unified_feed`) with infinite scroll
- Hot / New / Top / Rising sort modes
- Communities sidebar, live Baraza spaces (feature-flagged)

#### Post System (4 pages, 1 625 lines total)
- `CreatePost` — rich-text editor, media uploads, civic-clip auto-creation for videos
- `PostDetail` — nested comments, voting, awards, save/hide, verification badges
- `EditPost` — pre-filled form with author authorization check
- `CivicClips` — full-screen swipeable video feed with category & hashtag filters

#### Communities (3 pages, 605 lines total)
- Listing with My Communities / Explore tabs and follow/unfollow
- Discord-style channel interface with geographic level selector (County → Constituency → Ward)
- Chat system: direct messages, group chat, mod_mail

#### Governance & Officials
- Officials tracker with search, filter by level/party/county, and sentiment analysis
- Position claiming with proof-document upload and admin verification workflow
- Election tracking and official performance visualization

#### Accountability (4 pages, 2 317 lines total)
- `Projects` — search with debounce, multi-filter (category, status, county), React Query pagination
- `ProjectDetail` — media carousel, timeline, issue reporting, verification, document downloads
- `SubmitProject` — multi-step form with geographic hierarchy auto-fill and collaborator management
- `DiscoveryDashboard` — broken promises, delayed projects, top/bottom performer rankings

#### Search (`SearchResults.tsx` — 373 lines + `useSearch.ts` — 158 lines)
- Full-text search across 7 entity types: posts, comments, users, communities, officials, promises, projects
- Sort by relevance / date / votes with tab-based type filtering

#### Gamification
- `Quests` (313 lines) — browse, start, continue quests with evidence submission and progress bars
- `Leaderboards` (258 lines) — period (all-time / monthly / weekly) and location (national / county / constituency / ward) filters
- Karma system tracked on profiles (post_karma, comment_karma)
- Badge showcase component integrated into profiles

#### Super Admin Dashboard (`SuperAdminDashboard.tsx` — 2 590 lines)
- 18 fully functional tabs: Overview, User Management, Anonymous Reports, Crisis Management, NGO Partners, Moderator Oversight, Officials, Position Verification, Geographic Data, Government Institutions, Agent Queue, Agent Control Center, AI Insights, Feature Flags, Security, Analytics, Performance Monitoring, System Health
- All tabs backed by real Supabase queries with role-based access (super_admin / admin)
- Grok AI Assistant chat panel

#### Feature Flags (`FeatureFlagsManager.tsx` — 183 lines)
- Full CRUD via React Query mutations, grouped by category, instant toggle

#### Geographic Data Admin
- Counties / Constituencies / Wards CRUD with multi-country support (KE, US, NG, GB, ZA)

#### Settings (`Settings.tsx` — 207 lines)
- Profile editing tab (functional with Supabase update)
- Privacy settings tab (full `PrivacySettings` component)

#### Dark Mode & Theming
- `ThemeProvider` + `ThemeToggle` components
- Theme-aware CSS variables used across all components

#### Responsive Design
- Mobile-first layouts throughout (sm/md/lg breakpoints in Tailwind)
- Collapsible sidebars, responsive grids, mobile menus

### 🚧 In Progress / Placeholder

| Feature | Status | Notes |
|---|---|---|
| Notification settings | Placeholder | Settings tab shows "coming soon" |
| Appearance settings | Placeholder | Settings tab shows "coming soon" |
| Email notifications | Not started | No email dispatch implementation found |
| In-app notification center | Partial | Bell icon exists in admin; no standalone notification feed |
| Governance Templates Review | Pending | Admin tab reads "Feature coming pending GovernanceBuilder" |

### 📈 Summary

| Area | Completion |
|---|---|
| Authentication & Profiles | 100% |
| Feed & Posts | 100% |
| Communities & Chat | 100% |
| Governance & Officials | 100% |
| Accountability & Projects | 100% |
| Search | 100% |
| Gamification (Quests, Leaderboards) | 100% |
| Admin Dashboard & Moderation | 100% |
| Feature Flags & Geographic Admin | 100% |
| Dark Mode & Responsive Design | 100% |
| Onboarding | 100% |
| Settings (Profile & Privacy) | 100% |
| Notifications | ~15% |
| Appearance Customization | ~10% |

See [`MILESTONE_SCORECARD.md`](./MILESTONE_SCORECARD.md) for detailed progress tracking.

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Quality Standards

- Run `npm run check` before committing
- Write tests for new features
- Follow existing code style and patterns
- Update documentation as needed

---

## 📖 Documentation

- [Project Structure](./PROJECT_STRUCTURE.md) - Detailed architecture overview
- [Milestone Scorecard](./MILESTONE_SCORECARD.md) - Development progress tracking
- [Feature Toggles](./FEATURE_TOGGLES.md) - Feature flag management

---

## 🔧 Troubleshooting

### Common Issues

**Build Errors**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Supabase Connection Issues**

- Verify your `.env` file has correct credentials
- Check Supabase project status at [app.supabase.com](https://app.supabase.com)
- Ensure RLS policies are configured correctly

**TypeScript Errors**

```bash
# Regenerate types from Supabase schema
npm run type-check
```

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🙏 Acknowledgments

Built with modern open-source technologies:

- React team for the amazing framework
- Supabase for the backend infrastructure
- shadcn for the beautiful UI components
- The entire open-source community

---

## 📧 Contact

For questions, feedback, or support:

- **Project**: WanaConnect Civic
- **Platform**: Civic Engagement & Accountability
- **Focus**: Kenya

---

**Made with ❤️ for Kenya**
