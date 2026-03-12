import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { 
    Flag, 
    UserPlus, 
    Bell, 
    ExternalLink,
    FileText,
    MapPin
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CivicClipActionPanelProps {
    postId?: string
    promiseId?: string
    projectId?: string
    officialId?: string
    communityId?: string
    location?: string
    onFollow?: () => void
    onReport?: () => void
    onNotify?: () => void
    isFollowing?: boolean
    className?: string
}

export const CivicClipActionPanel = ({
    postId,
    promiseId,
    projectId,
    officialId,
    location,
    onFollow,
    onReport,
    onNotify,
    isFollowing = false,
    className
}: CivicClipActionPanelProps) => {
    return (
        <div className={cn(
            "flex flex-col gap-2 p-3 bg-black/40 backdrop-blur-sm rounded-xl border border-white/10",
            className
        )}>
            {/* Primary Actions */}
            <div className="flex gap-2">
                {/* Follow Creator */}
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "flex-1 h-9 rounded-full text-xs font-medium",
                        isFollowing 
                            ? "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
                            : "bg-white/10 text-white hover:bg-white/20"
                    )}
                    onClick={onFollow}
                >
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    {isFollowing ? 'Following' : 'Follow'}
                </Button>

                {/* Get Updates */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 text-xs font-medium"
                    onClick={onNotify}
                >
                    <Bell className="w-3.5 h-3.5 mr-1.5" />
                    Updates
                </Button>
            </div>

            {/* Civic Links */}
            <div className="flex flex-wrap gap-1.5">
                {promiseId && (
                    <Link to={`/promises/${promiseId}`}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 rounded-full bg-green-500/10 text-green-400 hover:bg-green-500/20 text-xs"
                        >
                            <FileText className="w-3 h-3 mr-1" />
                            Track Promise
                        </Button>
                    </Link>
                )}

                {projectId && (
                    <Link to={`/projects/${projectId}`}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 rounded-full bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 text-xs"
                        >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View Project
                        </Button>
                    </Link>
                )}

                {officialId && (
                    <Link to={`/officials/${officialId}`}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 rounded-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs"
                        >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Official Profile
                        </Button>
                    </Link>
                )}

                {location && (
                    <Link to={`/search?q=${encodeURIComponent(location)}&type=location`}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 rounded-full bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 text-xs"
                        >
                            <MapPin className="w-3 h-3 mr-1" />
                            {location}
                        </Button>
                    </Link>
                )}
            </div>

            {/* Report */}
            <Button
                variant="ghost"
                size="sm"
                className="h-7 w-full rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80 text-xs"
                onClick={onReport}
            >
                <Flag className="w-3 h-3 mr-1.5" />
                Report Issue / Suggest Fact-Check
            </Button>
        </div>
    )
}
