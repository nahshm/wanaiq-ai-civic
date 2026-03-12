import { Button } from '@/components/ui/button';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { SearchBar } from '@/components/layout/SearchBar';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Bell, User, Plus, LogOut, Users, MessageCircle, Search, Menu } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { buildProfileLink } from '@/lib/profile-links';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { CreateCommunityWizard } from '@/components/community/CreateCommunityWizard';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

/**
 * Determines the appropriate URL prefix for a user's profile
 * @param profile - User profile object
 * @returns The prefix string ('/u/', '/g/', or '/w/')
 */
const getProfilePrefix = (profile: any): string => {
  // Government officials get /g/ prefix
  if (profile?.official_position || profile?.official_position_id) {
    return '/g/';
  }

  // Verified non-government users get /w/ prefix
  if (profile?.is_verified) {
    return '/w/';
  }

  // Regular users get /u/ prefix
  return '/u/';
};

export const Header = () => {
  const {
    user,
    profile,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const authModal = useAuthModal();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const {
    toggleSidebar
  } = useSidebar();
  const handleSignOut = async () => {
    await signOut();
  };

  // Generate the correct profile URL with prefix
  const profileUrl = profile?.username
    ? `${getProfilePrefix(profile)}${profile.username}`
    : buildProfileLink({ username: profile?.username ?? '' });

  return <header className="sticky top-0 z-10 w-full border-b bg-sidebar-background/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar-background/60">
    <div className="w-full h-14 sm:h-16 flex items-center justify-between gap-2 sm:px-[16px] px-[12px]">
      {/* Mobile Hamburger Menu */}
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden hover:bg-sidebar-accent text-sidebar-foreground -ml-2 h-9 w-9">
        <Menu className="h-5 w-5" />
      </Button>

      {/* Logo + Wordmark - explicit dimensions prevent CLS */}
      <Link to="/" className="flex-shrink-0 flex items-center gap-2">
        <img 
          src="/wanaiq-logo.png"
          alt="ama Logo"
          className="h-8 w-auto"
          fetchPriority="high"
        />
        <span className="text-xl font-semibold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
          ama
        </span>
      </Link>

      {/* Centered Search */}
      <div className="hidden md:flex flex-1 max-w-2xl">
        <SearchBar placeholder="Search discussions, communities, users..." className="w-full bg-sidebar-background border-sidebar-border focus-within:border-sidebar-ring" onSearch={(query) => {
          console.log('Search:', query);
          navigate(`/search?q=${encodeURIComponent(query)}`);
        }} />
      </div>

      {/* Mobile Search Button */}
      <Button variant="ghost" size="icon" className="md:hidden hover:bg-sidebar-accent text-sidebar-foreground" onClick={() => setMobileSearchOpen(true)}>
        <Search className="w-4 h-4" />
      </Button>

      {/* Right side actions */}
      <div className="flex items-center space-x-0.5 sm:space-x-1">
        {user ? <>
          <Button variant="ghost" size="sm" asChild className="hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors font-medium h-8 sm:h-9">
            <Link to="/create" className="flex items-center">
              <Plus className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Create</span>
            </Link>
          </Button>

          <Button variant="ghost" size="icon" asChild className="hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors h-8 w-8 sm:h-9 sm:w-9">
            <Link to="/chat">
              <MessageCircle className="w-4 h-4" />
            </Link>
          </Button>

          <Button variant="ghost" size="icon" className="hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors h-8 w-8 sm:h-9 sm:w-9">
            <Bell className="w-4 h-4" />
          </Button>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors h-8 w-8 sm:h-9 sm:w-9">
                <User className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setWizardOpen(true)}>
                <Users className="mr-2 h-4 w-4" />
                Create Community
              </DropdownMenuItem>                  <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={profileUrl}>Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </> : <>
          <ThemeToggle />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => authModal.open('login')}
            className="hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors font-medium"
          >
            Sign In
          </Button>
        </>}
      </div>
    </div>

    {/* Mobile Search Dialog */}
    <Dialog open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
          <DialogDescription className="sr-only">
            Search for discussions, communities, and users
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <SearchBar placeholder="Search discussions, communities, users..." className="w-full" onSearch={(query) => {
            console.log('Search:', query);
            navigate(`/search?q=${encodeURIComponent(query)}`);
            setMobileSearchOpen(false);
          }} />
        </div>
      </DialogContent>
    </Dialog>

    {/* Create Community Wizard */}
    <CreateCommunityWizard isOpen={wizardOpen} onClose={() => setWizardOpen(false)} />
  </header>;
};