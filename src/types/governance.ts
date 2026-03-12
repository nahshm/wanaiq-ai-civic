export interface GovernanceTemplate {
    id: string;
    country_code: string;
    country_name: string;
    governance_system: {
        levels: string[]; // e.g. ["nation", "county", "constituency", "ward"]
        [level: string]: any; // Structure for each level
    };
    flag_emoji?: string;
    is_verified: boolean;
    submitted_by?: string;
    created_at: string;
    updated_at: string;
}

export interface GovernmentPosition {
    id: string;
    position_code: string; // "KE:president", "US:governor:CA"
    title: string;
    description?: string;
    country_code: string;
    governance_level: string; // "nation", "county", etc.
    jurisdiction_name: string; // "Kenya", "Nairobi City County"
    jurisdiction_code?: string;

    term_years: number;
    term_limit: number;

    next_election_date?: string;
    election_type?: string;
    is_elected: boolean;

    responsibilities?: string;
    authority_level: number;

    created_at: string;
    updated_at: string;
}

export interface OfficeHolder {
    id: string;
    position_id: string;
    user_id: string;

    // Joins (optional depending on query)
    position?: GovernmentPosition;
    user?: {
        id: string;
        full_name: string;
        avatar_url?: string;
    };

    term_start: string;
    term_end: string;
    is_active: boolean;

    verification_status: 'pending' | 'verified' | 'rejected' | 'expired';
    verification_method?: string;
    verified_by?: string;
    verified_at?: string;
    rejection_notes?: string;

    claimed_at: string;
    proof_documents?: {
        document_url?: string;
        official_email?: string;
        official_website?: string;
    };

    is_historical: boolean;
}

export interface ElectionCycle {
    id: string;
    position_id: string;
    election_date: string;
    election_type?: string;
    declared_candidates: string[]; // User IDs
    winner_user_id?: string;
    results_certified: boolean;
    created_at: string;
}

// Helper for UI
export interface CountryGovernance {
    code: string;
    name: string;
    flag_emoji: string;
    governance_levels: string[];
}
