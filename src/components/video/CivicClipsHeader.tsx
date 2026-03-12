import { Plus, Search, Filter, TrendingUp, ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface CivicClipsHeaderProps {
    onSearchClick?: () => void
    onFilterClick?: () => void
    className?: string
}

export const CivicClipsHeader = ({
    onSearchClick,
    onFilterClick,
    className
}: CivicClipsHeaderProps) => {
    const navigate = useNavigate()

    return (
        <header className={cn(
            "fixed top-0 left-0 right-0 z-50 px-4 py-3",
            "bg-gradient-to-b from-black/80 via-black/40 to-transparent",
            "pointer-events-none",
            className
        )}>
            <div className="flex items-center justify-between pointer-events-auto">
                {/* Back Button + Logo/Title */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white"
                        onClick={() => navigate(-1)}
                        aria-label="Go back"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>

                    <Link to="/" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="text-white font-bold text-lg tracking-tight">
                            CivicClips
                        </span>
                    </Link>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white"
                        onClick={onSearchClick}
                    >
                        <Search className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white"
                        onClick={onFilterClick}
                    >
                        <Filter className="h-4 w-4" />
                    </Button>

                    <Link to="/create?type=civic-clip">
                        <Button
                            size="sm"
                            className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 gap-1.5"
                        >
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">Create</span>
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
    )
}
