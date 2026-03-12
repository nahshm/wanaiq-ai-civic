import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Suspense, lazy } from "react";

//  CODE SPLITTING: Lazy load all route components to reduce initial bundle from 928KB to ~300KB
const PrefixRouter = lazy(() => import("@/components/routing/PrefixRouter"));

// LAZY LOADED: Feature-based imports - Feed
const Index = lazy(() => import("@/features/feed/pages/Home"));
const CreatePost = lazy(() => import("@/features/feed/pages/CreatePost"));
const EditPost = lazy(() => import("@/features/feed/pages/EditPost"));
const PostDetail = lazy(() => import("@/features/feed/pages/PostDetail"));

// LAZY LOADED: Governance pages
const Officials = lazy(() => import("@/features/governance/pages/Officials"));
const OfficialDetail = lazy(() => import("@/features/governance/pages/OfficialDetail"));
const ClaimPositionPage = lazy(() => import("@/features/governance/pages/ClaimPosition"));
const BuildGovernancePage = lazy(() => import("@/features/governance/pages/BuildGovernance"));
// NEW: Position-first Office civic hub (unclaimed + claimed)
const OfficeHubPage = lazy(() => import("@/features/governance/pages/OfficeHubPage"));
// NEW: Institution page (unclaimed + claimed handler)
const InstitutionPage = lazy(() => import("@/features/governance/pages/InstitutionPage"));

// LAZY LOADED: Accountability pages
const Projects = lazy(() => import("@/features/accountability/pages/Projects"));
const ProjectDetail = lazy(() => import("@/features/accountability/pages/ProjectDetail"));
const SubmitProject = lazy(() => import("@/features/accountability/pages/SubmitProject"));
const PromiseDetail = lazy(() => import("@/features/accountability/pages/PromiseDetail"));
const ReportIssue = lazy(() => import("@/features/accountability/pages/ReportIssue"));
const ActionDetail = lazy(() => import("@/features/accountability/pages/ActionDetail"));

// LAZY LOADED: Community pages
const Communities = lazy(() => import("@/features/community/pages/Communities"));
const Community = lazy(() => import("@/features/community/pages/Community"));
const Chat = lazy(() => import("@/features/community/pages/Chat"));
const MyCommunitiesPage = lazy(() => import("@/features/community/pages/MyCommunitiesPage").then(m => ({ default: m.MyCommunitiesPage })));
const ExplorePlatform = lazy(() => import("@/pages/ExplorePlatform"));

// LAZY LOADED: AI Features
const CivicChat = lazy(() => import("@/components/civic-assistant/CivicChat").then(m => ({ default: m.CivicChat })));

// LAZY LOADED: Misc
const CivicClipsPage = lazy(() => import("@/features/feed/pages/CivicClips").then(m => ({ default: m.CivicClipsPage })));

// LAZY LOADED: Components that were previously eager
const AppLayout = lazy(() => import("@/components/layout/AppLayout").then(m => ({ default: m.AppLayout })));

// LAZY LOADED: Admin pages
const GeographicDataAdmin = lazy(() => import("@/features/admin/pages/GeographicDataAdmin"));
// LAZY LOADED: Admin
const FeatureFlagsManager = lazy(() => import("@/features/admin/pages/FeatureFlagsManager"));
const PositionVerification = lazy(() => import("@/features/admin/pages/PositionVerification").then(m => ({ default: m.PositionVerification })));
const SuperAdminDashboard = lazy(() => import("@/features/admin/pages/SuperAdminDashboard"));

// LAZY LOADED: Profile — CivicResumePage is the single canonical identity page
const CivicResumePage = lazy(() => import("@/features/profile/pages/CivicResumePage"));

