import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { UserProfile } from '@/types/index';

interface Profile extends UserProfile { }

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  profileMissing: boolean;
  loading: boolean;
  signUp: (email: string, password: string, username?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithApple: () => Promise<{ error: any }>;
  signInWithGithub: () => Promise<{ error: any }>;
  sendMagicLink: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  createMissingProfile: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileMissing, setProfileMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer profile fetch with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setProfileMissing(false);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        if (import.meta.env.DEV) {
          console.error('Error fetching profile:', error);
        }
        setProfileMissing(true);
        return;
      }

      if (!data) {
        if (import.meta.env.DEV) {
          console.warn('Profile not found for user:', userId);
        }
        setProfileMissing(true);
        return;
      }

      setProfileMissing(false);

      // Convert snake_case to camelCase
      const profileData: Profile = {
        id: data.id,
        username: data.username,
        displayName: data.display_name,
        avatar: data.avatar_url,
        bio: data.bio,
        role: data.role as any,
        isVerified: data.is_verified,
        createdAt: new Date(data.created_at),
        karma: data.karma,
        postKarma: data.post_karma,
        commentKarma: data.comment_karma,
        badges: data.badges || [],
        location: data.location,

        // Geographic location fields for community navigation
        county: data.county,
        constituency: data.constituency,
        ward: data.ward,

        website: data.website,
        socialLinks: data.social_links as any,
        expertise: data.expertise || [],
        isPrivate: data.is_private,
        privacySettings: data.privacy_settings as any,
        activityStats: data.activity_stats as any,
        lastActivity: data.last_activity ? new Date(data.last_activity) : undefined,
        onboardingCompleted: data.onboarding_completed
      };

      setProfile(profileData);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching profile:', error);
      }
      setProfileMissing(true);
    }
  };

  const createMissingProfile = async () => {
    if (!user) return { error: { message: 'No user found' } };

    try {
      const username = user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`;
      const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || username;

      const { error } = await supabase.from('profiles').insert({
        id: user.id,
        username,
        display_name: displayName,
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        if (import.meta.env.DEV) {
          console.error('Error creating profile:', error);
        }
        return { error };
      }

      // Refetch profile to update state
      await fetchProfile(user.id);
      
      toast({
        title: "Profile created!",
        description: "Let's set up your profile to get started."
      });

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create profile';
      return { error: { message } };
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signUp = async (email: string, password: string, username?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/onboarding`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: username || email.split('@')[0]
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            variant: "destructive",
            title: "Account exists",
            description: "This email is already registered. Try signing in instead."
          });
        } else {
          toast({
            variant: "destructive",
            title: "Sign up failed",
            description: error.message
          });
        }
        return { error };
      }

      toast({
        title: "Welcome to ama!",
        description: "Let's set up your profile to connect you to your community."
      });

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: message
      });
      return { error: { message } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: error.message
        });
        return { error };
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in to your account."
      });

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: message
      });
      return { error: { message } };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Google sign in failed",
          description: error.message
        });
        return { error };
      }

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast({
        variant: "destructive",
        title: "Google sign in failed",
        description: message
      });
      return { error: { message } };
    }
  };

  const signInWithApple = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Apple sign in failed",
          description: error.message
        });
        return { error };
      }

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast({
        variant: "destructive",
        title: "Apple sign in failed",
        description: message
      });
      return { error: { message } };
    }
  };

  const signInWithGithub = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "GitHub sign in failed",
          description: error.message
        });
        return { error };
      }

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast({
        variant: "destructive",
        title: "GitHub sign in failed",
        description: message
      });
      return { error: { message } };
    }
  };

  const sendMagicLink = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Magic link failed",
          description: error.message
        });
        return { error };
      }

      toast({
        title: "Check your email",
        description: "We've sent you a magic link to sign in."
      });

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast({
        variant: "destructive",
        title: "Magic link failed",
        description: message
      });
      return { error: { message } };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          variant: "destructive",
          title: "Sign out failed",
          description: error.message
        });
        return;
      }

      toast({
        title: "Signed out",
        description: "You have been successfully signed out."
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: message
      });
    }
  };

  const value = {
    user,
    session,
    profile,
    profileMissing,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithApple,
    signInWithGithub,
    sendMagicLink,
    signOut,
    refreshProfile,
    createMissingProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
