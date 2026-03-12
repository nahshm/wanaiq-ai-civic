
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const INTERESTS_OPTIONS = [
  { value: 'water', label: 'Water & Sanitation', icon: '💧' },
  { value: 'roads', label: 'Roads & Infrastructure', icon: '🛣️' },
  { value: 'health', label: 'Healthcare', icon: '🏥' },
  { value: 'education', label: 'Education', icon: '📚' },
  { value: 'security', label: 'Security', icon: '🚔' },
  { value: 'youth_employment', label: 'Youth & Jobs', icon: '💼' },
  { value: 'agriculture', label: 'Agriculture', icon: '🌾' },
  { value: 'environment', label: 'Environment', icon: '🌳' }
];

const ROLE_OPTIONS = [
  { value: 'citizen', label: 'Regular Citizen' },
  { value: 'youth_leader', label: 'Youth Leader' },
  { value: 'community_organizer', label: 'Community Organizer' },
  { value: 'business_owner', label: 'Business Owner' },
  { value: 'journalist', label: 'Journalist' },
  { value: 'official', label: 'Government Official' },
  { value: 'ngo_worker', label: 'NGO/CSO Worker' }
];

const KENYA_COUNTIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Uasin Gishu", "Kiambu", "Machakos", "Kajiado", 
  "Meru", "Nyeri", "Kilifi", "Kwale", "Taita Taveta", "Garissa", "Wajir", "Mandera", 
  "Marsabit", "Isiolo", "Tharaka Nithi", "Embu", "Kitui", "Makueni", "Nyandarua", 
  "Kirinyaga", "Murang'a", "Turkana", "West Pokot", "Samburu", "Trans Nzoia", "Elgeyo Marakwet", 
  "Nandi", "Baringo", "Laikipia", "Narok", "Kericho", "Bomet", "Kakamega", "Vihiga", 
  "Bungoma", "Busia", "Siaya", "Homa Bay", "Migori", "Kisii", "Nyamira", "Lamu", "Tana River"
];

interface UserProfile {
  full_name: string | null;
  county: string | null;
  ward: string | null;
  role: string | null;
  interests: string[] | null;
  preferred_language: string | null;
}

export function ProfileSetup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    county: '',
    ward: '',
    role: 'citizen',
    interests: [] as string[],
    preferred_language: 'en'
  });

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        const profile = data as unknown as UserProfile;
        
        if (profile) {
          setFormData({
            full_name: profile.full_name || '',
            county: profile.county || '',
            ward: profile.ward || '',
            role: profile.role || 'citizen',
            interests: profile.interests || [],
            preferred_language: profile.preferred_language || 'en'
          });
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  async function handleSubmit() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...formData, // Spread all fields
          updated_at: new Date().toISOString()
        });
      
      // If triggered from CivicChat, go back there
      const returnUrl = searchParams.get('return') || '/civic-assistant';
      navigate(returnUrl);
    }
    setLoading(false);
  }

  if (loading) return <div className="p-8 text-center">Loading profile...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white min-h-screen">
      <div className="mb-8 pt-8">
        <h1 className="text-3xl font-bold text-gray-900">Personalize Your Experience</h1>
        <p className="text-gray-600 mt-2">
          Update your profile to get tailored civic guidance and location-specific answers.
        </p>
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Your Name</Label>
            <Input
              type="text"
              value={formData.full_name}
              onChange={e => setFormData({...formData, full_name: e.target.value})}
              placeholder="e.g., Mary Wanjiku"
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label>County</Label>
            <Select 
                value={formData.county} 
                onValueChange={(val) => setFormData({...formData, county: val})}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select County..." />
              </SelectTrigger>
              <SelectContent>
                {KENYA_COUNTIES.sort().map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ward (Optional)</Label>
            <Input
              type="text"
              value={formData.ward}
              onChange={e => setFormData({...formData, ward: e.target.value})}
              placeholder="e.g., Kibera"
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label>Preferred Language</Label>
            <div className="flex gap-4">
               <Button 
                variant={formData.preferred_language === 'en' ? 'default' : 'outline'}
                onClick={() => setFormData({...formData, preferred_language: 'en'})}
                className="flex-1"
               >
                 English
               </Button>
               <Button 
                variant={formData.preferred_language === 'sw' ? 'default' : 'outline'}
                onClick={() => setFormData({...formData, preferred_language: 'sw'})}
                className="flex-1"
               >
                 Kiswahili
               </Button>
            </div>
          </div>

          <Button
            onClick={() => setStep(2)}
            disabled={!formData.county}
            className="w-full mt-4"
          >
            Next: Role & Interests
          </Button>
        </div>
      )}

      {/* Step 2: Role & Interests */}
      {step === 2 && (
        <div className="space-y-8">
          <div className="space-y-3">
            <Label className="text-base font-semibold">I am mostly a...</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ROLE_OPTIONS.map(role => (
                <button
                  key={role.value}
                  onClick={() => setFormData({...formData, role: role.value})}
                  className={`p-3 border rounded-lg text-left transition-all ${
                    formData.role === role.value 
                      ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                    <div className="font-medium text-gray-900">{role.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">
              I'm interested in... (select up to 3)
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INTERESTS_OPTIONS.map(interest => (
                <button
                  key={interest.value}
                  onClick={() => {
                    const current = formData.interests;
                    if (current.includes(interest.value)) {
                      setFormData({
                        ...formData, 
                        interests: current.filter(i => i !== interest.value)
                      });
                    } else if (current.length < 3) {
                      setFormData({
                        ...formData,
                        interests: [...current, interest.value]
                      });
                    }
                  }}
                  className={`p-3 border rounded-lg text-left transition-all flex items-center gap-2 ${
                    formData.interests.includes(interest.value)
                      ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${formData.interests.length >= 3 && !formData.interests.includes(interest.value) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={formData.interests.length >= 3 && !formData.interests.includes(interest.value)}
                >
                  <span className="text-xl">{interest.icon}</span>
                  <span className="font-medium text-gray-900">{interest.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {formData.interests.length}/3 selected
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
