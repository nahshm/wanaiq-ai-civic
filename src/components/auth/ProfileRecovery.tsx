import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertCircle, ChevronDown, LogOut, UserPlus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ProfileRecovery = () => {
  const { user, createMissingProfile, signOut } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleCreateProfile = async () => {
    setIsCreating(true);
    setError(null);

    const { error } = await createMissingProfile();

    if (error) {
      setError(error.message || 'Failed to create profile. Please try again.');
      setIsCreating(false);
    }
    // If successful, AuthContext will update and this component will unmount
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning/20">
            <AlertCircle className="h-6 w-6 text-warning" />
          </div>
          <CardTitle className="text-xl">Profile Setup Required</CardTitle>
          <CardDescription className="text-base">
            We couldn't find your profile. This can happen if something went wrong during signup.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleCreateProfile}
              disabled={isCreating}
              className="w-full"
              size="lg"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create My Profile
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleSignOut}
              disabled={isCreating}
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>

          <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-foreground"
              >
                <span>Technical details (for support)</span>
                <ChevronDown
                  className={cn(
                    'ml-2 h-4 w-4 transition-transform',
                    isDetailsOpen && 'rotate-180'
                  )}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="rounded-lg bg-muted p-3 text-xs font-mono text-muted-foreground">
                <p>User ID: {user?.id}</p>
                <p>Email: {user?.email}</p>
                <p>Created: {user?.created_at ? new Date(user.created_at).toLocaleString() : 'Unknown'}</p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  );
};
