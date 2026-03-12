// Civic post flairs for categorization and filtering

export interface Flair {
    id: string
    label: string
    color: string
    bgColor: string
    description: string
}

export const CIVIC_FLAIRS: Flair[] = [
    {
        id: 'corruption',
        label: 'Corruption',
        color: 'text-red-700',
        bgColor: 'bg-red-100 hover:bg-red-200',
        description: 'Report corruption or misuse of public resources'
    },
    {
        id: 'project-update',
        label: 'Project Update',
        color: 'text-blue-700',
        bgColor: 'bg-blue-100 hover:bg-blue-200',
        description: 'Updates on government or community projects'
    },
    {
        id: 'discussion',
        label: 'Discussion',
        color: 'text-green-700',
        bgColor: 'bg-green-100 hover:bg-green-200',
        description: 'General civic discussion or debate'
    },
    {
        id: 'question',
        label: 'Question',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-100 hover:bg-yellow-200',
        description: 'Ask questions about civic matters'
    },
    {
        id: 'fact-check',
        label: 'Fact-Check',
        color: 'text-purple-700',
        bgColor: 'bg-purple-100 hover:bg-purple-200',
        description: 'Verify claims or provide fact-checking'
    },
    {
        id: 'promise-tracker',
        label: 'Promise Tracker',
        color: 'text-orange-700',
        bgColor: 'bg-orange-100 hover:bg-orange-200',
        description: 'Track campaign promises and commitments'
    },
    {
        id: 'official-response',
        label: 'Official Response',
        color: 'text-indigo-700',
        bgColor: 'bg-indigo-100 hover:bg-indigo-200',
        description: 'Responses from government officials or authorities'
    },
    {
        id: 'critique',
        label: 'Critique',
        color: 'text-pink-700',
        bgColor: 'bg-pink-100 hover:bg-pink-200',
        description: 'Constructive criticism of policies or actions'
    },
    {
        id: 'evidence',
        label: 'Evidence',
        color: 'text-teal-700',
        bgColor: 'bg-teal-100 hover:bg-teal-200',
        description: 'Share documented evidence or proof'
    },
    {
        id: 'clarification',
        label: 'Clarification',
        color: 'text-cyan-700',
        bgColor: 'bg-cyan-100 hover:bg-cyan-200',
        description: 'Provide clarification or context'
    },
    {
        id: 'support',
        label: 'Support',
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-100 hover:bg-emerald-200',
        description: 'Show support for an initiative or cause'
    }
]

export const getFlairById = (id: string): Flair | undefined => {
    return CIVIC_FLAIRS.find(flair => flair.id === id)
}

export const getFlairColor = (id: string): string => {
    const flair = getFlairById(id)
    return flair ? flair.bgColor : 'bg-gray-100'
}
