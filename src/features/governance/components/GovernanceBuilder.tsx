import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Save, GripVertical, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Level {
    id: string;
    name: string; // "County"
    placeholder: string; // "e.g., Nairobi"
    count: number; // Estimated count
}

export function GovernanceBuilder() {
    const { user } = useAuth();
    const authModal = useAuthModal();
    const [countryName, setCountryName] = useState('');
    const [countryCode, setCountryCode] = useState('');
    const [flagEmoji, setFlagEmoji] = useState('🏳️');
    const [levels, setLevels] = useState<Level[]>([
        { id: '1', name: 'Nation', placeholder: 'Nation', count: 1 }
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Add a sub-level
    const addLevel = () => {
        const newId = (levels.length + 1).toString();
        setLevels([...levels, {
            id: newId,
            name: '',
            placeholder: 'e.g. State, Province, County',
            count: 0
        }]);
    };

    const removeLevel = (index: number) => {
        if (index === 0) return; // Prevent removing root
        const newLevels = [...levels];
        newLevels.splice(index, 1);
        setLevels(newLevels);
    };

    const updateLevel = (index: number, field: keyof Level, value: string | number) => {
        const newLevels = [...levels];
        newLevels[index] = { ...newLevels[index], [field]: value };
        setLevels(newLevels);
    };

    const handleSubmit = async () => {
        if (!user) {
            authModal.open('login');
            return;
        }
        if (!countryName || !countryCode || levels.length < 2) {
            toast.error("Please complete all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Construct JSONB
            const governanceSystem = {
                levels: levels.map(l => l.name.toLowerCase()),
                structure: levels.map(l => ({
                    name: l.name,
                    estimated_count: l.count
                }))
            };

            // 2. Insert into DB (Pending Verification)
            const { error } = await supabase
                .from('country_governance_templates')
                .insert({
                    country_name: countryName,
                    country_code: countryCode.toUpperCase(),
                    flag_emoji: flagEmoji,
                    governance_system: governanceSystem,
                    submitted_by: user.id,
                    is_verified: false // Enforced per plan
                });

            if (error) {
                if (error.code === '23505') {
                    toast.error("A template for this country code already exists.");
                } else {
                    toast.error("Submission failed: " + error.message);
                }
            } else {
                toast.success("Governance Template Submitted! Pending Admin Approval.");
                // Reset
                setCountryName('');
                setCountryCode('');
                setLevels([{ id: '1', name: 'Nation', placeholder: 'Nation', count: 1 }]);
            }

        } catch (err) {
            console.error(err);
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-3xl">
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Governance Structure Builder</CardTitle>
                    <CardDescription>
                        Define the political anatomy of a country. Help us map the world's governments.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Header Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Country Name</Label>
                            <Input
                                placeholder="e.g. Wakanda"
                                value={countryName}
                                onChange={e => setCountryName(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <Label>ISO Code (2-Char)</Label>
                                <Input
                                    placeholder="WK"
                                    maxLength={2}
                                    className="uppercase"
                                    value={countryCode}
                                    onChange={e => setCountryCode(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Flag Emoji</Label>
                                <Input
                                    placeholder="🏳️"
                                    value={flagEmoji}
                                    onChange={e => setFlagEmoji(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="text-lg font-semibold mb-2">Governance Hierarchy</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Define levels from top to bottom (e.g. Nation -&gt; State -&gt; District).
                        </p>

                        <div className="space-y-3">
                            {levels.map((level, index) => (
                                <div key={level.id} className="flex gap-2 items-center bg-muted/30 p-3 rounded-md border">
                                    <div className="cursor-grab text-muted-foreground">
                                        <GripVertical className="h-5 w-5" />
                                    </div>

                                    <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full text-xs font-bold text-primary">
                                        {index + 1}
                                    </div>

                                    <div className="flex-1 space-y-1">
                                        <Input
                                            placeholder={level.placeholder}
                                            value={level.name}
                                            onChange={(e) => updateLevel(index, 'name', e.target.value)}
                                            className="bg-background"
                                        />
                                    </div>

                                    {index > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive"
                                            onClick={() => removeLevel(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <Button onClick={addLevel} variant="outline" className="w-full mt-4 border-dashed">
                            <Plus className="h-4 w-4 mr-2" /> Add Sub-Level
                        </Button>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md flex gap-3 text-yellow-800 text-sm">
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        <div>
                            <p className="font-semibold">Review Process</p>
                            <p>Your template will be reviewed by administrators to ensure accuracy. Incorrect submissions may be rejected.</p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSubmit} disabled={isSubmitting} className="min-w-[150px]">
                            {isSubmitting ? 'Submitting...' : (
                                <>
                                    <Save className="h-4 w-4 mr-2" /> Submit Structure
                                </>
                            )}
                        </Button>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