// LAZY LOADED: Legacy pages
const SettingsPage = lazy(() => import("./pages/Settings"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const OnboardingFlow = lazy(() => import("./pages/Onboarding/OnboardingFlow"));
const ProfileSetup = lazy(() => import("@/components/onboarding/ProfileSetup").then(m => ({ default: m.ProfileSetup })));
const CivicDashboard = lazy(() => import("./pages/Dashboard/CivicDashboard"));
const Analytics = lazy(() => import("./pages/Dashboard/Analytics"));
const SearchResults = lazy(() => import("./pages/SearchResults").then(m => ({ default: m.SearchResults })));
const GlobalChat = lazy(() => import("./pages/GlobalChat"));
const Quests = lazy(() => import("./pages/Quests"));
const Leaderboards = lazy(() => import("./pages/Leaderboards"));
const DiscoveryDashboard = lazy(() => import("./pages/DiscoveryDashboard"));
import { OnboardingGuard } from "@/components/routing/OnboardingGuard";

const queryClient = new QueryClient();

// Loading fallback  component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
      <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="wanaiq-ui-theme">
      <AuthProvider>
        <AuthModalProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AuthModal />
            <SidebarProvider defaultOpen={window.innerWidth >= 1280} className="!min-h-0">
            <BrowserRouter>
              <OnboardingGuard>
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/onboarding" element={<OnboardingFlow />} />
                    <Route path="/civic-clips" element={<CivicClipsPage />} />
                    <Route path="/*" element={
                      <AppLayout>
                        <Suspense fallback={<LoadingFallback />}>
                          <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/dashboard" element={<CivicDashboard />} />
                            <Route path="/dashboard/report" element={<ReportIssue />} />
                            <Route path="/report-an-issue" element={<ReportIssue />} />
                            <Route path="/dashboard/actions/:id" element={<ActionDetail />} />
                            <Route path="/dashboard/analytics" element={<Analytics />} />
                            <Route path="/create" element={<CreatePost />} />
                            <Route path="/submit" element={<CreatePost />} />
                            <Route path="/post/:id" element={<PostDetail />} />
                            <Route path="/edit-post/:id" element={<EditPost />} />
                            <Route path="/c/:communityName/post/:id" element={<PostDetail />} />
                            <Route path="/c/:communityName" element={<Community />} />
                            <Route path="/community/:communityName" element={<Community />} />
                            <Route path="/communities" element={<Communities />} />
                            <Route path="/my-communities" element={<MyCommunitiesPage />} />
                            <Route path="/officials" element={<Officials />} />
                            <Route path="/officials/:officialId" element={<OfficialDetail />} />
                            <Route path="/projects" element={<Projects />} />
                            <Route path="/projects/submit" element={<SubmitProject />} />
                            <Route path="/claim-position" element={<ClaimPositionPage />} />
                            <Route path="/governance/build" element={<BuildGovernancePage />} />
                            <Route path="/projects/:projectId" element={<ProjectDetail />} />
                            <Route path="/promises/:promiseId" element={<PromiseDetail />} />
                            <Route path="/discover" element={<DiscoveryDashboard />} />
                            <Route path="/explore" element={<ExplorePlatform />} />

                            {/* Position-first Office civic hub — accessible even for unclaimed offices */}
                            <Route path="/office/:country/:level/:jurisdiction/:role" element={<OfficeHubPage />} />
                            {/* Institution page — accessible even without a claimed handler */}
                            <Route path="/institution/:slug" element={<InstitutionPage />} />

                            {/* Profile Routes — /resume/:username is canonical; /u/, /w/, /g/ via PrefixRouter */}
                            <Route path="/resume/:username" element={<CivicResumePage />} />

                            {/* Admin Routes */}
                            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                            <Route path="/admin/dashboard" element={<SuperAdminDashboard />} />
                            <Route path="/admin/verification" element={<PositionVerification />} />
                            <Route path="/admin/geographic-data" element={<GeographicDataAdmin />} />
                            <Route path="/admin/feature-flags" element={<FeatureFlagsManager />} />

                            {/* Feature flags - keep existing structure */}
                            <Route path="/quests" element={<Quests />} />
                            <Route path="/leaderboards" element={<Leaderboards />} />
                            <Route path="/search" element={<SearchResults />} />
                            <Route path="/chat" element={<GlobalChat />} />
                            <Route path="/civic-assistant" element={<CivicChat />} />
                            <Route path="/profile/setup" element={<ProfileSetup />} />
                            <Route path="/settings" element={<SettingsPage />} />

                            {/* Functional prefix routes - handled by PrefixRouter */}
                            <Route path="/u/*" element={<PrefixRouter />} />
                            <Route path="/w/*" element={<PrefixRouter />} />
                            <Route path="/g/*" element={<PrefixRouter />} />
                            <Route path="/p/*" element={<PrefixRouter />} />
                            <Route path="/pr/*" element={<PrefixRouter />} />
                            {/* Catch all */}
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </Suspense>
                      </AppLayout>
                    } />
                  </Routes>
                </Suspense>
              </OnboardingGuard>
            </BrowserRouter>
            </SidebarProvider>
          </TooltipProvider>
        </AuthModalProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
