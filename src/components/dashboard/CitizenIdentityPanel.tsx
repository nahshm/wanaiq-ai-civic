import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Shield, Star, TrendingUp, Users, Zap, Award, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ImpactData {
  impact_rating: number;
  goat_level: number;
  goat_title: string;
  goat_xp: number;
  trust_tier: string;
  actions_score: number;
  resolution_score: number;
  community_score: number;
  reliability_score: number;
}

interface ProfileData {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  banner_url: string | null;
  is_verified: boolean;
  karma: number;
  county: string | null;
  constituency: string | null;
  ward: string | null;
}

// GOAT tier ring colors
const GOAT_RING_COLORS: Record<number, string> = {
  0: 'ring-zinc-400',
  1: 'ring-amber-700',      // Bronze
  2: 'ring-slate-400',      // Silver
  3: 'ring-yellow-400',     // Gold
  4: 'ring-purple-400',     // Platinum
  5: 'ring-cyan-400',       // Diamond
};

const GOAT_RING_BG: Record<number, string> = {
  0: 'from-zinc-500/20 to-zinc-600/20',
  1: 'from-amber-700/20 to-amber-800/20',
  2: 'from-slate-300/20 to-slate-500/20',
  3: 'from-yellow-300/20 to-yellow-500/20',
  4: 'from-purple-400/20 to-purple-600/20',
  5: 'from-cyan-300/20 to-cyan-500/20',
};

const TRUST_COLORS: Record<string, string> = {
  newcomer: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
  engaged: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  trusted: 'bg-green-500/10 text-green-400 border-green-500/30',
  champion: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
};

interface ScoreBarProps {
  label: string;
  value: number;
  max: number;
  icon: React.ReactNode;
  color: string;
}

const ScoreBar = ({ label, value, max, icon, color }: ScoreBarProps) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className="font-mono font-medium">{value}</span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// SVG donut ring for impact score
const ImpactRing = ({ score, size = 96 }: { score: number; size?: number }) => {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score / 100, 1);
  const offset = circumference * (1 - pct);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={6}
        />
        {/* Score ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#impactGradient)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="impactGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(142 76% 36%)" />
            <stop offset="50%" stopColor="hsl(199 89% 48%)" />
            <stop offset="100%" stopColor="hsl(262 83% 58%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums">{score}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Impact</span>
      </div>
    </div>
  );
};

export const CitizenIdentityPanel = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [impact, setImpact] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [profileRes, impactRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url, banner_url, is_verified, karma, county, constituency, ward')
            .eq('id', user.id)
            .single(),
          (supabase as any)
            .from('civic_impact_scores')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle(),
        ]);

        if (profileRes.data) setProfile(profileRes.data as any);
        if (impactRes.data) setImpact(impactRes.data);
      } catch (e) {
        console.error('CitizenIdentityPanel error:', e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (loading) {
    return (
      <Card className="border-border/60">
        <CardContent className="p-4 space-y-4">
          <Skeleton className="w-20 h-20 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-3 w-24 mx-auto" />
          <Skeleton className="h-24 w-24 rounded-full mx-auto" />
          <div className="space-y-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) return null;

  const goatLevel = impact?.goat_level ?? 0;
  const goatTitle = impact?.goat_title ?? 'Newcomer';
  const trustTier = impact?.trust_tier ?? 'newcomer';
  const impactScore = impact?.impact_rating ?? 0;
  const locationParts = [profile.ward, profile.constituency, profile.county].filter(Boolean);

  return (
    <Card className="border-border/60 overflow-hidden">
      {/* Decorative gradient header or custom banner */}
      <div 
        className={`h-32 w-full ${!profile.banner_url ? `bg-gradient-to-br ${GOAT_RING_BG[goatLevel] || GOAT_RING_BG[0]}` : 'bg-cover bg-center'}`}
        style={profile.banner_url ? { backgroundImage: `url(${profile.banner_url})` } : undefined}
      >
        {!profile.banner_url && <div className="w-full h-full bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />}
      </div>

      <CardContent className="p-4 -mt-10 flex flex-col items-center text-center">
        {/* Avatar with GOAT ring */}
        <Avatar className={`w-20 h-20 ring-[3px] ${GOAT_RING_COLORS[goatLevel] || GOAT_RING_COLORS[0]} ring-offset-2 ring-offset-background`}>
          <AvatarImage src={profile.avatar_url || undefined} />
          <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
            {profile.display_name?.[0]?.toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>

        {/* Name & username */}
        <h3 className="mt-3 font-bold text-base leading-tight">
          {profile.display_name || profile.username}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">@{profile.username}</p>

        {/* Verified / official badge */}
        {profile.is_verified && (
          <Badge variant="secondary" className="mt-1.5 text-[10px] gap-1">
            <Shield className="w-3 h-3" /> Verified
          </Badge>
        )}

        {/* Location breadcrumb */}
        {locationParts.length > 0 && (
          <p className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[180px]">{locationParts.join(' → ')}</span>
          </p>
        )}

        {/* GOAT tier + Trust tier */}
        <div className="flex items-center gap-2 mt-3">
          <Badge className="text-[10px] bg-gradient-to-r from-yellow-500/80 to-amber-600/80 text-white border-0">
            <Star className="w-3 h-3 mr-1" /> {goatTitle} (Lv.{goatLevel})
          </Badge>
          <Badge variant="outline" className={`text-[10px] ${TRUST_COLORS[trustTier] || TRUST_COLORS.newcomer}`}>
            {trustTier}
          </Badge>
        </div>

        {/* Impact ring */}
        <div className="mt-4">
          <ImpactRing score={impactScore} />
        </div>

        {/* Four sub-score bars */}
        <div className="w-full mt-4 space-y-2.5">
          <ScoreBar
            label="Actions"
            value={impact?.actions_score ?? 0}
            max={100}
            icon={<Zap className="w-3 h-3" />}
            color="bg-blue-500"
          />
          <ScoreBar
            label="Resolution"
            value={impact?.resolution_score ?? 0}
            max={100}
            icon={<TrendingUp className="w-3 h-3" />}
            color="bg-green-500"
          />
          <ScoreBar
            label="Community"
            value={impact?.community_score ?? 0}
            max={100}
            icon={<Users className="w-3 h-3" />}
            color="bg-purple-500"
          />
          <ScoreBar
            label="Reliability"
            value={impact?.reliability_score ?? 0}
            max={100}
            icon={<Award className="w-3 h-3" />}
            color="bg-amber-500"
          />
        </div>

        {/* Karma stat */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span className="font-medium text-foreground">{profile.karma ?? 0}</span> Karma
          </span>
        </div>

        {/* Link to Civic Resume */}
        <Button variant="outline" size="sm" className="w-full mt-4 text-xs gap-1.5" asChild>
          <Link to={`/resume/${profile.username}`}>
            View My Civic Resume
            <ArrowRight className="w-3 h-3" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default CitizenIdentityPanel;
