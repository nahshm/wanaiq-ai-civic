import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Shield, Eye, EyeOff, Users, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PrivacySettings {
  show_voting_activity: boolean;
  show_community_membership: boolean;
  allow_contact: boolean;
  [key: string]: boolean; // Allow string indexing for JSON compatibility
}

export const PrivacySettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>({
    show_voting_activity: false,
    show_community_membership: false,
    allow_contact: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadPrivacySettings();
    }
  }, [user]);

  const loadPrivacySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('privacy_settings')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data?.privacy_settings) {
        const settings = data.privacy_settings as Record<string, any>;
        setSettings({
          show_voting_activity: settings.show_voting_activity ?? false,
          show_community_membership: settings.show_community_membership ?? false,
          allow_contact: settings.allow_contact ?? true
        });
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
      toast.error('Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const updatePrivacySettings = async (newSettings: PrivacySettings) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ privacy_settings: newSettings as any })
        .eq('id', user?.id);

      if (error) throw error;

      setSettings(newSettings);
      toast.success('Privacy settings updated successfully');
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast.error('Failed to update privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key: keyof PrivacySettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    updatePrivacySettings(newSettings);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="text-muted-foreground">Loading privacy settings...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Privacy Settings
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Control what information is visible to other users on the platform.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Voting Activity */}
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-muted rounded-lg">
              {settings.show_voting_activity ? (
                <Eye className="w-4 h-4 text-primary" />
              ) : (
                <EyeOff className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="font-medium">Show Voting Activity</h3>
              <p className="text-sm text-muted-foreground">
                Allow others to see your upvotes and downvotes on posts and comments
              </p>
            </div>
          </div>
          <Switch
            checked={settings.show_voting_activity}
            onCheckedChange={(checked) => handleSettingChange('show_voting_activity', checked)}
            disabled={saving}
          />
        </div>

        {/* Community Membership */}
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Show Community Membership</h3>
              <p className="text-sm text-muted-foreground">
                Display which communities you've joined on your profile
              </p>
            </div>
          </div>
          <Switch
            checked={settings.show_community_membership}
            onCheckedChange={(checked) => handleSettingChange('show_community_membership', checked)}
            disabled={saving}
          />
        </div>

        {/* Contact Permissions */}
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <MessageSquare className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Allow Contact</h3>
              <p className="text-sm text-muted-foreground">
                Allow other users to see your bio and contact information
              </p>
            </div>
          </div>
          <Switch
            checked={settings.allow_contact}
            onCheckedChange={(checked) => handleSettingChange('allow_contact', checked)}
            disabled={saving}
          />
        </div>

        {/* Security Notice */}
        <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-orange-800 dark:text-orange-200">Security Notice</h4>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                Your voting activity and personal information are protected by default. 
                Only enable these settings if you're comfortable sharing this information publicly.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};