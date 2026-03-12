import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Header } from '@/components/layout/Header';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const isCommunityPage = location.pathname.startsWith('/c/');
  const isCivicAssistant = location.pathname === '/civic-assistant';

  return (
    <div className="h-screen flex flex-col w-full bg-background overflow-hidden">
      <Header />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <AppSidebar />
        <SidebarInset className={cn(
          "flex-1 w-full h-full !min-h-0",
          (isCommunityPage || isCivicAssistant) ? "overflow-hidden" : "overflow-auto"
        )}>
          {isCivicAssistant ? (
            <div className="relative h-full min-h-0 w-full overflow-hidden">
              {children}
            </div>
          ) : (
            children
          )}
        </SidebarInset>
      </div>
    </div>
  );
};
