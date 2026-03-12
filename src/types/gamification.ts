import { User } from './index';

// Gamification Types
export interface Quest {
    id: string;
    title: string;
    description: string;
    category: 'reporting' | 'attendance' | 'engagement' | 'content' | 'learning';
    points: number;
    verification_type: 'photo' | 'social_proof' | 'official' | 'automatic';
    requirements: Record<string, any>;
    difficulty?: 'easy' | 'medium' | 'hard';
    icon?: string;
}

export interface UserQuest {
    id: string;
    user_id: string;
    quest_id: string;
    quest?: Quest;
    status: 'active' | 'pending_verification' | 'completed' | 'rejected';
    progress: number;
    evidence?: Record<string, any>;
    verified_at?: string;
    completed_at?: string;
}

export interface Badge {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    category: string;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    requirements: Record<string, any>;
}

export interface UserBadge {
    id: string;
    user_id: string;
    badge_id: string;
    badge?: Badge;
    progress: number;
    awarded_at?: string;
}

export interface LeaderboardScore {
    id: string;
    user_id: string;
    user?: User;
    location_type?: string;
    location_value?: string;
    period: 'all_time' | 'monthly' | 'weekly';
    total_points: number;
    rank?: number;
}

export interface Challenge {
    id: string;
    title: string;
    description?: string;
    category: string;
    start_date: string;
    end_date: string;
    status?: string;
    reward_description?: string;
    reward_points?: number;
}

export interface ChallengeSubmission {
    id: string;
    challenge_id: string;
    user_id: string;
    user?: User;
    submission: Record<string, any>;
    votes: number;
    rank?: number;
}

export interface Skill {
    id: string;
    name: string;
    category?: string;
    description?: string;
    icon?: string;
}

export interface UserSkill {
    id: string;
    user_id: string;
    skill_id: string;
    skill?: Skill;
    endorsement_count: number;
    credibility_score: number;
}
