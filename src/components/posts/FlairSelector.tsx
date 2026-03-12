import { CIVIC_FLAIRS, Flair } from '@/config/flairs'
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface FlairSelectorProps {
    selectedFlairIds?: string[]
    onSelectFlairs: (flairIds: string[]) => void
    disabled?: boolean
}

export const FlairSelector = ({ selectedFlairIds = [], onSelectFlairs, disabled }: FlairSelectorProps) => {
    const handleToggleFlair = (flairId: string) => {
        if (selectedFlairIds.includes(flairId)) {
            onSelectFlairs(selectedFlairIds.filter(id => id !== flairId))
        } else {
            onSelectFlairs([...selectedFlairIds, flairId])
        }
    }

    const selectedFlairs = CIVIC_FLAIRS.filter(f => selectedFlairIds.includes(f.id));

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Selected Flairs shown as pills */}
            {selectedFlairs.map((flair) => (
                <Badge
                    key={`selected-${flair.id}`}
                    variant="secondary"
                    className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider",
                        flair.color,
                        flair.bgColor,
                        "hover:opacity-80 transition-opacity"
                    )}
                >
                    {flair.label}
                    {!disabled && (
                        <button
                            type="button"
                            onClick={() => handleToggleFlair(flair.id)}
                            className="ml-1.5 hover:bg-black/10 rounded-full p-0.5 transition-colors"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </Badge>
            ))}

            {/* Add Tags Pill Trigger */}
            <Popover>
                <PopoverTrigger asChild disabled={disabled}>
                    <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold bg-muted text-muted-foreground hover:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    >
                        <Plus className="h-3 w-3" />
                        Add tags
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-[340px] p-4" align="start">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold">Select Flairs</h4>
                            {selectedFlairIds.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => onSelectFlairs([])}
                                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                                >
                                    <X className="h-3 w-3" />
                                    Clear all
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {CIVIC_FLAIRS.map((flair) => {
                                const isSelected = selectedFlairIds.includes(flair.id)
                                return (
                                    <Badge
                                        key={flair.id}
                                        variant={isSelected ? 'default' : 'outline'}
                                        className={cn(
                                            "cursor-pointer transition-all",
                                            isSelected
                                                ? "ring-2 ring-primary ring-offset-1"
                                                : cn(flair.bgColor, "border-transparent hover:scale-105")
                                        )}
                                        onClick={() => handleToggleFlair(flair.id)}
                                        title={flair.description}
                                    >
                                        <span className={isSelected ? '' : flair.color}>
                                            {flair.label}
                                        </span>
                                    </Badge>
                                )
                            })}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
