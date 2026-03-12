import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CivicClipsFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyFilters: (filters: ClipsFilters) => void;
    currentFilters: ClipsFilters;
}

export interface ClipsFilters {
    location?: {
        county?: string;
        constituency?: string;
        ward?: string;
    };
    sortBy?: 'recent' | 'popular' | 'views';
    category?: string;
}

export function CivicClipsFilterModal({
    isOpen,
    onClose,
    onApplyFilters,
    currentFilters,
}: CivicClipsFilterModalProps) {
    const [filters, setFilters] = useState<ClipsFilters>(currentFilters);
    const [activeFiltersCount, setActiveFiltersCount] = useState(0);

    const handleApply = () => {
        // Count active filters
        let count = 0;
        if (filters.location?.county) count++;
        if (filters.location?.constituency) count++;
        if (filters.location?.ward) count++;
        if (filters.sortBy && filters.sortBy !== 'recent') count++;
        if (filters.category) count++;
        setActiveFiltersCount(count);

        onApplyFilters(filters);
        onClose();
    };

    const handleClear = () => {
        const clearedFilters: ClipsFilters = {
            sortBy: 'recent',
        };
        setFilters(clearedFilters);
        setActiveFiltersCount(0);
        onApplyFilters(clearedFilters);
    };

    const updateLocation = (key: 'county' | 'constituency' | 'ward', value: string) => {
        setFilters(prev => ({
            ...prev,
            location: {
                ...prev.location,
                [key]: value === 'all' ? undefined : value,
            },
        }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            <DialogTitle>Filter CivicClips</DialogTitle>
                        </div>
                        {activeFiltersCount > 0 && (
                            <Badge variant="secondary" className="ml-auto">
                                {activeFiltersCount} active
                            </Badge>
                        )}
                    </div>
                    <DialogDescription>
                        Refine your search to find relevant civic action clips
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Location Filters */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold">Location</Label>
                        
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">County</Label>
                            <Select
                                value={filters.location?.county || 'all'}
                                onValueChange={(value) => updateLocation('county', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Counties" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Counties</SelectItem>
                                    <SelectItem value="nairobi">Nairobi</SelectItem>
                                    <SelectItem value="mombasa">Mombasa</SelectItem>
                                    <SelectItem value="kisumu">Kisumu</SelectItem>
                                    {/* TODO: Load from database */}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Constituency</Label>
                            <Select
                                value={filters.location?.constituency || 'all'}
                                onValueChange={(value) => updateLocation('constituency', value)}
                                disabled={!filters.location?.county}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Constituencies" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Constituencies</SelectItem>
                                    {/* TODO: Filter by selected county */}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Ward</Label>
                            <Select
                                value={filters.location?.ward || 'all'}
                                onValueChange={(value) => updateLocation('ward', value)}
                                disabled={!filters.location?.constituency}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Wards" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Wards</SelectItem>
                                    {/* TODO: Filter by selected constituency */}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Sort By */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">Sort By</Label>
                        <Select
                            value={filters.sortBy || 'recent'}
                            onValueChange={(value: 'recent' | 'popular' | 'views') =>
                                setFilters(prev => ({ ...prev, sortBy: value }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="recent">Most Recent</SelectItem>
                                <SelectItem value="popular">Most Popular</SelectItem>
                                <SelectItem value="views">Most Viewed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">Category</Label>
                        <Select
                            value={filters.category || 'all'}
                            onValueChange={(value) =>
                                setFilters(prev => ({
                                    ...prev,
                                    category: value === 'all' ? undefined : value,
                                }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="infrastructure">Infrastructure</SelectItem>
                                <SelectItem value="education">Education</SelectItem>
                                <SelectItem value="healthcare">Healthcare</SelectItem>
                                <SelectItem value="security">Security</SelectItem>
                                <SelectItem value="environment">Environment</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-3 pt-4 border-t">
                    <Button
                        variant="ghost"
                        onClick={handleClear}
                        className="gap-2"
                        disabled={activeFiltersCount === 0}
                    >
                        <X className="h-4 w-4" />
                        Clear All
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleApply}>
                            Apply Filters
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
