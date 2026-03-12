import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

interface Community {
    id: string
    name: string
    display_name: string
    member_count: number
}

interface CommunitySelectorProps {
    communities: Community[]
    selectedCommunityId?: string
    onSelectCommunity: (communityId: string | undefined) => void
    disabled?: boolean
}

export const CommunitySelector = ({
    communities = [], // Default to empty array
    selectedCommunityId,
    onSelectCommunity,
    disabled = false,
}: CommunitySelectorProps) => {
    const [open, setOpen] = useState(false)

    const selectedCommunity = communities.find(
        (community) => community.id === selectedCommunityId
    )

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">
                Choose a community <span className="text-muted-foreground">(optional)</span>
            </label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                        disabled={disabled}
                    >
                        {selectedCommunity
                            ? `c/${selectedCommunity.name}`
                            : 'Post to your profile or select a community'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search communities..." />
                        <CommandList>
                            <CommandEmpty>No community found.</CommandEmpty>
                            <CommandGroup>
                                <CommandItem
                                    value="profile"
                                    onSelect={() => {
                                        onSelectCommunity(undefined)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            !selectedCommunityId ? 'opacity-100' : 'opacity-0'
                                        )}
                                    />
                                    Post to your profile
                                </CommandItem>
                                {communities && communities.length > 0 && communities.map((community) => (
                                    <CommandItem
                                        key={community.id}
                                        value={community.name}
                                        onSelect={() => {
                                            onSelectCommunity(
                                                community.id === selectedCommunityId ? undefined : community.id
                                            )
                                            setOpen(false)
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                selectedCommunityId === community.id
                                                    ? 'opacity-100'
                                                    : 'opacity-0'
                                            )}
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-medium">c/{community.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {community.display_name} · {(community.member_count ?? 0).toLocaleString()} members
                                            </span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {selectedCommunity && (
                <p className="text-xs text-muted-foreground">
                    Posting to c/{selectedCommunity.name}
                </p>
            )}
        </div>
    )
}