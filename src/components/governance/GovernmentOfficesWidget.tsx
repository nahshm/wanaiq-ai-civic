import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Landmark, ChevronRight, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GovernmentOfficesWidgetProps {
    /** The display name of the jurisdiction, e.g. "Westlands" */
    jurisdictionName: string;
    /** Governance level of the community, e.g. "ward" | "constituency" | "county" */
    governanceLevel: string;
    /** ISO 3166-1 alpha-2 country code, defaults to "KE" */
    countryCode?: string;
}

interface OfficePosition {
    id: string;
    title: string;
    governance_level: string;
    jurisdiction_name: string;
    jurisdiction_code: string | null;
    country_code: string;
    position_code: string;
    is_elected: boolean | null;
    has_holder: boolean;
}

/** Build office URL directly from position_code (e.g. "KE:nairobi:governor" → /office/ke/county/nairobi/governor) */
function buildOfficeUrl(pos: Pick<OfficePosition, 'country_code' | 'governance_level' | 'position_code'>): string {
    const country = pos.country_code.toLowerCase();
    const level = pos.governance_level.toLowerCase();
    const parts = pos.position_code.split(':');
    const jurisdictionSlug = (parts[1] || '').toLowerCase();
    const roleSlug = (parts[2] || '').toLowerCase();
    return `/office/${country}/${level}/${jurisdictionSlug}/${roleSlug}`;
}

export function GovernmentOfficesWidget({ jurisdictionName, governanceLevel, countryCode = 'KE' }: GovernmentOfficesWidgetProps) {
    const { data: positions = [], isLoading, error } = useQuery<OfficePosition[]>({
        queryKey: ['community-offices', jurisdictionName, governanceLevel, countryCode],
        queryFn: async () => {
            // Fetch positions matching this jurisdiction (and parent jurisdictions)
            const { data: rawPositions, error: posErr } = await supabase
                .from('government_positions')
                .select('id, title, governance_level, jurisdiction_name, jurisdiction_code, country_code, position_code, is_elected')
                .eq('country_code', countryCode)
                .ilike('jurisdiction_name', `%${jurisdictionName}%`)
                .order('governance_level')
                .order('title')
                .limit(8);

            if (posErr) throw posErr;
            if (!rawPositions || rawPositions.length === 0) return [];

            // Check which positions have active verified holders
            const posIds = rawPositions.map(p => p.id);
            const { data: holders } = await supabase
                .from('office_holders')
                .select('position_id')
                .in('position_id', posIds)
                .in('verification_status', ['verified'])
                .eq('is_active', true);

            const holderSet = new Set((holders || []).map(h => h.position_id));

            return rawPositions.map(p => ({
                ...p,
                has_holder: holderSet.has(p.id),
            })) as OfficePosition[];
        },
        staleTime: 5 * 60 * 1000, // 5 min
    });

    if (isLoading) {
        return (
            <Card className="bg-sidebar-background border-sidebar-border">
                <CardContent className="py-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading offices...
                </CardContent>
            </Card>
        );
    }

    if (error || positions.length === 0) return null;

    return (
        <Card className="bg-sidebar-background border-sidebar-border">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase text-sidebar-muted-foreground flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-blue-500" />
                    Government Offices
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1">
                {positions.map(pos => (
                    <Link
                        key={pos.id}
                        to={buildOfficeUrl(pos)}
                        className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-sidebar-accent transition-colors group"
                    >
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-sidebar-foreground group-hover:text-blue-600 truncate leading-tight">
                                {pos.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground capitalize">{pos.governance_level}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {pos.has_holder ? (
                                <Badge className="text-[9px] h-4 px-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">
                                    <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />
                                    Active
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-amber-600 border-amber-300/50">
                                    <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
                                    Vacant
                                </Badge>
                            )}
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                        </div>
                    </Link>
                ))}

                <Link
                    to="/officials"
                    className="block text-center text-xs text-blue-600 dark:text-blue-400 hover:underline pt-2 pb-1"
                >
                    View all government officials →
                </Link>
            </CardContent>
        </Card>
    );
}
