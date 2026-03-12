import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, MapPin, Map, AlertTriangle, Loader2 } from 'lucide-react';
import { AdministrativeDivisionManager } from './AdministrativeDivisionManager';
import { InstitutionsManager } from './InstitutionsManager';

const SUPPORTED_COUNTRIES = [
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
];

export default function GovernanceSection() {
  const [selectedCountry, setSelectedCountry] = useState('KE');

  return (
    <div className="space-y-6">
      {/* Shared Country Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label className="text-sm font-semibold">Country:</Label>
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-[280px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_COUNTRIES.map(c => (
                  <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="geographic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="geographic" className="gap-2"><Map className="w-4 h-4" />Geographic Data</TabsTrigger>
          <TabsTrigger value="institutions" className="gap-2"><Building className="w-4 h-4" />Institutions</TabsTrigger>
        </TabsList>

        <TabsContent value="geographic">
          <GeographicDataPanel countryCode={selectedCountry} />
        </TabsContent>
        <TabsContent value="institutions">
          <InstitutionsManager countryCode={selectedCountry} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GeographicDataPanel({ countryCode }: { countryCode: string }) {
  const { data: templateData, isLoading } = useQuery({
    queryKey: ['governance-template', countryCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('country_governance_templates')
        .select('governance_system')
        .eq('country_code', countryCode)
        .maybeSingle();
      if (error) return null;
      return data?.governance_system;
    },
  });

  const levels: string[] = (templateData as any)?.levels || [];
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const getLevelMeta = (level: string, index: number) => {
    const meta = (templateData as any)?.[level] || {};
    return {
      label: meta.label || capitalize(level),
      labelPlural: meta.label_plural || `${meta.label || capitalize(level)}s`,
      count: meta.count,
      parentLevel: index > 0 ? levels[index - 1] : null,
    };
  };

  if (isLoading) {
    return (
      <Card><CardContent className="p-12 text-center">
        <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading governance template...</p>
      </CardContent></Card>
    );
  }

  if (!levels.length) {
    return (
      <Card><CardContent className="p-12 text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
        <h3 className="font-semibold text-lg mb-2">No Template Available</h3>
        <p className="text-sm text-muted-foreground">No governance template exists for this country.</p>
      </CardContent></Card>
    );
  }

  const defaultTab = levels[0];
  const iconForIndex = [Building, MapPin, Map, MapPin, Map];

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList className={`grid w-full`} style={{ gridTemplateColumns: `repeat(${Math.min(levels.length, 5)}, 1fr)` }}>
        {levels.map((level, i) => {
          const Icon = iconForIndex[i] || Map;
          const meta = getLevelMeta(level, i);
          return (
            <TabsTrigger key={level} value={level} className="gap-2">
              <Icon className="h-4 w-4" />{meta.labelPlural}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {levels.map((level, index) => {
        const meta = getLevelMeta(level, index);
        const parentMeta = meta.parentLevel ? getLevelMeta(meta.parentLevel, index - 1) : null;
        return (
          <TabsContent key={level} value={level}>
            <Card>
              <CardHeader>
                <CardTitle>{meta.labelPlural} Management</CardTitle>
                <CardDescription>
                  Manage {meta.labelPlural.toLowerCase()}
                  {meta.count && ` (Expected: ~${meta.count})`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdministrativeDivisionManager
                  countryCode={countryCode}
                  governanceLevel={level}
                  levelIndex={index + 1}
                  levelLabel={meta.label}
                  levelLabelPlural={meta.labelPlural}
                  parentLevelLabel={parentMeta?.label}
                />
              </CardContent>
            </Card>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
