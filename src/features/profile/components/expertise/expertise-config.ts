/**
 * EXPERTISE_CONFIG — civic expertise type definitions.
 * Kept in a separate file so it can be shared across components
 * without breaking Vite fast-refresh (which needs component files
 * to only export components).
 */
export const EXPERTISE_CONFIG: Record<string, {
    label: string;
    icon: string;
    description: string;
    color: string;
}> = {
    budget_analyst: {
        label: 'Budget Analyst',
        icon: '📊',
        description: 'Understands government budgets and finances',
        color: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    },
    pothole_reporter: {
        label: 'Issue Reporter',
        icon: '📢',
        description: 'Accurately reports civic issues and infrastructure problems',
        color: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
    },
    legal_eagle: {
        label: 'Legal Eagle',
        icon: '⚖️',
        description: 'Constitutional and legal knowledge expert',
        color: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
    },
    community_organizer: {
        label: 'Community Organizer',
        icon: '🤝',
        description: 'Organizes community events and initiatives',
        color: 'bg-green-500/10 text-green-500 border-green-500/30',
    },
    fact_checker: {
        label: 'Fact Checker',
        icon: '🔍',
        description: 'Verifies information accuracy',
        color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30',
    },
    policy_analyst: {
        label: 'Policy Analyst',
        icon: '📋',
        description: 'Analyzes government policies effectively',
        color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30',
    },
    election_monitor: {
        label: 'Election Monitor',
        icon: '🗳️',
        description: 'Monitors elections for transparency',
        color: 'bg-red-500/10 text-red-500 border-red-500/30',
    },
    environment_guardian: {
        label: 'Environment Guardian',
        icon: '🌱',
        description: 'Champions environmental issues',
        color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    },
    education_advocate: {
        label: 'Education Advocate',
        icon: '📚',
        description: 'Advocates for education improvements',
        color: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    },
    health_champion: {
        label: 'Health Champion',
        icon: '🏥',
        description: 'Focuses on health-related issues',
        color: 'bg-pink-500/10 text-pink-500 border-pink-500/30',
    },
};
