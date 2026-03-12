import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CountiesManager } from "./components/CountiesManager";
import { ConstituenciesManager } from "./components/ConstituenciesManager";
import { WardsManager } from "./components/WardsManager";
import { MapPin, Building2, Landmark } from "lucide-react";

export default function GeographicDataAdmin() {
  const [countryCode, setCountryCode] = useState("KE");

  const SUPPORTED_COUNTRIES = [
    { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Geographic Data Management</h1>
        <p className="text-muted-foreground mt-2">Manage counties, constituencies, and wards</p>
      </div>

      {/* Country Selector */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label>Country:</Label>
            <Select value={countryCode} onValueChange={setCountryCode}>
              <SelectTrigger className="w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_COUNTRIES.map(country => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="counties" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="counties" className="flex items-center gap-2">
            <Landmark className="h-4 w-4" />
            Counties
          </TabsTrigger>
          <TabsTrigger value="constituencies" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Constituencies
          </TabsTrigger>
          <TabsTrigger value="wards" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Wards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="counties">
          <Card>
            <CardHeader>
              <CardTitle>Counties Management</CardTitle>
              <CardDescription>View, add, edit, and delete counties</CardDescription>
            </CardHeader>
            <CardContent>
              <CountiesManager countryCode={countryCode} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="constituencies">
          <Card>
            <CardHeader>
              <CardTitle>Constituencies Management</CardTitle>
              <CardDescription>View, add, edit, and delete constituencies</CardDescription>
            </CardHeader>
            <CardContent>
              <ConstituenciesManager countryCode={countryCode} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wards">
          <Card>
            <CardHeader>
              <CardTitle>Wards Management</CardTitle>
              <CardDescription>View, add, edit, and delete wards</CardDescription>
            </CardHeader>
            <CardContent>
              <WardsManager countryCode={countryCode} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
