import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Plus, Check, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { EXPERTISE_CONFIG } from '../expertise/expertise-config';
import { cn } from '@/lib/utils';

interface SkillsEndorsementPanelProps {
    userId: string;
    isOwnProfile: boolean;
}

export const SkillsEndorsementPanel: React.FC<SkillsEndorsementPanelProps> = ({ userId, isOwnProfile }) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const [verifyingSkill, setVerifyingSkill] = useState<string | null>(null);
    const [showPicker, setShowPicker] = useState(false);
    const [addingType, setAddingType] = useState<string | null>(null);

    // ─── Fetch user's skills (from user_skills table) ─────────────────────────
    const { data: skills, isLoading } = useQuery({
        queryKey: ['resume-skills', userId],
        queryFn: async () => {
            const { data: userSkills, error: skillsError } = await supabase
                .from('user_skills')
                .select('id, skill_id, user_id, endorsement_count, credibility_score, claimed_at, skills ( name )')
                .eq('user_id', userId)
                .order('endorsement_count', { ascending: false });

            if (skillsError) throw skillsError;

            const { data: authUser } = await supabase.auth.getUser();
            const currentUserId = authUser?.user?.id;
            let myEndorsedSkillIds: string[] = [];

            if (currentUserId && currentUserId !== userId && userSkills?.length) {
                const userSkillIds = userSkills.map(s => s.id);
                const { data: endData } = await supabase
                    .from('skill_endorsements')
                    .select('user_skill_id')
                    .eq('endorsed_by', currentUserId)
                    .in('user_skill_id', userSkillIds);
                if (endData) myEndorsedSkillIds = endData.map(e => e.user_skill_id);
            }

            return {
                skills: (userSkills || []) as Array<{
                    id: string;
                    skill_id: string;
                    user_id: string;
                    endorsement_count: number | null;
                    credibility_score: number | null;
                    claimed_at: string | null;
                    skills: { name: string } | null;
                }>,
                myEndorsements: myEndorsedSkillIds,
            };
        },
        enabled: !!userId,
    });

    // ─── Fetch user's expertise (for the expertise picker) ─────────────────────
    const { data: claimedExpertise } = useQuery({
        queryKey: ['user-expertise', userId],
        queryFn: async () => {
            const { data } = await supabase
                .from('user_expertise')
                .select('expertise_type')
                .eq('user_id', userId);
            return (data || []).map(e => e.expertise_type);
        },
        enabled: !!userId && isOwnProfile,
    });

    // ─── Endorse skill mutation ────────────────────────────────────────────────
    const endorseSkillMutation = useMutation({
        mutationFn: async (skillId: string) => {
            const { data: authUser } = await supabase.auth.getUser();
            if (!authUser?.user?.id) throw new Error('Must be logged in to endorse');
            setVerifyingSkill(skillId);
            const { error } = await supabase.from('skill_endorsements').insert({
                endorsed_by: authUser.user.id,
                user_skill_id: skillId,
            });
            if (error) {
                if (error.code === '23505') throw new Error('Already endorsed this skill');
                throw error;
            }
        },
        onSuccess: () => {
            toast.success('Skill endorsed!');
            queryClient.invalidateQueries({ queryKey: ['resume-skills', userId] });
        },
        onError: (error: Error) => toast.error(error.message || 'Failed to endorse skill'),
        onSettled: () => setVerifyingSkill(null),
    });

    // ─── Claim expertise mutation ──────────────────────────────────────────────
    const claimExpertiseMutation = useMutation({
        mutationFn: async (expertiseType: string) => {
            if (!user?.id) throw new Error('Must be logged in');
            setAddingType(expertiseType);
            const { error } = await supabase.from('user_expertise').insert({
                user_id: user.id,
                expertise_type: expertiseType,
                endorsement_count: 0,
                verified_actions_count: 0,
                is_verified: false,
            });
            if (error) {
                if (error.code === '23505') throw new Error('Already claimed this expertise');
                throw error;
            }
        },
        onSuccess: (_, expertiseType) => {
            const label = EXPERTISE_CONFIG[expertiseType]?.label ?? expertiseType;
            toast.success(`"${label}" added to your profile!`);
            queryClient.invalidateQueries({ queryKey: ['user-expertise', userId] });
        },
        onError: (error: Error) => toast.error(error.message || 'Failed to add expertise'),
        onSettled: () => setAddingType(null),
    });

    const unclaimed = Object.entries(EXPERTISE_CONFIG).filter(
        ([key]) => !(claimedExpertise ?? []).includes(key)
    );

    // ─── Loading ───────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Skills & Expertise</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-8 w-24 bg-muted animate-pulse rounded-full" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    // ─── Own profile — skills panel with inline expertise picker ──────────────
    if (isOwnProfile) {
        return (
            <Card>
                <CardHeader className="pb-3 border-b border-border/50">
                    <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary" />
                        Skills & Expertise
                    </CardTitle>
                    {(!skills?.skills.length && !claimedExpertise?.length) && (
                        <CardDescription>
                            Add expertise areas that reflect your civic strengths — others can endorse you.
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                    {/* Existing skills from user_skills */}
                    {!!skills?.skills.length && (
                        <div className="flex flex-wrap gap-2">
                            {skills.skills.map((skill) => (
                                <div key={skill.id} className="flex items-center bg-muted/30 border border-border/50 rounded-full pl-3 pr-2 py-1">
                                    <span className="text-sm font-medium mr-2">{skill.skills?.name ?? 'Unknown'}</span>
                                    <Badge
                                        variant="secondary"
                                        className={`px-1.5 min-w-[24px] flex justify-center ${(skill.endorsement_count ?? 0) > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
                                    >
                                        {skill.endorsement_count ?? 0}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Expertise picker toggle */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => setShowPicker(p => !p)}
                    >
                        {showPicker ? (
                            <><ChevronUp className="w-4 h-4" /> Hide expertise picker</>
                        ) : (
                            <><Plus className="w-4 h-4" /> Add expertise area</>
                        )}
                    </Button>

                    {/* Inline expertise picker */}
                    {showPicker && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                            {Object.entries(EXPERTISE_CONFIG).map(([key, cfg]) => {
                                const already = (claimedExpertise ?? []).includes(key);
                                const isAdding = addingType === key;
                                return (
                                    <button
                                        key={key}
                                        disabled={already || claimExpertiseMutation.isPending}
                                        onClick={() => claimExpertiseMutation.mutate(key)}
                                        className={cn(
                                            'flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-sm transition-all',
                                            already
                                                ? 'bg-primary/5 border-primary/30 text-primary cursor-default opacity-70'
                                                : 'border-border/50 hover:border-primary/50 hover:bg-muted/50 cursor-pointer',
                                        )}
                                    >
                                        <span className="text-base shrink-0">{cfg.icon}</span>
                                        <span className="font-medium leading-tight flex-1">{cfg.label}</span>
                                        {isAdding ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-primary" />
                                        ) : already ? (
                                            <Check className="w-3.5 h-3.5 shrink-0 text-primary" />
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    // ─── Visitor view — hide if no skills ─────────────────────────────────────
    if (!skills?.skills.length) return null;

    return (
        <Card>
            <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Skills & Endorsements
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="flex flex-wrap gap-3">
                    {skills.skills.map((skill) => {
                        const hasEndorsed = skills.myEndorsements.includes(skill.id);
                        const isEndorsing = verifyingSkill === skill.id;
                        return (
                            <div key={skill.id} className="flex items-center bg-muted/30 border border-border/50 rounded-full pl-3 pr-1 py-1 group transition-colors hover:border-primary/50">
                                <span className="text-sm font-medium mr-2">{skill.skills?.name ?? 'Unknown'}</span>
                                <Badge
                                    variant="secondary"
                                    className={`px-1.5 min-w-[24px] flex justify-center ${(skill.endorsement_count ?? 0) > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
                                >
                                    {skill.endorsement_count ?? 0}
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`w-6 h-6 ml-1 rounded-full transition-all ${
                                        hasEndorsed
                                            ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-600'
                                            : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary hover:bg-primary/10'
                                    }`}
                                    disabled={hasEndorsed || isEndorsing}
                                    onClick={() => endorseSkillMutation.mutate(skill.id)}
                                    title={hasEndorsed ? 'You endorsed this' : 'Endorse skill'}
                                >
                                    {hasEndorsed ? (
                                        <Check className="w-3.5 h-3.5" />
                                    ) : isEndorsing ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <Plus className="w-3.5 h-3.5" />
                                    )}
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};
