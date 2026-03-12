import { useState, useEffect } from 'react';

interface GeoLocation {
    country: string | null;
    countryCode: string | null;
    region: string | null; // State/Province/County
    city: string | null;
    latitude: number | null;
    longitude: number | null;
    source: 'gps' | 'ip' | 'profile' | 'manual' | null;
    isLoading: boolean;
    error: string | null;
}

interface UseGeoLocationOptions {
    enableGPS?: boolean;
    fallbackToIP?: boolean;
    useProfileLocation?: boolean;
    userId?: string;
}

// IP Geolocation API (free, no API key required)
const IP_GEO_API = 'https://ipapi.co/json/';

// Country code to name mapping
const COUNTRY_CODES: Record<string, string> = {
    KE: 'Kenya',
    UG: 'Uganda',
    TZ: 'Tanzania',
    RW: 'Rwanda',
    NG: 'Nigeria',
    GH: 'Ghana',
    ZA: 'South Africa',
    ET: 'Ethiopia',
    US: 'United States',
    GB: 'United Kingdom',
};

/**
 * System-wide geolocation hook for auto-detecting user location
 * Used for: Officials page, Feed recommendations, User registration, Live content
 * 
 * Priority: GPS → IP → Profile → Manual selection
 */
export function useGeoLocation(options: UseGeoLocationOptions = {}): GeoLocation & {
    setManualLocation: (countryCode: string) => void;
    refresh: () => void;
} {
    const {
        enableGPS = true,
        fallbackToIP = true,
        useProfileLocation = true,
        userId,
    } = options;

    const [location, setLocation] = useState<GeoLocation>({
        country: null,
        countryCode: null,
        region: null,
        city: null,
        latitude: null,
        longitude: null,
        source: null,
        isLoading: true,
        error: null,
    });

    // Fetch location from IP API
    const fetchIPLocation = async (): Promise<GeoLocation | null> => {
        try {
            const response = await fetch(IP_GEO_API);
            if (!response.ok) throw new Error('IP geolocation failed');

            const data = await response.json();

            return {
                country: data.country_name || null,
                countryCode: data.country_code || null,
                region: data.region || null,
                city: data.city || null,
                latitude: data.latitude || null,
                longitude: data.longitude || null,
                source: 'ip',
                isLoading: false,
                error: null,
            };
        } catch (error) {
            console.warn('IP geolocation failed:', error);
            return null;
        }
    };

    // Get GPS location
    const fetchGPSLocation = (): Promise<GeoLocation | null> => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve(null);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;

                    // Reverse geocode to get country (using free API)
                    try {
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=3`
                        );
                        const data = await response.json();

                        const countryCode = data.address?.country_code?.toUpperCase() || null;

                        resolve({
                            country: COUNTRY_CODES[countryCode] || data.address?.country || null,
                            countryCode,
                            region: data.address?.state || data.address?.county || null,
                            city: data.address?.city || data.address?.town || null,
                            latitude,
                            longitude,
                            source: 'gps',
                            isLoading: false,
                            error: null,
                        });
                    } catch {
                        // GPS coordinates but no reverse geocoding
                        resolve({
                            country: null,
                            countryCode: null,
                            region: null,
                            city: null,
                            latitude,
                            longitude,
                            source: 'gps',
                            isLoading: false,
                            error: null,
                        });
                    }
                },
                () => {
                    // GPS denied or failed
                    resolve(null);
                },
                { timeout: 10000, enableHighAccuracy: false }
            );
        });
    };

    // Main detection function
    const detectLocation = async () => {
        setLocation(prev => ({ ...prev, isLoading: true, error: null }));

        // Try GPS first (most accurate)
        if (enableGPS) {
            const gpsLocation = await fetchGPSLocation();
            if (gpsLocation?.countryCode) {
                setLocation(gpsLocation);
                // Cache the detected location
                localStorage.setItem('detected_location', JSON.stringify(gpsLocation));
                return;
            }
        }

        // Fallback to IP geolocation
        if (fallbackToIP) {
            const ipLocation = await fetchIPLocation();
            if (ipLocation?.countryCode) {
                setLocation(ipLocation);
                localStorage.setItem('detected_location', JSON.stringify(ipLocation));
                return;
            }
        }

        // Check cached location
        const cached = localStorage.getItem('detected_location');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                setLocation({ ...parsed, isLoading: false });
                return;
            } catch { }
        }

        // Default to Kenya if nothing else works
        setLocation({
            country: 'Kenya',
            countryCode: 'KE',
            region: null,
            city: null,
            latitude: null,
            longitude: null,
            source: 'manual',
            isLoading: false,
            error: 'Could not detect location, defaulting to Kenya',
        });
    };

    // Manual location setter
    const setManualLocation = (countryCode: string) => {
        const newLocation: GeoLocation = {
            country: COUNTRY_CODES[countryCode] || countryCode,
            countryCode,
            region: null,
            city: null,
            latitude: null,
            longitude: null,
            source: 'manual',
            isLoading: false,
            error: null,
        };
        setLocation(newLocation);
        localStorage.setItem('detected_location', JSON.stringify(newLocation));
        localStorage.setItem('manual_country', countryCode);
    };

    // Initial detection
    useEffect(() => {
        // Check if user has manually set a location
        const manualCountry = localStorage.getItem('manual_country');
        if (manualCountry) {
            setManualLocation(manualCountry);
            return;
        }

        detectLocation();
    }, []);

    return {
        ...location,
        setManualLocation,
        refresh: detectLocation,
    };
}

// Export country list for dropdowns
export const SUPPORTED_COUNTRIES = [
    { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
    { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
    { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
    { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
];

export default useGeoLocation;
