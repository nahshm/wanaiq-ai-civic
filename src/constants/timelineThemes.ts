// Timeline theme configurations by project category
// Used to style timelines with category-specific colors and layouts

export interface TimelineTheme {
    name: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        gradient: string;
    };
    layout: 'gradient-stages' | 'roadmap' | 'default';
    showRoadmap: boolean;
}

export const TIMELINE_THEMES: Record<string, TimelineTheme> = {
    infrastructure: {
        name: 'Infrastructure & Transport',
        colors: {
            primary: '#1e40af',      // Deep blue
            secondary: '#3b82f6',    // Blue
            accent: '#60a5fa',       // Light blue
            gradient: 'from-blue-900 via-blue-600 to-blue-400'
        },
        layout: 'roadmap',
        showRoadmap: true
    },
    education: {
        name: 'Education',
        colors: {
            primary: '#7c3aed',      // Purple
            secondary: '#059669',    // Teal
            accent: '#10b981',       // Green
            gradient: 'from-purple-600 via-teal-600 to-green-500'
        },
        layout: 'gradient-stages',
        showRoadmap: true
    },
    health: {
        name: 'Health',
        colors: {
            primary: '#dc2626',      // Red
            secondary: '#f97316',    // Orange
            accent: '#fbbf24',       // Yellow
            gradient: 'from-red-600 via-orange-500 to-yellow-400'
        },
        layout: 'gradient-stages',
        showRoadmap: true
    },
    housing: {
        name: 'Housing',
        colors: {
            primary: '#0891b2',      // Cyan
            secondary: '#06b6d4',    // Light cyan
            accent: '#22d3ee',       // Sky
            gradient: 'from-cyan-700 via-cyan-500 to-sky-400'
        },
        layout: 'gradient-stages',
        showRoadmap: true
    },
    agriculture: {
        name: 'Agriculture',
        colors: {
            primary: '#65a30d',      // Lime
            secondary: '#84cc16',    // Green
            accent: '#a3e635',       // Light green
            gradient: 'from-lime-700 via-lime-500 to-lime-300'
        },
        layout: 'gradient-stages',
        showRoadmap: true
    },
    water_sanitation: {
        name: 'Water & Sanitation',
        colors: {
            primary: '#0284c7',      // Blue
            secondary: '#0ea5e9',    // Sky blue
            accent: '#38bdf8',       // Light sky
            gradient: 'from-blue-600 via-sky-500 to-sky-300'
        },
        layout: 'gradient-stages',
        showRoadmap: true
    },
    energy: {
        name: 'Energy',
        colors: {
            primary: '#f59e0b',      // Amber
            secondary: '#fbbf24',    // Yellow
            accent: '#fde047',       // Light yellow
            gradient: 'from-amber-600 via-yellow-500 to-yellow-300'
        },
        layout: 'gradient-stages',
        showRoadmap: true
    },
    environment: {
        name: 'Environment',
        colors: {
            primary: '#059669',      // Emerald
            secondary: '#10b981',    // Green
            accent: '#34d399',       // Light green
            gradient: 'from-emerald-700 via-green-600 to-green-400'
        },
        layout: 'gradient-stages',
        showRoadmap: true
    },
    default: {
        name: 'General',
        colors: {
            primary: '#475569',      // Slate
            secondary: '#64748b',    // Light slate
            accent: '#94a3b8',       // Lighter slate
            gradient: 'from-slate-700 via-slate-500 to-slate-400'
        },
        layout: 'gradient-stages',
        showRoadmap: true
    }
};

// Helper function to get theme by category
export function getTimelineTheme(category?: string): TimelineTheme {
    if (!category) return TIMELINE_THEMES.default;

    // Normalize category name (lowercase, remove spaces)
    const normalizedCategory = category.toLowerCase().replace(/\s+/g, '_');

    return TIMELINE_THEMES[normalizedCategory] || TIMELINE_THEMES.default;
}

// Update type color configurations with gradient support
export const UPDATE_TYPE_STYLES = {
    progress: {
        icon: 'TrendingUp',
        label: 'Progress Update',
        badgeClass: 'bg-gradient-to-r from-blue-500 to-blue-600'
    },
    milestone: {
        icon: 'CheckCircle2',
        label: 'Milestone',
        badgeClass: 'bg-gradient-to-r from-green-500 to-green-600'
    },
    issue: {
        icon: 'AlertTriangle',
        label: 'Issue Reported',
        badgeClass: 'bg-gradient-to-r from-red-500 to-red-600'
    },
    delay: {
        icon: 'Clock',
        label: 'Delay',
        badgeClass: 'bg-gradient-to-r from-yellow-500 to-yellow-600'
    },
    completion: {
        icon: 'CheckCircle2',
        label: 'Completion',
        badgeClass: 'bg-gradient-to-r from-purple-500 to-purple-600'
    },
    created: {
        icon: 'Rocket',
        label: 'Project Created',
        badgeClass: 'bg-gradient-to-r from-primary to-primary/80'
    }
};
