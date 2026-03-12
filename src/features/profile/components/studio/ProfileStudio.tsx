import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Palette, Sparkles, Image, RefreshCw, Save, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { ThemeSelector } from './ThemeSelector';
import { FrameSelector } from './FrameSelector';
import { useProfileCustomization } from '../../hooks/useProfileCustomization';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface ProfileStudioProps {
    userId: string;
    className?: string;
}

// Skeleton loader
const StudioSkeleton: React.FC = () => (
    <Card>
        <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48 mt-1" />
        </CardHeader>
        <CardContent className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
        </CardContent>
    </Card>
);

/**
 * ProfileStudio - Discord-style profile customization panel
 */
const ProfileStudioContent: React.FC<ProfileStudioProps> = ({
    userId,
    className,
}) => {
    const {
        customization,
        isLoading,
        isError,
        refetch,
        update,
        isUpdating,
        canUsePremium,
        themes,
        frameAnimations,
    } = useProfileCustomization({ userId });

    // Local state for edits
    const [localTheme, setLocalTheme] = useState<string | null>(null);
    const [localFrame, setLocalFrame] = useState<string | null | undefined>(undefined);
    const [localAccentColor, setLocalAccentColor] = useState<string | null>(null);

    // Get current values (prefer local edits over saved)
    const currentTheme = localTheme ?? customization?.theme ?? 'dark';
    const currentFrame = localFrame !== undefined ? localFrame : customization?.frameAnimation;
    const currentAccentColor = localAccentColor ?? customization?.accentColor ?? '#3B82F6';

    // Check for unsaved changes
    const hasChanges =
        localTheme !== null ||
        localFrame !== undefined ||
        localAccentColor !== null;

    // Save changes
    const handleSave = () => {
        update({
            theme: currentTheme,
            frameAnimation: currentFrame,
            accentColor: currentAccentColor,
        }, {
            onSuccess: () => {
                toast.success('Profile customization saved!');
                // Reset local state
                setLocalTheme(null);
                setLocalFrame(undefined);
                setLocalAccentColor(null);
            },
            onError: () => {
                toast.error('Failed to save customization');
            },
        });
    };

    // Reset changes
    const handleReset = () => {
        setLocalTheme(null);
        setLocalFrame(undefined);
        setLocalAccentColor(null);
    };

    if (isLoading) {
        return <StudioSkeleton />;
    }

    if (isError) {
        return (
            <Card className="border-destructive/50">
                <CardContent className="py-8 text-center">
                    <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                        Failed to load customization settings
                    </p>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const hasPremium = canUsePremium();

    return (
        <Card className={cn('overflow-hidden', className)}>
            <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-500" />
                            Profile Studio
                        </CardTitle>
                        <CardDescription>
                            Customize your civic identity
                        </CardDescription>
                    </div>
                    {!hasPremium && (
                        <Button variant="outline" size="sm" className="gap-1">
                            <Crown className="w-4 h-4 text-amber-500" />
                            Upgrade
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="pt-6">
                <Tabs defaultValue="theme" className="space-y-6">
                    <TabsList className="w-full justify-start">
                        <TabsTrigger value="theme" className="gap-1">
                            <Palette className="w-4 h-4" />
                            Theme
                        </TabsTrigger>
                        <TabsTrigger value="frame" className="gap-1">
                            <Sparkles className="w-4 h-4" />
                            Frame
                        </TabsTrigger>
                        <TabsTrigger value="colors" className="gap-1">
                            <Image className="w-4 h-4" />
                            Colors
                        </TabsTrigger>
                    </TabsList>

                    {/* Theme Tab */}
                    <TabsContent value="theme" className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Choose a theme that reflects your civic identity
                        </p>
                        <ThemeSelector
                            themes={themes}
                            selectedTheme={currentTheme}
                            onSelect={(id) => setLocalTheme(id)}
                            canUsePremium={hasPremium}
                        />
                    </TabsContent>

                    {/* Frame Tab */}
                    <TabsContent value="frame" className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Add an animated frame around your avatar
                        </p>
                        <FrameSelector
                            frames={frameAnimations}
                            selectedFrame={currentFrame}
                            onSelect={(id) => setLocalFrame(id)}
                            canUsePremium={hasPremium}
                        />
                    </TabsContent>

                    {/* Colors Tab */}
                    <TabsContent value="colors" className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Customize your accent color
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Label htmlFor="accent-color">Accent Color</Label>
                                <Input
                                    id="accent-color"
                                    type="color"
                                    value={currentAccentColor}
                                    onChange={(e) => setLocalAccentColor(e.target.value)}
                                    className="w-16 h-10 p-1 cursor-pointer"
                                />
                                <span className="text-sm text-muted-foreground font-mono">
                                    {currentAccentColor}
                                </span>
                            </div>

                            {/* Preset colors */}
                            <div className="flex flex-wrap gap-2">
                                {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setLocalAccentColor(color)}
                                        className={cn(
                                            'w-8 h-8 rounded-full border-2 transition-transform hover:scale-110',
                                            currentAccentColor === color && 'ring-2 ring-offset-2 ring-primary'
                                        )}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Action buttons */}
                {hasChanges && (
                    <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t">
                        <Button variant="ghost" size="sm" onClick={handleReset}>
                            Reset
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={isUpdating}
                        >
                            <Save className="w-4 h-4 mr-1" />
                            {isUpdating ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// Wrap with Error Boundary
export const ProfileStudio: React.FC<ProfileStudioProps> = (props) => (
    <ErrorBoundary componentName="ProfileStudio">
        <ProfileStudioContent {...props} />
    </ErrorBoundary>
);

export default ProfileStudio;
