// Shared constants for office governance features

// ============================================
// Promise Constants
// ============================================

export const PROMISE_CATEGORIES = [
    { value: 'infrastructure', label: '🏗️ Infrastructure', color: 'bg-orange-500/10 text-orange-700' },
    { value: 'education', label: '📚 Education', color: 'bg-blue-500/10 text-blue-700' },
    { value: 'healthcare', label: '🏥 Healthcare', color: 'bg-red-500/10 text-red-700' },
    { value: 'security', label: '🛡️ Security', color: 'bg-slate-500/10 text-slate-700' },
    { value: 'environment', label: '🌿 Environment', color: 'bg-green-500/10 text-green-700' },
    { value: 'economy', label: '💰 Economy & Jobs', color: 'bg-yellow-500/10 text-yellow-700' },
    { value: 'governance', label: '⚖️ Governance', color: 'bg-purple-500/10 text-purple-700' },
    { value: 'social', label: '🤝 Social Welfare', color: 'bg-pink-500/10 text-pink-700' },
    { value: 'technology', label: '💻 Technology', color: 'bg-cyan-500/10 text-cyan-700' },
    { value: 'other', label: '📌 Other', color: 'bg-gray-500/10 text-gray-700' },
];

export const STATUS_OPTIONS = [
    { value: 'pending', label: 'Not Started', icon: '⏳', color: 'bg-gray-100 text-gray-700' },
    { value: 'in_progress', label: 'In Progress', icon: '🔄', color: 'bg-blue-100 text-blue-700' },
    { value: 'completed', label: 'Completed', icon: '✅', color: 'bg-green-100 text-green-700' },
    { value: 'failed', label: 'Could Not Fulfill', icon: '❌', color: 'bg-red-100 text-red-700' },
];

export function getCategoryInfo(categoryValue: string) {
    return PROMISE_CATEGORIES.find(c => c.value === categoryValue) || PROMISE_CATEGORIES[PROMISE_CATEGORIES.length - 1];
}

export function getStatusInfo(statusValue: string) {
    return STATUS_OPTIONS.find(s => s.value === statusValue) || STATUS_OPTIONS[0];
}

export function getStatusColor(status: string): string {
    switch (status) {
        case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'failed': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
}

export function getProgressColor(progress: number): string {
    if (progress >= 80) return 'bg-emerald-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-amber-500';
    return 'bg-gray-400';
}

export function formatRelativeDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
}

// ============================================
// Project Constants
// ============================================

export const PROJECT_CATEGORIES = [
    { value: 'infrastructure', label: '🏗️ Infrastructure', color: 'bg-orange-500/10 text-orange-700' },
    { value: 'education', label: '📚 Education', color: 'bg-blue-500/10 text-blue-700' },
    { value: 'healthcare', label: '🏥 Healthcare', color: 'bg-red-500/10 text-red-700' },
    { value: 'water', label: '💧 Water & Sanitation', color: 'bg-cyan-500/10 text-cyan-700' },
    { value: 'agriculture', label: '🌾 Agriculture', color: 'bg-lime-500/10 text-lime-700' },
    { value: 'energy', label: '⚡ Energy', color: 'bg-yellow-500/10 text-yellow-700' },
    { value: 'security', label: '🛡️ Security', color: 'bg-slate-500/10 text-slate-700' },
    { value: 'environment', label: '🌿 Environment', color: 'bg-green-500/10 text-green-700' },
    { value: 'transport', label: '🚗 Transport', color: 'bg-indigo-500/10 text-indigo-700' },
    { value: 'technology', label: '💻 Technology', color: 'bg-violet-500/10 text-violet-700' },
    { value: 'housing', label: '🏠 Housing', color: 'bg-amber-500/10 text-amber-700' },
    { value: 'other', label: '📌 Other', color: 'bg-gray-500/10 text-gray-700' },
];

export const PROJECT_STATUS_OPTIONS = [
    { value: 'proposed', label: 'Proposed', icon: '📋', color: 'bg-gray-100 text-gray-700' },
    { value: 'approved', label: 'Approved', icon: '✅', color: 'bg-blue-100 text-blue-700' },
    { value: 'in_progress', label: 'In Progress', icon: '🔄', color: 'bg-amber-100 text-amber-700' },
    { value: 'completed', label: 'Completed', icon: '🎉', color: 'bg-green-100 text-green-700' },
    { value: 'stalled', label: 'Stalled', icon: '⏸️', color: 'bg-red-100 text-red-700' },
    { value: 'cancelled', label: 'Cancelled', icon: '❌', color: 'bg-red-100 text-red-700' },
];

export const PROJECT_PRIORITY_OPTIONS = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-600' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
    { value: 'high', label: 'High', color: 'bg-amber-100 text-amber-700' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700' },
];

export function getProjectCategoryInfo(categoryValue: string) {
    return PROJECT_CATEGORIES.find(c => c.value === categoryValue) || PROJECT_CATEGORIES[PROJECT_CATEGORIES.length - 1];
}

export function getProjectStatusInfo(statusValue: string) {
    return PROJECT_STATUS_OPTIONS.find(s => s.value === statusValue) || PROJECT_STATUS_OPTIONS[0];
}

export function getProjectStatusColor(status: string): string {
    switch (status) {
        case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'in_progress': return 'bg-amber-100 text-amber-800 border-amber-200';
        case 'approved': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'stalled': return 'bg-red-100 text-red-800 border-red-200';
        case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
}

// ============================================
// Activity Feed Constants
// ============================================

export const ACTIVITY_TYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
    promise_added: { icon: '🎯', color: 'bg-amber-500', label: 'Promise Made' },
    promise_updated: { icon: '📊', color: 'bg-amber-400', label: 'Promise Updated' },
    question_answered: { icon: '💬', color: 'bg-blue-500', label: 'Question Answered' },
    project_linked: { icon: '🔗', color: 'bg-green-500', label: 'Project Linked' },
    project_created: { icon: '🏗️', color: 'bg-green-600', label: 'Project Created' },
    project_updated: { icon: '📈', color: 'bg-green-400', label: 'Project Updated' },
    profile_updated: { icon: '👤', color: 'bg-gray-500', label: 'Profile Updated' },
};

export function getActivityTypeConfig(activityType: string) {
    return ACTIVITY_TYPE_CONFIG[activityType] || { icon: '📌', color: 'bg-gray-400', label: 'Activity' };
}

// ============================================
// Shared Formatting Helpers
// ============================================

export function formatBudget(amount: number | null): string {
    if (!amount) return '—';
    if (amount >= 1_000_000_000) return `KES ${(amount / 1_000_000_000).toFixed(1)}B`;
    if (amount >= 1_000_000) return `KES ${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `KES ${(amount / 1_000).toFixed(0)}K`;
    return `KES ${amount.toLocaleString()}`;
}

