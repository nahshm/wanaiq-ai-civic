import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageTour } from '@/components/tour/PageTour';
import { DASHBOARD_TOUR_KEY, DASHBOARD_TOUR_STEPS } from '@/components/tour/DashboardTourSteps';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, FileText, Users, Target, BarChart3, GraduationCap, Shield,
  Phone, HelpCircle, Megaphone, Sword, AlertCircle, FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Dashboard components
import { CitizenIdentityPanel } from '@/components/dashboard/CitizenIdentityPanel';
import { QuickActionBar } from '@/components/dashboard/QuickActionBar';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { DashboardQuestWidget } from '@/components/dashboard/DashboardQuestWidget';
import { DashboardLeaderboardWidget } from '@/components/dashboard/DashboardLeaderboardWidget';
import { MyActions } from '@/components/dashboard/MyActions';
import { CommunityIssuesFeed } from '@/components/dashboard/CommunityIssuesFeed';
import { MyIssuesTab, MyProjectsTab, ModToolsTab } from '@/components/dashboard/PersonalActionTabs';

const CivicDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 pb-6">
      <PageTour tourKey={DASHBOARD_TOUR_KEY} steps={DASHBOARD_TOUR_STEPS} userId={user?.id} />
      {/* ========= 3-COLUMN CIVIC CONTROL ROOM ========= */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_280px] gap-4 lg:gap-5">

        {/* ─────── LEFT SIDEBAR: Citizen Identity ─────── */}
        <aside data-tour="tour-citizen-identity" className="hidden lg:block lg:sticky lg:top-16 lg:self-start space-y-4 order-2 lg:order-1">
          <CitizenIdentityPanel />

          {/* Civic Resources (compact) */}
          <Card className="border-border/60">
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-sm font-semibold">📚 Resources</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-1 space-y-1">
              {[
                { icon: Megaphone, label: 'Public Participation', to: '/participation', color: 'text-orange-400' },
                { icon: Phone, label: 'Govt. Contacts', to: '/contacts', color: 'text-blue-400' },
                { icon: GraduationCap, label: 'Civic Education', to: '/c/CivicEducation', color: 'text-purple-400' },
                { icon: HelpCircle, label: 'Help Center', to: '/help', color: 'text-green-400' },
                { icon: Shield, label: 'Privacy Policy', to: '/privacy', color: 'text-zinc-400' },
              ].map(({ icon: Icon, label, to, color }) => (
                <Button
                  key={label}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8 text-xs gap-2"
                  asChild
                >
                  <Link to={to}>
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                    {label}
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </aside>

        {/* ─────── CENTER: Main Content Area ─────── */}
        <main className="min-w-0 space-y-4 order-1 lg:order-2">
          {/* Quick Action Bar */}
          <div data-tour="tour-quick-actions"><QuickActionBar /></div>

          {/* Tabbed Content */}
          <Tabs data-tour="tour-dashboard-tabs" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full flex overflow-x-auto sm:grid sm:grid-cols-7 h-10 bg-muted/50 rounded-xl p-1 no-scrollbar">
              <TabsTrigger value="overview" className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="my-actions" className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Actions</span>
              </TabsTrigger>
              <TabsTrigger value="my-issues" className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <AlertCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Issues</span>
              </TabsTrigger>
              <TabsTrigger value="my-projects" className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <FolderOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Projects</span>
              </TabsTrigger>
              <TabsTrigger value="community" className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Community</span>
              </TabsTrigger>
              <TabsTrigger value="quests" className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Sword className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quests</span>
              </TabsTrigger>
              <TabsTrigger value="mod-tools" className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mod</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-4">
              <DashboardOverview />
            </TabsContent>

            {/* My Actions Tab */}
            <TabsContent value="my-actions" className="mt-4">
              <MyActions />
            </TabsContent>

            {/* My Issues Tab — civic actions reported by this user */}
            <TabsContent value="my-issues" className="mt-4">
              <MyIssuesTab />
            </TabsContent>

            {/* My Projects Tab — government projects created by this user */}
            <TabsContent value="my-projects" className="mt-4">
              <MyProjectsTab />
            </TabsContent>

            {/* Community Tab */}
            <TabsContent value="community" className="mt-4">
              <CommunityIssuesFeed />
            </TabsContent>

            {/* Quests Tab */}
            <TabsContent value="quests" className="mt-4">
              <DashboardQuestWidget fullView />
            </TabsContent>

            {/* Mod Tools Tab — for community admins/moderators */}
            <TabsContent value="mod-tools" className="mt-4">
              <ModToolsTab />
            </TabsContent>
          </Tabs>
        </main>


        {/* ─────── RIGHT SIDEBAR: Gamification & Social ─────── */}
        <aside data-tour="tour-quest-widget" className="space-y-4 order-3 hidden xl:block self-start lg:sticky lg:top-16">
          <DashboardQuestWidget />
          <DashboardLeaderboardWidget />
        </aside>
      </div>
    </div>
  );
};

export default CivicDashboard;
