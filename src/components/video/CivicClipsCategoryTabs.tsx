import { cn } from '@/lib/utils'
import { 
    Flame, 
    GraduationCap, 
    CheckCircle2, 
    Building2, 
    Lightbulb, 
    Users, 
    Scale,
    MessageSquare,
    Sparkles
} from 'lucide-react'

export type CivicCategory = 
    | 'for_you'
    | 'trending'
    | 'civic_education'
    | 'promise_update'
    | 'project_showcase'
    | 'explainer'
    | 'community_report'
    | 'accountability'
    | 'discussion'

interface CategoryTab {
    id: CivicCategory | null
    label: string
    icon: React.ReactNode
    color: string
}

const categories: CategoryTab[] = [
    { id: null, label: 'For You', icon: <Sparkles className="w-4 h-4" />, color: 'text-white' },
    { id: 'trending', label: 'Trending', icon: <Flame className="w-4 h-4" />, color: 'text-orange-400' },
    { id: 'civic_education', label: 'Learn', icon: <GraduationCap className="w-4 h-4" />, color: 'text-blue-400' },
    { id: 'promise_update', label: 'Promises', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-400' },
    { id: 'project_showcase', label: 'Projects', icon: <Building2 className="w-4 h-4" />, color: 'text-purple-400' },
    { id: 'explainer', label: 'Explainers', icon: <Lightbulb className="w-4 h-4" />, color: 'text-yellow-400' },
    { id: 'community_report', label: 'Reports', icon: <Users className="w-4 h-4" />, color: 'text-orange-400' },
    { id: 'accountability', label: 'Watchdog', icon: <Scale className="w-4 h-4" />, color: 'text-red-400' },
    { id: 'discussion', label: 'Discuss', icon: <MessageSquare className="w-4 h-4" />, color: 'text-cyan-400' },
]

interface CivicClipsCategoryTabsProps {
    activeCategory: CivicCategory | null
    onCategoryChange: (category: CivicCategory | null) => void
    className?: string
}

export const CivicClipsCategoryTabs = ({
    activeCategory,
    onCategoryChange,
    className
}: CivicClipsCategoryTabsProps) => {
    return (
        <div className={cn(
            "fixed top-14 left-0 right-0 z-40",
            "bg-gradient-to-b from-black/60 to-transparent pb-4 pt-1",
            "pointer-events-none",
            className
        )}>
            <div className="overflow-x-auto scrollbar-hide pointer-events-auto">
                <div className="flex gap-2 px-4 min-w-max">
                    {categories.map((category) => {
                        const isActive = activeCategory === category.id
                        return (
                            <button
                                key={category.id ?? 'for_you'}
                                onClick={() => onCategoryChange(category.id)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                                    "text-sm font-medium whitespace-nowrap",
                                    "transition-all duration-200",
                                    "border",
                                    isActive 
                                        ? "bg-white text-black border-white" 
                                        : "bg-white/10 text-white/90 border-white/20 hover:bg-white/20 hover:border-white/30"
                                )}
                            >
                                <span className={cn(isActive ? 'text-black' : category.color)}>
                                    {category.icon}
                                </span>
                                <span>{category.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
