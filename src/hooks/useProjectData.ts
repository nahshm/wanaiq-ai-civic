import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Official {
    id: string;
    name: string;
    position: string;
}

interface Institution {
    id: string;
    name: string;
    acronym: string | null;
    institution_type: string;
}

// Fetch officials by location
export function useOfficialsByLocation(
    projectLevel: string,
    county?: string,
    constituency?: string,
    ward?: string
) {
    return useQuery({
        queryKey: ['officials', projectLevel, county, constituency, ward],
        queryFn: async () => {
            let query = supabase
                .from('government_positions')
                .select('id, title, governance_level, jurisdiction_name');

            // Filter by governance level and location
            if (projectLevel === 'national') {
                query = query.eq('governance_level', 'nation').eq('country_code', 'KE');
            } else if (projectLevel === 'county' && county) {
                // Get county ID first
                const { data: countyData } = await supabase
                    .from('administrative_divisions')
                    .select('id')
                    .eq('country_code', 'KE')
                    .eq('governance_level', 'county')
                    .eq('name', county)
                    .single();

                if (!countyData) return [];

                query = query
                    .eq('governance_level', 'county')
                    .eq('jurisdiction_name', `${county} County`);
            } else if (projectLevel === 'constituency' && constituency) {
                query = query
                    .eq('governance_level', 'constituency')
                    .eq('jurisdiction_name', `${constituency} Constituency`);
            } else if (projectLevel === 'ward' && ward) {
                query = query
                    .eq('governance_level', 'ward')
                    .eq('jurisdiction_name', `${ward} Ward`);
            } else {
                return [];
            }

            const { data, error } = await query.order('title');

            if (error) throw error;

            // Transform to match expected format
            return (data || []).map((pos: any) => ({
                id: pos.id,
                name: pos.title,
                position: pos.governance_level
            })) as Official[];
        },
        enabled: !!projectLevel && (projectLevel === 'national' || !!(county || constituency || ward))
    });
}

// Fetch institutions by jurisdiction
export function useInstitutionsByJurisdiction(
    projectLevel: string,
    county?: string
) {
    return useQuery({
        queryKey: ['institutions', projectLevel, county],
        queryFn: async () => {
            let query = supabase
                .from('government_institutions')
                .select('id, name, acronym, institution_type')
                .eq('country_code', 'KE')
                .eq('is_active', true);

            if (projectLevel === 'national') {
                query = query.eq('jurisdiction_type', 'national');
            } else if (projectLevel === 'county' && county) {
                query = query
                    .eq('jurisdiction_type', 'county')
                    .eq('jurisdiction_name', county);
            } else if (projectLevel === 'constituency' || projectLevel === 'ward') {
                // Constituencies and wards can use national or county institutions
                if (county) {
                    query = query.or(`jurisdiction_type.eq.national,and(jurisdiction_type.eq.county,jurisdiction_name.eq.${county})`);
                } else {
                    query = query.eq('jurisdiction_type', 'national');
                }
            } else {
                return [];
            }

            const { data, error } = await query.order('name');

            if (error) throw error;
            return (data || []) as Institution[];
        },
        enabled: !!projectLevel
    });
}

// Fetch user profile with location
export function useUserProfile(userId?: string) {
    return useQuery({
        queryKey: ['user-profile', userId],
        queryFn: async () => {
            if (!userId) return null;

            const { data, error } = await supabase
                .from('profiles')
                .select('county, constituency, ward, county_id, constituency_id, ward_id')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!userId
    });
}

// Fetch community location context with hierarchy
export function useCommunityLocation(communityId?: string) {
    return useQuery({
        queryKey: ['community-location', communityId],
        queryFn: async () => {
            if (!communityId) return null;

            // Get community location type and value
            const { data: community, error } = await supabase
                .from('communities')
                .select('type, location_type, location_value')
                .eq('id', communityId)
                .single();

            if (error) throw error;
            if (!community || community.type !== 'location') return null;

            const result: {
                location_type: string;
                county?: string;
                constituency?: string;
                ward?: string;
            } = {
                location_type: community.location_type
            };

            // Based on location type, populate the hierarchy
            if (community.location_type === 'county') {
                result.county = community.location_value;
            } else if (community.location_type === 'constituency') {
                // Need to lookup parent county
                const { data: constData } = await supabase
                    .from('constituencies')
                    .select('name, county:counties(name)')
                    .eq('name', community.location_value)
                    .single();

                if (constData) {
                    result.constituency = constData.name;
                    result.county = (constData.county as any)?.name;
                }
            } else if (community.location_type === 'ward') {
                // Need to lookup parent constituency and county
                const { data: wardData } = await supabase
                    .from('wards')
                    .select('name, constituency:constituencies(name, county:counties(name))')
                    .eq('name', community.location_value)
                    .single();

                if (wardData) {
                    result.ward = wardData.name;
                    const constituency = (wardData.constituency as any);
                    if (constituency) {
                        result.constituency = constituency.name;
                        result.county = constituency.county?.name;
                    }
                }
            }

            return result;
        },
        enabled: !!communityId
    });
}
