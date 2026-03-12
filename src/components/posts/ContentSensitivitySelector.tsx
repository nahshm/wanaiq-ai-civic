import { MessageSquare, AlertTriangle, AlertOctagon, ChevronDown } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type ContentSensitivity = 'public' | 'sensitive' | 'crisis'

interface SensitivityOption {
    value: ContentSensitivity
    label: string
    description: string
    icon: React.ElementType
    colorClass: string
    bgClass: string
}

const SENSITIVITY_OPTIONS: SensitivityOption[] = [
    {
        value: 'public',
        label: 'Public Discussion',
        description: 'Regular civic discussion',
        icon: MessageSquare,
        colorClass: 'text-blue-600',
        bgClass: 'bg-blue-50 border-blue-200'
    },
    {
        value: 'sensitive',
        label: 'Sensitive Topic',
        description: 'Corruption, human rights, etc.',
        icon: AlertTriangle,
        colorClass: 'text-yellow-600',
        bgClass: 'bg-yellow-50 border-yellow-200'
    },
    {
        value: 'crisis',
        label: 'Crisis Report',
        description: 'Urgent safety/emergency issue',
        icon: AlertOctagon,
        colorClass: 'text-red-600',
        bgClass: 'bg-red-50 border-red-200'
    }
]

interface ContentSensitivitySelectorProps {
    value: ContentSensitivity
    onValueChange: (value: ContentSensitivity) => void
    disabled?: boolean
}

export const ContentSensitivitySelector = ({
    value,
    onValueChange,
    disabled
}: ContentSensitivitySelectorProps) => {
    const selectedOption = SENSITIVITY_OPTIONS.find(opt => opt.value === value) || SENSITIVITY_OPTIONS[0];
    const SelectedIcon = selectedOption.icon;

    return (
        <Popover>
            <PopoverTrigger asChild disabled={disabled}>
                <button 
                  type="button" 
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border hover:bg-black/5 dark:hover:bg-white/10",
                    selectedOption.colorClass
                  )}
                >
                    <SelectedIcon className="h-3 w-3" strokeWidth={3} />
                    {value === 'public' ? 'Public' : selectedOption.label}
                    <ChevronDown className="h-3 w-3 opacity-50 ml-1" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-4" align="start">
                <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Content Sensitivity</h4>
                    <RadioGroup
                        value={value}
                        onValueChange={(v) => onValueChange(v as ContentSensitivity)}
                        disabled={disabled}
                        className="space-y-2"
                    >
                        {SENSITIVITY_OPTIONS.map((option) => {
                            const Icon = option.icon
                            const isSelected = value === option.value

                            return (
                                <label
                                    key={option.value}
                                    className={cn(
                                        'flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-all',
                                        isSelected
                                            ? `${option.bgClass} border-current`
                                            : 'bg-card hover:bg-accent border-border',
                                        disabled && 'opacity-50 cursor-not-allowed'
                                    )}
                                >
                                    <RadioGroupItem value={option.value} className="mt-1" disabled={disabled} />

                                    <div className="flex-1">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <Icon className={cn('h-4 w-4', option.colorClass)} />
                                            <span className="font-medium text-sm">{option.label}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {option.description}
                                        </p>
                                    </div>
                                </label>
                            )
                        })}
                    </RadioGroup>
                </div>
            </PopoverContent>
        </Popover>
    )
}
