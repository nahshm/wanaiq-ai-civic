// Project Category Constants - 2026 Government Classification Standard
export const PROJECT_CATEGORIES_2026 = [
    {
        value: 'infrastructure',
        label: 'Infrastructure & Public Works',
        description: 'Roads, bridges, physical networks',
        icon: '🏗️'
    },
    {
        value: 'public_services',
        label: 'General Public Services',
        description: 'Gov buildings, executive/legislative facilities',
        icon: '🏛️'
    },
    {
        value: 'education',
        label: 'Education',
        description: 'Schools, universities, training facilities',
        icon: '🎓'
    },
    {
        value: 'health',
        label: 'Health',
        description: 'Hospitals, clinics, public health services',
        icon: '🏥'
    },
    {
        value: 'water_sanitation',
        label: 'Water & Sanitation',
        description: 'Water supply, waste management, sewerage',
        icon: '💧'
    },
    {
        value: 'energy',
        label: 'Energy',
        description: 'Power grids, renewable energy, fuel supply',
        icon: '⚡'
    },
    {
        value: 'transport',
        label: 'Transport & Logistics',
        description: 'Railways, airports, public transit',
        icon: '🚆'
    },
    {
        value: 'housing',
        label: 'Housing & Community Amenities',
        description: 'Public housing, community facilities',
        icon: '🏘️'
    },
    {
        value: 'public_safety',
        label: 'Public Order & Safety',
        description: 'Police stations, fire services, courts',
        icon: '👮'
    },
    {
        value: 'environment',
        label: 'Environmental Protection',
        description: 'Pollution control, biodiversity, conservation',
        icon: '🌳'
    },
    {
        value: 'digital',
        label: 'Digital Infrastructure',
        description: 'Data centers, government ICT, broadband',
        icon: '💻'
    }
] as const;

export type ProjectCategory = typeof PROJECT_CATEGORIES_2026[number]['value'];

export const PROJECT_LEVELS = [
    { value: 'national', label: 'National' },
    { value: 'county', label: 'County' },
    { value: 'constituency', label: 'Constituency' },
    { value: 'ward', label: 'Ward' }
] as const;

export type ProjectLevel = typeof PROJECT_LEVELS[number]['value'];

export const PROJECT_STATUSES = [
    { value: 'planned', label: 'Planned', color: 'blue' },
    { value: 'ongoing', label: 'Ongoing', color: 'yellow' },
    { value: 'completed', label: 'Completed', color: 'green' },
    { value: 'stalled', label: 'Stalled', color: 'red' },
    { value: 'cancelled', label: 'Cancelled', color: 'gray' }
] as const;

export const PROJECT_PRIORITIES = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
] as const;
