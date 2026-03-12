import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { queryPresets } from '@/lib/react-query-config';
import { useGeoLocation, SUPPORTED_COUNTRIES } from '@/hooks/useGeoLocation';
import { MapPin, Globe } from 'lucide-react';

interface Step1LocationProps {
  onNext: (data: { countyId: string; constituencyId: string; wardId: string }) => void;
  initialData: { countyId: string; constituencyId: string; wardId: string };
}

interface County {
  id: string;
  name: string;
}

interface Constituency {
  id: string;
  name: string;
}

interface Ward {
  id: string;
  name: string;
}

const Step1Location = ({ onNext, initialData }: Step1LocationProps) => {
  const [selectedCounty, setSelectedCounty] = useState(initialData.countyId);
  const [selectedConstituency, setSelectedConstituency] = useState(initialData.constituencyId);
  const [selectedWard, setSelectedWard] = useState(initialData.wardId);
  const [loading, setLoading] = useState(false);

  // Auto-detect user's country via GPS/IP (like TikTok)
  const geoLocation = useGeoLocation();
  const detectedCountry = geoLocation.countryCode || 'KE'; // Fallback to Kenya

  // Fetch top-level divisions (counties/states/provinces) for detected country
  const { data: counties = [] } = useQuery({
    queryKey: ['administrative_divisions', detectedCountry, 'level-0'],
    queryFn: async () => {
      const { data } = await supabase
        .from('administrative_divisions')
        .select('id, name, governance_level')
        .eq('country_code', detectedCountry) // Dynamic country!
        .eq('level_index', 1) // Top level (county/state/province)
        .order('name');
      return data || [];
    },
    enabled: !!detectedCountry && !geoLocation.isLoading,
    ...queryPresets.static, // Never refetch - geography data is static
  });

  // Fetch second-level divisions (constituencies/counties/districts) for selected top-level
  const { data: constituencies = [] } = useQuery({
    queryKey: ['administrative_divisions', detectedCountry, 'level-1', selectedCounty],
    queryFn: async () => {
      if (!selectedCounty) return [];
      const { data } = await supabase
        .from('administrative_divisions')
        .select('id, name, governance_level')
        .eq('country_code', detectedCountry)
        .eq('parent_id', selectedCounty) // Child of selected county/state
        .eq('level_index', 2) // Second level
        .order('name');
      return data || [];
    },
    enabled: !!selectedCounty && !!detectedCountry, // Only fetch when parent is selected
    ...queryPresets.static,
  });

  // Fetch third-level divisions (wards/cities/municipalities) for selected second-level
  const { data: wards = [] } = useQuery({
    queryKey: ['administrative_divisions', detectedCountry, 'level-2', selectedConstituency],
    queryFn: async () => {
      if (!selectedConstituency) return [];
      const { data } = await supabase
        .from('administrative_divisions')
        .select('id, name, governance_level')
        .eq('country_code', detectedCountry)
        .eq('parent_id', selectedConstituency) // Child of selected constituency/county
        .eq('level_index', 3) // Third level
        .order('name');
      return data || [];
    },
    enabled: !!selectedConstituency && !!detectedCountry, // Only fetch when parent is selected
    ...queryPresets.static,
  });

  // Reset child selections when parent changes
  const handleCountyChange = (value: string) => {
    setSelectedCounty(value);
    setSelectedConstituency(''); // Reset constituency when county changes
    setSelectedWard(''); // Reset ward
  };

  const handleConstituencyChange = (value: string) => {
    setSelectedConstituency(value);
    setSelectedWard(''); // Reset ward when constituency changes
  };

  const handleSubmit = async () => {
    if (!selectedCounty || !selectedConstituency || !selectedWard) return;

    setLoading(true);
    onNext({
      countyId: selectedCounty,
      constituencyId: selectedConstituency,
      wardId: selectedWard,
    });
  };

  // Get dynamic labels based on detected governance structure
  const level1Label = counties[0]?.governance_level || 'County';
  const level2Label = constituencies[0]?.governance_level || 'Constituency';
  const level3Label = wards[0]?.governance_level || 'Ward';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-lg">
          <MapPin className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Your Location</h2>
          <p className="text-sm text-muted-foreground">
            Help us connect you to your local community
          </p>
        </div>
      </div>

      {/* Country Detection Status */}
      {geoLocation.isLoading && (
        <Alert>
          <Globe className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Detecting your location...
          </AlertDescription>
        </Alert>
      )}

      {!geoLocation.isLoading && geoLocation.source && (
        <Alert className="bg-civic-green/10 border-civic-green/20">
          <Globe className="h-4 w-4 text-civic-green" />
          <AlertDescription className="text-sm">
            <strong>Location detected:</strong> {geoLocation.country || detectedCountry}
            {geoLocation.source === 'gps' && ' (via GPS)'}
            {geoLocation.source === 'ip' && ' (via IP address)'}
            {geoLocation.region && ` • ${geoLocation.region}`}
          </AlertDescription>
        </Alert>
      )}

      {/* Manual Country Override */}
      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Select value={detectedCountry} onValueChange={(code) => geoLocation.setManualLocation(code)}>
          <SelectTrigger id="country">
            <SelectValue placeholder="Select your country" />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_COUNTRIES.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                {country.flag} {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Auto-detected. You can change it manually if needed.
        </p>
      </div>

      <div className="space-y-4">
        {/* Level 1: County/State/Province */}
        <div className="space-y-2">
          <Label htmlFor="level1">{level1Label} *</Label>
          <Select
            value={selectedCounty}
            onValueChange={handleCountyChange}
            disabled={counties.length === 0 || geoLocation.isLoading}
          >
            <SelectTrigger id="level1">
              <SelectValue placeholder={`Select your ${level1Label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {counties.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Level 2: Constituency/County/District */}
        <div className="space-y-2">
          <Label htmlFor="level2">{level2Label} *</Label>
          <Select
            value={selectedConstituency}
            onValueChange={handleConstituencyChange}
            disabled={!selectedCounty || constituencies.length === 0}
          >
            <SelectTrigger id="level2">
              <SelectValue placeholder={`Select your ${level2Label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {constituencies.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Level 3: Ward/City/Municipality */}
        <div className="space-y-2">
          <Label htmlFor="level3">{level3Label} *</Label>
          <Select
            value={selectedWard}
            onValueChange={setSelectedWard}
            disabled={!selectedConstituency || wards.length === 0}
          >
            <SelectTrigger id="level3">
              <SelectValue placeholder={`Select your ${level3Label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {wards.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!selectedCounty || !selectedConstituency || !selectedWard || loading}
        className="w-full bg-civic-green hover:bg-civic-green/90"
      >
        {loading ? 'Saving...' : 'Continue'}
      </Button>
    </div>
  );
};

export default Step1Location;
