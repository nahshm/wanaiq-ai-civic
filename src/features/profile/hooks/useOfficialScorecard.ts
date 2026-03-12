import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types
export interface OfficialScorecard {
    userId: string;

    // Promises
    promisesTotal: number;
    promisesKept: number;
    promisesBroken: number;
    promisesInProgress: number;
    promiseKeptPercent: number;

    // Projects
    projectsTotal: number;
    projectsStalled: number;
    projectsActive: number;
    projectsCompleted: number;
    projectsCancelled: number;

    // Attendance
    attendanceSessionsTotal: number;
    attendanceSessionsPresent: number;
    attendancePercent: number;

    // Responsiveness
    totalCitizenQueries: number;
    queriesResponded: number;
    avgResponseHours: number | null;

    // Overall
    overallGrade: 'A' | 'B' | 'C' | 'D' | 'F' | null;
    lastCalculated: string;
}

interface UseOfficialScorecardParams {
    userId: string;
    enabled?: boolean;
}

/**
 * Hook to fetch official's public service scorecard
 * Uses React Query for caching
 */
export function useOfficialScorecard({ userId, enabled = true }: UseOfficialScorecardParams) {
    const queryClient = useQueryClient();

    const {
        data: scorecard,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ['official-scorecard', userId],
        queryFn: async (): Promise<OfficialScorecard | null> => {
            // First check if scorecard exists
            const { data: existingScorecard, error: fetchError } = await supabase
                .from('official_scorecards')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (fetchError) throw fetchError;

            if (existingScorecard) {
                return transformScorecard(existingScorecard);
            }

            // If no scorecard, calculate from related tables
            return await calculateScorecardFromData(userId);
        },
        enabled: enabled && !!userId,
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 30 * 60 * 1000,    // 30 minutes cache
        retry: 2,
    });

    // Helper to get grade color
    const getGradeColor = (grade: string | null): string => {
        switch (grade) {
            case 'A': return 'text-green-500';
            case 'B': return 'text-blue-500';
            case 'C': return 'text-yellow-500';
            case 'D': return 'text-orange-500';
            case 'F': return 'text-red-500';
            default: return 'text-muted-foreground';
        }
    };

    // Helper to get promise status color
    const getPromiseStatusColor = (percent: number): string => {
        if (percent >= 70) return 'text-green-500';
        if (percent >= 50) return 'text-yellow-500';
        if (percent >= 30) return 'text-orange-500';
        return 'text-red-500';
    };

    return {
        scorecard,
        isLoading,
        isError,
        error,
        refetch,
        getGradeColor,
        getPromiseStatusColor,
    };
}

// Transform database response to camelCase
function transformScorecard(data: any): OfficialScorecard {
    return {
        userId: data.user_id,
        promisesTotal: data.promises_total || 0,
        promisesKept: data.promises_kept || 0,
        promisesBroken: data.promises_broken || 0,
        promisesInProgress: data.promises_in_progress || 0,
        promiseKeptPercent: data.promise_kept_percent || 0,
        projectsTotal: data.projects_total || 0,
        projectsStalled: data.projects_stalled || 0,
        projectsActive: data.projects_active || 0,
        projectsCompleted: data.projects_completed || 0,
        projectsCancelled: data.projects_cancelled || 0,
        attendanceSessionsTotal: data.attendance_sessions_total || 0,
        attendanceSessionsPresent: data.attendance_sessions_present || 0,
        attendancePercent: data.attendance_percent || 0,
        totalCitizenQueries: data.total_citizen_queries || 0,
        queriesResponded: data.queries_responded || 0,
        avgResponseHours: data.avg_response_hours,
        overallGrade: data.overall_grade,
        lastCalculated: data.last_calculated,
    };
}

// Calculate scorecard from related tables if not cached
async function calculateScorecardFromData(userId: string): Promise<OfficialScorecard | null> {
    try {
        // Get promises data
        const { data: promises } = await supabase
            .from('development_promises')
            .select('status')
            .eq('official_id', userId);

        // Get projects data
        const { data: projects } = await supabase
            .from('government_projects')
            .select('status')
            .eq('official_id', userId);

        const promiseStats = {
            total: promises?.length || 0,
            kept: promises?.filter(p => p.status === 'completed').length || 0,
            broken: promises?.filter(p => p.status === 'cancelled').length || 0,
            inProgress: promises?.filter(p => p.status === 'ongoing').length || 0,
        };

        const projectStats = {
            total: projects?.length || 0,
            stalled: projects?.filter(p => p.status === 'delayed').length || 0,
            active: projects?.filter(p => p.status === 'ongoing').length || 0,
            completed: projects?.filter(p => p.status === 'completed').length || 0,
            cancelled: projects?.filter(p => p.status === 'cancelled').length || 0,
        };

        const promiseKeptPercent = promiseStats.total > 0
            ? Math.round((promiseStats.kept / promiseStats.total) * 100)
            : 0;

        // Calculate overall grade
        let grade: 'A' | 'B' | 'C' | 'D' | 'F' | null = null;
        if (promiseStats.total > 0 || projectStats.total > 0) {
            const avgScore = promiseKeptPercent;
            if (avgScore >= 80) grade = 'A';
            else if (avgScore >= 60) grade = 'B';
            else if (avgScore >= 40) grade = 'C';
            else if (avgScore >= 20) grade = 'D';
            else grade = 'F';
        }

        return {
            userId,
            promisesTotal: promiseStats.total,
            promisesKept: promiseStats.kept,
            promisesBroken: promiseStats.broken,
            promisesInProgress: promiseStats.inProgress,
            promiseKeptPercent,
            projectsTotal: projectStats.total,
            projectsStalled: projectStats.stalled,
            projectsActive: projectStats.active,
            projectsCompleted: projectStats.completed,
            projectsCancelled: projectStats.cancelled,
            attendanceSessionsTotal: 0,
            attendanceSessionsPresent: 0,
            attendancePercent: 0,
            totalCitizenQueries: 0,
            queriesResponded: 0,
            avgResponseHours: null,
            overallGrade: grade,
            lastCalculated: new Date().toISOString(),
        };
    } catch (error) {
        console.error('Error calculating scorecard:', error);
        return null;
    }
}

export default useOfficialScorecard;
