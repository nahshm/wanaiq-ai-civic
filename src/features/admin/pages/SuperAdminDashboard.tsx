import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity, Users, Flag, Bot, Settings, Shield,
  Map, Brain, Server, ShieldAlert, Bell, AlertTriangle,
  FolderKanban, Trophy
} from 'lucide-react';
import { toast } from 'sonner';

import OverviewSection from './components/OverviewSection';
import PeopleSection from './components/PeopleSection';
import ContentSection from './components/ContentSection';
import GovernanceSection from './components/GovernanceSection';
import AICommandSection from './components/AICommandSection';
import PlatformSection from './components/PlatformSection';
import SystemSection from './components/SystemSection';
import AccountabilitySection from './components/AccountabilitySection';
import EngagementSection from './components/EngagementSection';

const sections = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'people', label: 'People', icon: Users },
  { id: 'content', label: 'Content', icon: Flag },
  { id: 'governance', label: 'Governance', icon: Map },
  { id: 'ai-command', label: 'AI Command', icon: Bot },
  { id: 'accountability', label: 'Accountability', icon: FolderKanban },
  { id: 'engagement', label: 'Engagement', icon: Trophy },
  { id: 'platform', label: 'Platform', icon: Settings },
  { id: 'system', label: 'System', icon: Server },
];

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedSection, setSelectedSection] = useState('overview');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) { navigate('/auth'); return; }
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error || !data?.some(r => r.role === 'super_admin' || r.role === 'admin')) {
        toast.error('Access denied. Super Admin privileges required.');
        navigate('/');
        return;
      }
      setIsSuperAdmin(true);
      setIsLoading(false);
    };
    checkAccess();
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <ShieldAlert className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Verifying Super Admin access...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  const renderSection = () => {
    switch (selectedSection) {
      case 'overview': return <OverviewSection />;
      case 'people': return <PeopleSection />;
      case 'content': return <ContentSection />;
      case 'governance': return <GovernanceSection />;
      case 'ai-command': return <AICommandSection />;
      case 'accountability': return <AccountabilitySection />;
      case 'engagement': return <EngagementSection />;
      case 'platform': return <PlatformSection />;
      case 'system': return <SystemSection />;
      default: return <OverviewSection />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-60 bg-sidebar-background border-r border-sidebar-border flex flex-col">
        <div className="p-5 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-destructive rounded-lg flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-destructive-foreground" />
            </div>
            <div>
              <div className="font-bold text-sm text-sidebar-foreground">Super Admin</div>
              <div className="text-xs text-sidebar-muted-foreground">God Mode</div>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <nav className="p-3 space-y-0.5">
            {sections.map(s => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSection(s.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left text-sm ${
                    selectedSection === s.id
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {s.label}
                </button>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-sidebar-border shrink-0">
          <div className="flex items-center gap-2 text-xs text-sidebar-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            All Systems Operational
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
          <h1 className="text-xl font-bold text-foreground">
            {sections.find(s => s.id === selectedSection)?.label}
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="relative">
              <Bell className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 max-w-7xl">
            {renderSection()}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
