import { cn } from '@/lib/utils'
import { 
    ShieldCheck, 
    AlertTriangle, 
    BadgeCheck, 
    Clock,
    MessageSquareWarning
} from 'lucide-react'

type FactCheckStatus = 'verified' | 'disputed' | 'pending' | 'unverified'
type OfficialResponseStatus = 'responded' | 'awaiting' | 'none'

interface CivicClipAccountabilityBadgeProps {
    factCheckStatus?: FactCheckStatus
    officialResponse?: OfficialResponseStatus
    hasSourceCitation?: boolean
    className?: string
}

export const CivicClipAccountabilityBadge = ({
    factCheckStatus = 'unverified',
    officialResponse = 'none',
    hasSourceCitation = false,
    className
}: CivicClipAccountabilityBadgeProps) => {
    const getFactCheckBadge = () => {
        switch (factCheckStatus) {
            case 'verified':
                return (
                    <div className="flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-xs font-medium border border-green-500/30">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified</span>
                    </div>
                )
            case 'disputed':
                return (
                    <div className="flex items-center gap-1 bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full text-xs font-medium border border-red-500/30">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Disputed</span>
                    </div>
                )
            case 'pending':
                return (
                    <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full text-xs font-medium border border-yellow-500/30">
                        <Clock className="w-3 h-3" />
                        <span>Checking</span>
                    </div>
                )
            default:
                return null
        }
    }

    const getOfficialResponseBadge = () => {
        switch (officialResponse) {
            case 'responded':
                return (
                    <div className="flex items-center gap-1 bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full text-xs font-medium border border-blue-500/30">
                        <BadgeCheck className="w-3 h-3" />
                        <span>Official Response</span>
                    </div>
                )
            case 'awaiting':
                return (
                    <div className="flex items-center gap-1 bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full text-xs font-medium border border-orange-500/30">
                        <MessageSquareWarning className="w-3 h-3" />
                        <span>Awaiting Response</span>
                    </div>
                )
            default:
                return null
        }
    }

    const factCheckBadge = getFactCheckBadge()
    const officialBadge = getOfficialResponseBadge()

    if (!factCheckBadge && !officialBadge && !hasSourceCitation) {
        return null
    }

    return (
        <div className={cn("flex flex-wrap gap-1.5", className)}>
            {factCheckBadge}
            {officialBadge}
            {hasSourceCitation && (
                <div className="flex items-center gap-1 bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full text-xs font-medium border border-purple-500/30">
                    <span>📎 Sources</span>
                </div>
            )}
        </div>
    )
}
