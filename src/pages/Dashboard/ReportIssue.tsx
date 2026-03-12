import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
    Droplet,
    Car,
    Trash2,
    Lightbulb,
    Shield,
    Home,
    AlertCircle,
    Building,
    ArrowLeft
} from 'lucide-react';

const ISSUE_CATEGORIES = [
    { id: 'water', label: 'Water', icon: Droplet, color: 'bg-blue-500', level: 'ward' },
    { id: 'roads', label: 'Roads', icon: Car, color: 'bg-gray-500', level: 'county' },
    { id: 'garbage', label: 'Garbage', icon: Trash2, color: 'bg-green-500', level: 'ward' },
    { id: 'street_lights', label: 'Street Lights', icon: Lightbulb, color: 'bg-yellow-500', level: 'ward' },
    { id: 'security', label: 'Security', icon: Shield, color: 'bg-red-500', level: 'national' },
    { id: 'housing', label: 'Housing', icon: Home, color: 'bg-purple-500', level: 'county' },
    { id: 'health', label: 'Health', icon: Building, color: 'bg-pink-500', level: 'county' },
];

const ReportIssue = () => {
    const { user } = useAuth();
    const authModal = useAuthModal();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            authModal.open('login');
            return;
        }

        if (!selectedCategory || !title || !description) {
            toast({
                title: "Error",
                description: "Please fill in all required fields",
                variant: "destructive"
            });
            return;
        }

        setSubmitting(true);

        try {
            // Get user's location
            const { data: profile } = await supabase
                .from('profiles')
                .select('ward_id, constituency_id, county_id')
                .eq('id', user.id)
                .single();

            const category = ISSUE_CATEGORIES.find(c => c.id === selectedCategory);
            const actionLevel = category?.level || 'ward';

            // Create civic action
            const { data: action, error } = await supabase
                .from('civic_actions')
                .insert({
                    user_id: user.id,
                    action_type: 'report_issue',
                    action_level: actionLevel,
                    category: selectedCategory,
                    title,
                    description,
                    urgency,
                    location_text: location || null,
                    ward_id: profile?.ward_id,
                    constituency_id: profile?.constituency_id,
                    county_id: profile?.county_id,
                })
                .select()
                .single();

            if (error) throw error;

            toast({
                title: "Issue Reported Successfully!",
                description: `Case number: ${action.case_number}`,
            });

            navigate('/dashboard');
        } catch (error) {
            console.error('Error reporting issue:', error);
            toast({
                title: "Error",
                description: "Failed to submit report. Please try again.",
                variant: "destructive"
            });
        } finally {
            setSubmitting(false);
        }
    };

    const selectedCategoryData = ISSUE_CATEGORIES.find(c => c.id === selectedCategory);

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-4">
            {/* Back Button */}
            <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="gap-2"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-6 h-6" />
                        Report an Issue
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Report issues in your area and track their resolution
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Category Selection */}
                        <div>
                            <Label>Issue Category *</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                                {ISSUE_CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${selectedCategory === cat.id
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border hover:border-primary/50'
                                            }`}
                                    >
                                        <cat.icon className={`w-8 h-8 ${cat.color} text-white rounded p-1.5`} />
                                        <span className="text-sm font-medium">{cat.label}</span>
                                        <span className="text-xs text-muted-foreground capitalize">
                                            {cat.level} level
                                        </span>
                                    </button>
                                ))}
                            </div>
                            {selectedCategoryData && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    This will be routed to <strong>{selectedCategoryData.level}</strong> level authorities
                                </p>
                            )}
                        </div>

                        {/* Title */}
                        <div>
                            <Label htmlFor="title">Issue Title *</Label>
                            <Input
                                id="title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Brief description of the issue"
                                required
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <Label htmlFor="location">Specific Location</Label>
                            <Input
                                id="location"
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="e.g., Corner of Thika Road and Outer Ring Road"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Optional - Provide exact location if known
                            </p>
                        </div>

                        {/* Description */}
                        <div>
                            <Label htmlFor="description">Full Description *</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Provide details about the issue, impact, and any other relevant information"
                                rows={5}
                                required
                            />
                        </div>

                        {/* Urgency */}
                        <div>
                            <Label>Urgency Level</Label>
                            <div className="flex gap-2 mt-2">
                                <Button
                                    type="button"
                                    variant={urgency === 'low' ? 'default' : 'outline'}
                                    onClick={() => setUrgency('low')}
                                    size="sm"
                                >
                                    Low
                                </Button>
                                <Button
                                    type="button"
                                    variant={urgency === 'medium' ? 'default' : 'outline'}
                                    onClick={() => setUrgency('medium')}
                                    size="sm"
                                >
                                    Medium
                                </Button>
                                <Button
                                    type="button"
                                    variant={urgency === 'high' ? 'destructive' : 'outline'}
                                    onClick={() => setUrgency('high')}
                                    size="sm"
                                >
                                    High
                                </Button>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex gap-3">
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="flex-1"
                            >
                                {submitting ? 'Submitting...' : 'Submit Report'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/dashboard')}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ReportIssue;
