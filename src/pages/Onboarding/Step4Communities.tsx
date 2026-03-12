import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';

interface Step4CommunitiesProps {
  onBack: () => void;
  onboardingData: {
    countyId: string;
    constituencyId: string;
    wardId: string;
    interests: string[];
    persona: string;
  };
}

interface CommunityPreview {
  id: string;
  display_name: string;
  description: string;
  locationType: 'county' | 'constituency' | 'ward';
}

const Step4Communities = ({ onBack, onboardingData }: Step4CommunitiesProps) => {
  const [communities, setCommunities] = useState<CommunityPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadLocationNames();
  }, []);

  const loadLocationNames = async () => {
    // Fetch display names from administrative_divisions for preview
    const ids = [onboardingData.countyId, onboardingData.constituencyId, onboardingData.wardId].filter(Boolean);
    if (ids.length === 0) return;

    const { data } = await supabase
      .from('administrative_divisions')
      .select('id, name, governance_level')
      .in('id', ids);

    if (!data) return;

    const previews: CommunityPreview[] = [];
    for (const div of data) {
      let locationType: 'county' | 'constituency' | 'ward';
      let suffix: string;
      if (div.id === onboardingData.countyId) {
        locationType = 'county';
        suffix = 'County';
      } else if (div.id === onboardingData.constituencyId) {
        locationType = 'constituency';
        suffix = 'Constituency';
      } else {
        locationType = 'ward';
        suffix = 'Ward';
      }
      previews.push({
        id: div.id,
        display_name: `${div.name} ${suffix}`,
        description: `Your ${locationType} community`,
        locationType,
      });
    }

    // Sort: county first, then constituency, then ward
    const order = { county: 0, constituency: 1, ward: 2 };
    previews.sort((a, b) => order[a.locationType] - order[b.locationType]);
    setCommunities(previews);
  };

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Get location names from administrative_divisions
      const [countyRes, constituencyRes, wardRes] = await Promise.all([
        supabase.from('administrative_divisions').select('name').eq('id', onboardingData.countyId).maybeSingle(),
        supabase.from('administrative_divisions').select('name').eq('id', onboardingData.constituencyId).maybeSingle(),
        supabase.from('administrative_divisions').select('name').eq('id', onboardingData.wardId).maybeSingle(),
      ]);

      const countyName = countyRes.data?.name ?? null;
      const constituencyName = constituencyRes.data?.name ?? null;
      const wardName = wardRes.data?.name ?? null;

      // 2. Update profile FIRST — this fires the trigger that creates location communities + joins user
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          county_id: onboardingData.countyId,
          constituency_id: onboardingData.constituencyId,
          ward_id: onboardingData.wardId,
          county: countyName,
          constituency: constituencyName,
          ward: wardName,
          persona: onboardingData.persona as any,
          onboarding_completed: true,
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        toast.error('Failed to update profile. Please try again.');
        setLoading(false);
        return;
      }

      // 3. The trigger has now created communities and joined the user.
      //    As a safety net, look up the location communities and ensure membership.
      const locationFilters = [
        countyName && { type: 'county', value: countyName },
        constituencyName && { type: 'constituency', value: constituencyName },
        wardName && { type: 'ward', value: wardName },
      ].filter(Boolean) as { type: string; value: string }[];

      if (locationFilters.length > 0) {
        // Find all matching location communities
        let query = supabase
          .from('communities')
          .select('id, location_type, location_value')
          .eq('type', 'location');

        // Build OR filter for all location types
        const orFilters = locationFilters
          .map(f => `and(location_type.eq.${f.type},location_value.eq.${f.value})`)
          .join(',');
        query = query.or(orFilters);

        const { data: locationCommunities } = await query;

        if (locationCommunities && locationCommunities.length > 0) {
          const memberships = locationCommunities.map(c => ({
            user_id: user.id,
            community_id: c.id,
          }));

          const { error: membershipError } = await supabase
            .from('community_members')
            .upsert(memberships, { onConflict: 'user_id,community_id', ignoreDuplicates: true });

          if (membershipError) {
            console.error('Error ensuring community memberships:', membershipError);
          }
        }
      }

      // 4. Save user interests
      if (onboardingData.interests.length > 0) {
        const interestInserts = onboardingData.interests.map(interestId => ({
          user_id: user.id,
          interest_id: interestId,
        }));

        const { error: interestsError } = await supabase
          .from('user_interests')
          .upsert(interestInserts, { onConflict: 'user_id,interest_id', ignoreDuplicates: true });

        if (interestsError) {
          console.error('Error saving interests:', interestsError);
        }
      }

      // 5. Update onboarding progress
      await supabase
        .from('onboarding_progress')
        .upsert({
          user_id: user.id,
          step_completed: 4,
          location_set: true,
          interests_set: true,
          persona_set: true,
          communities_joined: locationFilters.length,
          completed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      await refreshProfile();
      toast.success('Welcome to ama! 🎉');
      navigate('/my-communities');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-lg">
          <CheckCircle2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Join Your Communities</h2>
          <p className="text-sm text-muted-foreground">
            We've selected communities based on your location
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {communities.map((community) => (
          <div
            key={community.id}
            className="flex items-start space-x-3 p-4 border rounded-lg border-primary bg-primary/5 bg-accent/20"
          >
            <Checkbox checked={true} disabled />
            <Label className="cursor-default flex-1">
              <div className="font-semibold text-foreground">
                {community.display_name}
                <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                  Auto-joined
                </span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {community.description}
              </div>
            </Label>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleComplete} disabled={loading}>
          {loading ? 'Setting up...' : 'Complete Setup'}
        </Button>
      </div>
    </div>
  );
};

export default Step4Communities;
