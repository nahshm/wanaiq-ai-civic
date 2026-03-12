# WanaConnect Civic - Project Structure

## Feature-Based Architecture

```
src/
├── features/                     # Domain-driven feature modules
│   ├── governance/               # "Who is who" - Identity Layer
│   │   ├── pages/
│   │   │   ├── Officials.tsx         # Officials listing page
│   │   │   ├── OfficialDetail.tsx    # Official profile detail
│   │   │   ├── ClaimPosition.tsx     # Position claiming flow
│   │   │   └── BuildGovernance.tsx   # Governance building tools
│   │   ├── components/
│   │   │   ├── ClaimPositionModal.tsx
│   │   │   ├── LeadersGrid.tsx
│   │   │   ├── VerificationPanel.tsx
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   └── useOfficials.ts
│   │   ├── types/
│   │   │   └── governance.ts
│   │   └── index.ts
│   │
│   ├── community/                # "Mini-Discord" - Community Engine
│   │   ├── pages/
│   │   │   ├── Community.tsx         # Community hub page
│   │   │   ├── Communities.tsx       # Community discovery
│   │   │   └── Chat.tsx              # Chat interface
│   │   ├── components/
│   │   │   ├── CommunitySidebar.tsx
│   │   │   ├── CommunityHeader.tsx
│   │   │   ├── ChannelList.tsx
│   │   │   ├── ChannelChatWindow.tsx
│   │   │   ├── ForumChannel.tsx
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   └── useCommunity.ts
│   │   └── index.ts
│   │
│   ├── accountability/           # "Receipts" Engine - Projects & Promises
│   │   ├── pages/
│   │   │   ├── Projects.tsx          # Projects listing
│   │   │   ├── ProjectDetail.tsx     # Project detail view
│   │   │   ├── SubmitProject.tsx     # Create new project
│   │   │   ├── PromiseDetail.tsx     # Promise tracking
│   │   │   ├── ReportIssue.tsx       # Issue reporting
│   │   │   └── ActionDetail.tsx      # Action item detail
│   │   ├── components/
│   │   │   ├── ProjectsGrid.tsx
│   │   │   ├── PromisesGrid.tsx
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   └── useProjects.ts
│   │   └── index.ts
│   │
│   ├── feed/                     # "National Pulse" - Content Feed
│   │   ├── pages/
│   │   │   ├── Home.tsx              # Home feed (Index)
│   │   │   ├── PostDetail.tsx        # Post detail view
│   │   │   ├── CreatePost.tsx        # Create new post
│   │   │   ├── EditPost.tsx          # Edit existing post
│   │   │   └── CivicClips.tsx        # Video clips feed
│   │   ├── components/
│   │   │   ├── PostCard.tsx
│   │   │   ├── CommentSection.tsx
│   │   │   ├── VideoPlayer.tsx
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   └── useFeed.ts
│   │   └── index.ts
│   │
│   └── admin/                    # Platform Control
│       ├── pages/
│       │   ├── SuperAdminDashboard.tsx
│       │   ├── GeographicDataAdmin.tsx
│       │   └── PositionVerification.tsx
│       ├── components/
│       │   └── ...
│       └── index.ts
│
├── shared/                       # Cross-cutting utilities
│   └── index.ts
│
├── components/                   # Shared components
│   ├── ui/                       # shadcn/ui components (48+)
│   ├── layout/                   # AppLayout, Header, Sidebar
│   ├── community/                # Legacy community components
│   ├── chat/                     # ChannelChatWindow
│   ├── posts/                    # PostCard, CommentSection
│   ├── video/                    # VideoPlayer, CivicClipCard
│   ├── routing/                  # PrefixRouter, OnboardingGuard
│   └── providers/                # ThemeProvider, etc.
│
├── hooks/                        # Global hooks
│   ├── useAuth.ts
│   ├── use-mobile.tsx
│   └── ...
│
├── contexts/                     # React contexts
│   └── AuthContext.tsx
│
├── lib/                          # Utilities
│   ├── supabase.ts
│   └── utils.ts
│
├── types/                        # TypeScript types
│   ├── database.types.ts
│   └── ...
│
├── pages/                        # Legacy pages (to be migrated)
│   ├── Auth.tsx
│   ├── Profile.tsx
│   ├── Settings.tsx
│   ├── NotFound.tsx
│   ├── SearchResults.tsx
│   ├── Quests.tsx
│   ├── Leaderboards.tsx
│   ├── DiscoveryDashboard.tsx
│   ├── Onboarding/
│   └── Dashboard/
│
└── App.tsx                       # Root component with routes
```

## Domain Responsibilities

| Domain | Purpose | Key Entities |
|--------|---------|--------------|
| **governance** | Identity verification, official profiles | Officials, Positions, Verification |
| **community** | Discord-style chat, channels, forums | Communities, Channels, Messages |
| **accountability** | Project tracking, promises, reports | Projects, Promises, Actions |
| **feed** | Social content, posts, videos | Posts, Comments, Clips |
| **admin** | Platform management | Dashboard, Settings |

## Routing

```
/                    → feed/Home
/c/:slug             → community/Community (PrefixRouter)
/g/:slug             → governance/OfficialDetail (PrefixRouter)
/p/:slug             → feed/PostDetail (PrefixRouter)
/officials           → governance/Officials
/projects            → accountability/Projects
/communities         → community/Communities
/admin/*             → admin/*
```

## Path Aliases (vite.config.ts)

```typescript
{
  "@": "./src",
  "@features": "./src/features",
  "@shared": "./src/shared"
}
```
