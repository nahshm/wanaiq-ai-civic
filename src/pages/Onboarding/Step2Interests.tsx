import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Heart } from 'lucide-react';

interface Step2InterestsProps {
  onNext: (data: { interests: string[] }) => void;
  onBack: () => void;
  initialData: { interests: string[] };
}

interface CivicInterest {
  id: string;
  name: string;
  display_name: string;
  icon: string;
  category: string;
}

const Step2Interests = ({ onNext, onBack, initialData }: Step2InterestsProps) => {
  const [interests, setInterests] = useState<CivicInterest[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(initialData.interests);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInterests();
  }, []);

  const loadInterests = async () => {
    const { data } = await supabase
      .from('civic_interests')
      .select('*')
      .order('sort_order');
    
    if (data) setInterests(data);
  };

  const toggleInterest = (interestId: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((id) => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleSubmit = () => {
    setLoading(true);
    onNext({ interests: selectedInterests });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Heart className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">What Matters to You?</h2>
          <p className="text-sm text-muted-foreground">
            Select topics you care about (choose at least 3)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {interests.map((interest) => (
          <div
            key={interest.id}
            className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedInterests.includes(interest.id)
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => toggleInterest(interest.id)}
          >
            <Checkbox
              checked={selectedInterests.includes(interest.id)}
              onCheckedChange={() => toggleInterest(interest.id)}
            />
            <Label className="flex items-center gap-2 cursor-pointer flex-1">
              <span className="text-2xl">{interest.icon}</span>
              <span className="text-sm font-medium">{interest.display_name}</span>
            </Label>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={selectedInterests.length < 3 || loading}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default Step2Interests;
