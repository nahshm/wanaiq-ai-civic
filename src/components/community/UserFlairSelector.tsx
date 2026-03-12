import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// All 47 Kenyan Counties + Special Flairs (like r/Kenya)
const KENYAN_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet',
  'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado',
  'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga',
  'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia',
  'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit',
  'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi',
  'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
  'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River',
  'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga',
  'Wajir', 'West Pokot'
];

const SPECIAL_FLAIRS = ['Visiting', 'Diaspora'];

interface UserFlairSelectorProps {
  currentFlair: string | null;
  onFlairUpdated: () => void;
}

export const UserFlairSelector: React.FC<UserFlairSelectorProps> = ({
  currentFlair,
  onFlairUpdated
}) => {
  const { user } = useAuth();
  const authModal = useAuthModal();
  const { toast } = useToast();
  const [selectedFlair, setSelectedFlair] = useState<string | null>(currentFlair);
  const [isUpdating, setIsUpdating] = useState(false);

  const allFlairs = [...KENYAN_COUNTIES, ...SPECIAL_FLAIRS].sort();

  const handleUpdateFlair = async () => {
    if (!user) {
      authModal.open('login');
      return;
    }

    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from('profiles')
        .update({ user_flair: selectedFlair })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: selectedFlair
          ? `Your flair has been set to "${selectedFlair}"`
          : "Your flair has been removed",
      });

      onFlairUpdated();
    } catch (error) {
      console.error('Error updating flair:', error);
      toast({
        title: "Error",
        description: "Failed to update flair. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearFlair = async () => {
    if (!user) return;

    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from('profiles')
        .update({ user_flair: null })
        .eq('id', user.id);

      if (error) throw error;

      setSelectedFlair(null);
      toast({
        title: "Success",
        description: "Your flair has been removed",
      });

      onFlairUpdated();
    } catch (error) {
      console.error('Error clearing flair:', error);
      toast({
        title: "Error",
        description: "Failed to clear flair. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Current Flair Display */}
      {currentFlair && (
        <div className="flex items-center justify-between p-2 bg-gray-800 rounded-md">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <Badge variant="outline" className="border-blue-500 text-blue-400">
              {currentFlair}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFlair}
            disabled={isUpdating}
            className="h-6 w-6 p-0 hover:bg-gray-700"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Flair Selector */}
      <div className="space-y-2">
        <Select value={selectedFlair || ''} onValueChange={setSelectedFlair}>
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="Select your location" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 text-white max-h-[300px]">
            <SelectItem value="none" className="text-gray-400 italic">
              No flair
            </SelectItem>

            {/* Counties Section */}
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase">
              Counties
            </div>
            {KENYAN_COUNTIES.map((county) => (
              <SelectItem
                key={county}
                value={county}
                className="hover:bg-gray-700"
              >
                {county}
              </SelectItem>
            ))}

            {/* Special Flairs Section */}
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase border-t border-gray-700 mt-2">
              Other
            </div>
            {SPECIAL_FLAIRS.map((flair) => (
              <SelectItem
                key={flair}
                value={flair}
                className="hover:bg-gray-700"
              >
                {flair}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Update Button */}
        {selectedFlair !== currentFlair && (
          <Button
            onClick={handleUpdateFlair}
            disabled={isUpdating}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            {isUpdating ? 'Updating...' : 'Update Flair'}
          </Button>
        )}
      </div>

      {/* Helper Text */}
      <p className="text-xs text-gray-400">
        Your flair will be visible next to your username when you post or comment in this community.
      </p>
    </div>
  );
};