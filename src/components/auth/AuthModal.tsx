import { useState, useEffect } from 'react';
import { X, Mail, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export const AuthModal = () => {
  const { isOpen, mode, close } = useAuthModal();
  const { signIn, signUp, signInWithGoogle, signInWithApple, signInWithGithub, sendMagicLink } = useAuth();
  
  const [isSignup, setIsSignup] = useState(mode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'main' | 'magic-link'>('main');
  const [enabledProviders, setEnabledProviders] = useState<{ google: boolean; apple: boolean; github: boolean }>({ google: false, apple: false, github: false });

  // Check which OAuth providers are enabled
  useEffect(() => {
    const checkProviders = async () => {
      try {
        // Try to get auth settings from Supabase
        // Note: This requires the auth.providers endpoint to be accessible
        const { data, error } = await supabase.auth.getSession();
        
        // For now, we'll use environment variables as a fallback
        // You can configure these in your .env file
        const googleEnabled = import.meta.env.VITE_SUPABASE_GOOGLE_ENABLED === 'true';
        const appleEnabled = import.meta.env.VITE_SUPABASE_APPLE_ENABLED === 'true';
        const githubEnabled = import.meta.env.VITE_SUPABASE_GITHUB_ENABLED === 'true';

        setEnabledProviders({
          google: googleEnabled,
          apple: appleEnabled,
          github: githubEnabled
        });
      } catch (error) {
        console.error('Error checking OAuth providers:', error);
        // Default to showing all providers if check fails
        setEnabledProviders({ google: true, apple: true, github: true });
      }
    };

    checkProviders();
  }, []);

  // Reset state when modal closes or mode changes
  const handleModalChange = (open: boolean) => {
    if (!open) {
      close();
      setEmail('');
      setPassword('');
      setUsername('');
      setView('main');
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'apple' | 'github') => {
    setLoading(true);
    try {
      const signInMethod = provider === 'google' ? signInWithGoogle : provider === 'apple' ? signInWithApple : signInWithGithub;
      const { error } = await signInMethod();
      if (!error) {
        close();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const { error } = await sendMagicLink(email);
      if (!error) {
        close();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      if (isSignup) {
        const { error } = await signUp(email, password, username);
        if (!error) {
          close();
        }
      } else {
        const { error } = await signIn(email, password);
        if (!error) {
          close();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalChange}>
      <DialogContent className="sm:max-w-md bg-background border border-border p-0 gap-0 overflow-hidden">
        {/* Close button */}
        <button
          onClick={() => close()}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </button>

        <div className="p-8 space-y-6">
          {view === 'main' ? (
            <>
              {/*  Header */}
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-center">
                  {isSignup ? 'Sign Up' : 'Log In'}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground text-center mt-2">
                  By continuing, you agree to our{' '}
                  <a href="/terms" className="text-primary hover:underline">User Agreement</a>
                  {' '}and acknowledge that you understand the{' '}
                  <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
                </DialogDescription>
              </DialogHeader>

              {/* OAuth Buttons */}
              <div className="space-y-3">
                {enabledProviders.google && (
                  <Button
                    onClick={() => handleOAuthSignIn('google')}
                    disabled={loading}
                    className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 font-medium h-12"
                    variant="outline"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </Button>
                )}

                {enabledProviders.apple && (
                  <Button
                    onClick={() => handleOAuthSignIn('apple')}
                    disabled={loading}
                    className="w-full bg-black hover:bg-gray-900 text-white font-medium h-12"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    Continue With Apple
                  </Button>
                )}

                {enabledProviders.github && (
                  <Button
                    onClick={() => handleOAuthSignIn('github')}
                    disabled={loading}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium h-12"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                    Continue with GitHub
                  </Button>
                )}

                <Button
                  onClick={() => setView('magic-link')}
                  disabled={loading}
                  className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 font-medium h-12"
                  variant="outline"
                >
                  <LinkIcon className="w-5 h-5 mr-2" />
                  Email me a one-time link
                </Button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">OR</span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="sr-only">Email or username</label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email or username *"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 bg-muted/50"
                  />
                </div>

                {isSignup && (
                  <div>
                    <label htmlFor="username" className="sr-only">Username</label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={loading}
                      className="h-12 bg-muted/50"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="password" className="sr-only">Password</label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password *"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 bg-muted/50"
                  />
                </div>

                {!isSignup && (
                  <div className="text-left">
                    <a href="/auth/reset-password" className="text-sm text-primary hover:underline">
                      Forgot password?
                    </a>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="w-full h-12 text-base font-bold"
                >
                  {loading ? 'Loading...' : isSignup ? 'Sign Up' : 'Log In'}
                </Button>

                <div className="text-center text-sm">
                  {isSignup ? (
                    <p>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setIsSignup(false)}
                        className="text-primary hover:underline font-medium"
                      >
                        Log In
                      </button>
                    </p>
                  ) : (
                    <p>
                      New to ama?{' '}
                      <button
                        type="button"
                        onClick={() => setIsSignup(true)}
                        className="text-primary hover:underline font-medium"
                      >
                        Sign Up
                      </button>
                    </p>
                  )}
                </div>
              </form>
            </>
          ) : (
            <>
              {/* Magic Link View */}
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-center">
                  Get your login link
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground text-center mt-2">
                  We'll email you a magic link for a password-free sign in.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
                <div>
                  <label htmlFor="magic-email" className="sr-only">Email</label>
                  <Input
                    id="magic-email"
                    type="email"
                    placeholder="Enter your email *"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 bg-muted/50"
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full h-12 text-base font-bold"
                >
                  {loading ? 'Sending...' : 'Send Link'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setView('main')}
                  disabled={loading}
                  className="w-full"
                >
                  Back to other options
                </Button>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
