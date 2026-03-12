import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, CheckCircle, Upload, Globe, Building, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { GovernanceTemplate, GovernmentPosition } from '@/types/governance';

// Validation Schema
const claimSchema = z.object({
    country: z.string().min(1, "Select your country"),
    position_level: z.string().min(1, "Select governance level"),
    position_title: z.string().min(1, "Select position"),
    term_start_date: z.string().min(1, "Enter term start date"),
    term_end_date: z.string().min(1, "Enter term end date"),
    verification_method: z.enum(['email_verification', 'document_upload', 'official_link']),
    proof_document_url: z.string().optional(),
    official_email: z.string().email().optional(),
    official_website: z.string().url().optional(),
});

type ClaimFormData = z.infer<typeof claimSchema>;

export function PositionClaimWizard() {
    const { user } = useAuth();
    const authModal = useAuthModal();
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedCountry, setSelectedCountry] = useState<string>('');
    const [availablePositions, setAvailablePositions] = useState<GovernmentPosition[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ClaimFormData>({
        resolver: zodResolver(claimSchema),
        defaultValues: {
            verification_method: 'document_upload',
        },
    });

    // Load positions for selected country/level
    const loadPositions = async (countryCode: string, level: string) => {
        if (!countryCode || !level) return;

        const { data, error } = await supabase
            .from('government_positions')
            .select('*')
            .eq('country_code', countryCode)
            .eq('governance_level', level)
            .order('title');

        if (error) {
            toast.error('Failed to load positions');
            return;
        }
        setAvailablePositions(data || []);
    };

    const onSubmit = async (data: ClaimFormData) => {
        if (!user) {
            authModal.open('login');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Find the position ID
            const position = availablePositions.find(p => p.title === data.position_title);
            if (!position) {
                toast.error('Position not found');
                return;
            }

            // 2. Check if already claimed (Active)
            const { data: existing } = await supabase
                .from('office_holders')
                .select('id')
                .eq('position_id', position.id)
                .eq('is_active', true)
                .maybeSingle();

            if (existing) {
                toast.error('This position is already claimed by another active official.');
                return;
            }

            // 3. Submit Claim
            const { error: claimError } = await supabase
                .from('office_holders')
                .insert({
                    position_id: position.id,
                    user_id: user.id,
                    term_start: data.term_start_date,
                    term_end: data.term_end_date,
                    verification_status: 'pending',
                    verification_method: data.verification_method,
                    proof_documents: {
                        document_url: data.proof_document_url,
                        official_email: data.official_email,
                        official_website: data.official_website,
                        claimed_at: new Date().toISOString(),
                    }
                });

            if (claimError) {
                console.error(claimError);
                toast.error('Failed to submit claim: ' + claimError.message);
                return;
            }

            toast.success('Position claim submitted for verification!');
            // Redirect or Reset
            setCurrentStep(1);
            form.reset();

        } catch (error) {
            console.error(error);
            toast.error('An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const steps = [
        { number: 1, title: 'Country', icon: <Globe className="w-4 h-4" /> },
        { number: 2, title: 'Position', icon: <Building className="w-4 h-4" /> },
        { number: 3, title: 'Verify', icon: <Shield className="w-4 h-4" /> },
        { number: 4, title: 'Submit', icon: <UserCheck className="w-4 h-4" /> },
    ];

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <UserCheck className="h-6 w-6 text-primary" />
                        Claim Government Position
                    </CardTitle>
                    <CardDescription>
                        Verify your official role to access government features and represent your constituents.
                    </CardDescription>
                </CardHeader>

                {/* Stepper */}
                <div className="px-6 py-4 border-b bg-muted/20">
                    <div className="flex items-center justify-between">
                        {steps.map((step) => (
                            <div key={step.number} className="flex flex-col items-center flex-1 relative">
                                <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors z-10
                                    ${currentStep >= step.number
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background text-muted-foreground border-muted'
                                    }
                                `}>
                                    {step.icon}
                                </div>
                                <span className={`text-xs mt-2 font-medium ${currentStep >= step.number ? 'text-primary' : 'text-muted-foreground'}`}>
                                    {step.title}
                                </span>
                                {/* Connector Line (Optional) */}
                                {step.number !== steps.length && (
                                    <div className={`absolute top-5 left-1/2 w-full h-[2px] -z-0 
                                        ${currentStep > step.number ? 'bg-primary' : 'bg-muted'}`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <CardContent className="p-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            {/* Step 1: Country & Level */}
                            {currentStep === 1 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <FormField
                                        control={form.control}
                                        name="country"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Select Country</FormLabel>
                                                <Select
                                                    onValueChange={(val) => {
                                                        field.onChange(val);
                                                        setSelectedCountry(val);
                                                    }}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Choose a country" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="KE">🇰🇪 Kenya</SelectItem>
                                                        <SelectItem value="NG">🇳🇬 Nigeria</SelectItem>
                                                        <SelectItem value="ZA">🇿🇦 South Africa</SelectItem>
                                                        <SelectItem value="RW">🇷🇼 Rwanda</SelectItem>
                                                        <SelectItem value="TZ">🇹🇿 Tanzania</SelectItem>
                                                        <SelectItem value="US">🇺🇸 United States</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    Don't see your country? use the <span className="font-semibold underline cursor-pointer">Governance Builder</span> to add it.
                                                </p>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="position_level"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Governance Level</FormLabel>
                                                <Select
                                                    onValueChange={(val) => {
                                                        field.onChange(val);
                                                        loadPositions(selectedCountry, val);
                                                    }}
                                                    value={field.value}
                                                    disabled={!selectedCountry}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select level (National, County...)" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="nation">National / Federal</SelectItem>
                                                        <SelectItem value="state">State / Province</SelectItem>
                                                        <SelectItem value="county">County / District</SelectItem>
                                                        <SelectItem value="constituency">Constituency / City</SelectItem>
                                                        <SelectItem value="ward">Ward / Local</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="flex justify-end pt-4">
                                        <Button type="button" onClick={() => setCurrentStep(2)} disabled={!form.watch('country') || !form.watch('position_level')}>
                                            Next Step
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Specific Position */}
                            {currentStep === 2 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <FormField
                                        control={form.control}
                                        name="position_title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Official Position</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select your specific position" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {availablePositions.length > 0 ? (
                                                            availablePositions.map((pos) => (
                                                                <SelectItem key={pos.id} value={pos.title}>
                                                                    {pos.title}
                                                                </SelectItem>
                                                            ))
                                                        ) : (
                                                            <div className="p-2 text-sm text-muted-foreground text-center">
                                                                No positions found. Ensure database is seeded.
                                                            </div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>Select the exact title of the office you hold.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="flex justify-between pt-4">
                                        <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>Back</Button>
                                        <Button type="button" onClick={() => setCurrentStep(3)} disabled={!form.watch('position_title')}>
                                            Next Step
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Verification */}
                            {currentStep === 3 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                                        <Shield className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-blue-900 text-sm">Verification Required</h4>
                                            <p className="text-xs text-blue-700 mt-1">
                                                To prevent impersonation, please provide proof of your official position.
                                                This information is strictly confidential and reviewed by admins.
                                            </p>
                                        </div>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="verification_method"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Verification Method</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="document_upload">Upload Official Document (ID, Letter)</SelectItem>
                                                        <SelectItem value="email_verification">Official Government Email</SelectItem>
                                                        <SelectItem value="official_link">Link to Official Theory Profile</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {form.watch('verification_method') === 'document_upload' && (
                                        <FormField
                                            control={form.control}
                                            name="proof_document_url"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Document URL (Temporary)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="In real app, this would be a file upload" {...field} />
                                                    </FormControl>
                                                    <FormDescription>Upload appointment letter or election certificate.</FormDescription>
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    {form.watch('verification_method') === 'email_verification' && (
                                        <FormField
                                            control={form.control}
                                            name="official_email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Official Email</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="name@government.go.ke" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    <div className="flex justify-between pt-4">
                                        <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>Back</Button>
                                        <Button type="button" onClick={() => setCurrentStep(4)}>Next Step</Button>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Term & Submit */}
                            {currentStep === 4 && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="term_start_date"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Term Start</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="term_end_date"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Term End (Expected)</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-green-900 text-sm">Ready to Submit</h4>
                                            <p className="text-xs text-green-700 mt-1">
                                                Once verified, you'll receive the official badge and access to position-specific tools.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between pt-4">
                                        <Button type="button" variant="outline" onClick={() => setCurrentStep(3)}>Back</Button>
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting ? 'Submitting...' : 'Submit Claim'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
