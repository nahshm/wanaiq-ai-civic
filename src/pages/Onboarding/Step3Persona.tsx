import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';

interface Step3PersonaProps {
  onNext: (data: { persona: string }) => void;
  onBack: () => void;
  initialData: { persona: string };
}

const personas = [
  {
    id: 'active_citizen',
    title: 'Regular Citizen',
    description: 'I want to access services and report issues',
    icon: '👤',
  },
  {
    id: 'youth_leader',
    title: 'Youth Leader',
    description: 'I want to mobilize youth and find opportunities',
    icon: '🚀',
  },
  {
    id: 'community_organizer',
    title: 'Community Organizer',
    description: 'I want to lead initiatives and track civic progress',
    icon: '🤝',
  },
  {
    id: 'business_owner',
    title: 'Business Owner',
    description: 'I want to find tenders, licenses, and business support',
    icon: '💼',
  },
  {
    id: 'journalist',
    title: 'Journalist',
    description: 'I need to verify facts, data, and government records',
    icon: '📰',
  },
  {
    id: 'government_watcher',
    title: 'Government Watcher',
    description: 'I want to track budgets, accountability, and government performance',
    icon: '🏛️',
  },
  {
    id: 'ngo_worker',
    title: 'NGO/CSO Worker',
    description: 'I want to coordinate development projects and advocacy',
    icon: '🌍',
  },
];

const Step3Persona = ({ onNext, onBack, initialData }: Step3PersonaProps) => {
  const [selectedPersona, setSelectedPersona] = useState(initialData.persona);
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!selectedPersona) return;
    setLoading(true);
    onNext({ persona: selectedPersona });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">How Do You Want to Engage?</h2>
          <p className="text-sm text-muted-foreground">
            This helps us personalize your experience
          </p>
        </div>
      </div>

      <RadioGroup value={selectedPersona} onValueChange={setSelectedPersona}>
        <div className="space-y-3">
          {personas.map((persona) => (
            <div
              key={persona.id}
              className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedPersona === persona.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setSelectedPersona(persona.id)}
            >
              <RadioGroupItem value={persona.id} id={persona.id} />
              <Label
                htmlFor={persona.id}
                className="flex gap-3 cursor-pointer flex-1"
              >
                <span className="text-3xl">{persona.icon}</span>
                <div>
                  <div className="font-semibold text-foreground">{persona.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {persona.description}
                  </div>
                </div>
              </Label>
            </div>
          ))}
        </div>
      </RadioGroup>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={!selectedPersona || loading}>
          Continue
        </Button>
      </div>
    </div>
  );
};

export default Step3Persona;
