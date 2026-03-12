import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PrivacySettings } from '@/components/privacy/PrivacySettings';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  User, Shield, Bell, Palette, Monitor, Sun, Moon,
  BadgeCheck, Brush, Lock, Building2, ExternalLink, Trash2, AlertTriangle,
  Award, ArrowLeft
} from 'lucide-react';
import { SkillsEndorsementPanel } from '@/features/profile/components/resume/SkillsEndorsementPanel';
import { ProfileImageUpload } from '@/components/profile/ProfileImageUpload';

const KENYA_COUNTIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Uasin Gishu", "Kiambu", "Machakos", "Kajiado", 
  "Meru", "Nyeri", "Kilifi", "Kwale", "Taita Taveta", "Garissa", "Wajir", "Mandera", 
  "Marsabit", "Isiolo", "Tharaka Nithi", "Embu", "Kitui", "Makueni", "Nyandarua", 
  "Kirinyaga", "Murang'a", "Turkana", "West Pokot", "Samburu", "Trans Nzoia", "Elgeyo Marakwet", 
  "Nandi", "Baringo", "Laikipia", "Narok", "Kericho", "Bomet", "Kakamega", "Vihiga", 
  "Bungoma", "Busia", "Siaya", "Homa Bay", "Migori", "Kisii", "Nyamira", "Lamu", "Tana River"
];

const Settings = () => {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const defaultTab = searchParams.get('tab') || 'profile';
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: profile?.username || '',
    display_name: profile?.displayName || '',
    bio: profile?.bio || '',
    avatar_url: profile?.avatar || '',
    banner_url: '',
    county: '',
    ward: ''
  });

  // Load existing missing profile data not in the auth context profile
  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('banner_url, county, ward').eq('id', user.id).single()
        .then(({ data }) => {
          if (data) {
            setFormData(prev => ({
              ...prev,
              banner_url: data.banner_url || '',
              county: data.county || '',
              ward: data.ward || ''
            }));
          }
        });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <div className="text-muted-foreground">Please sign in to access settings.</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-2">Manage your account and privacy preferences</p>
          </div>
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 h-auto flex-wrap">
            <TabsTrigger value="profile" className="flex items-center gap-2 text-xs">
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="verification" className="flex items-center gap-2 text-xs">
              <BadgeCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Verification</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2 text-xs">
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="customization" className="flex items-center gap-2 text-xs">
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Customization</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 text-xs">
              <Bell className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Notify</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2 text-xs">
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Update your profile information and how it appears to others.
                </p>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  {/* Avatar & Banner Uploads */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Profile Picture</Label>
                      <ProfileImageUpload
                        userId={user.id}
                        imageUrl={formData.avatar_url}
                        imageType="avatar"
                        onChange={(url) => setFormData({ ...formData, avatar_url: url })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Profile Banner</Label>
                      <ProfileImageUpload
                        userId={user.id}
                        imageUrl={formData.banner_url}
                        imageType="banner"
                        onChange={(url) => setFormData({ ...formData, banner_url: url })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Username */}
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        placeholder="Enter your username"
                      />
                    </div>

                    {/* Display Name */}
                    <div className="space-y-2">
                      <Label htmlFor="display_name">Display Name</Label>
                      <Input
                        id="display_name"
                        value={formData.display_name}
                        onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                        placeholder="Enter your display name"
                      />
                    </div>
                  </div>

                  {/* Location Area */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>County</Label>
                      <Select 
                          value={formData.county} 
                          onValueChange={(val) => setFormData({...formData, county: val})}
                      >
                        <SelectTrigger className="bg-white dark:bg-zinc-950">
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
                      <Label htmlFor="ward">Ward (Optional)</Label>
                      <Input
                        id="ward"
                        value={formData.ward}
                        onChange={(e) => setFormData({...formData, ward: e.target.value})}
                        placeholder="e.g. Kibera"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      placeholder="Tell us about yourself..."
                      rows={4}
                    />
                  </div>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Updating...' : 'Update Profile'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Embed Skills Panel */}
            <SkillsEndorsementPanel userId={user.id} isOwnProfile={true} />
          </TabsContent>

          {/* ── VERIFICATION TAB ── */}
          <TabsContent value="verification" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-500" />
                  Claim a Government Position
                </CardTitle>
                <CardDescription>
                  Associate your account with an elected or appointed office. This grants you the /g/ prefix and access to official tools.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link to="/claim-position">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Browse Government Positions
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-sky-500" />
                  Request Trusted Member Status
                </CardTitle>
                <CardDescription>
                  Apply for the /w/ Trusted Member badge — for journalists, civil society experts, and community leaders. Reviewed by platform administrators.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <VerificationRequestForm userId={user?.id ?? ''} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-emerald-500" />
                  Verify Residence
                </CardTitle>
                <CardDescription>
                  Gain voting rights for local community decisions by verifying your physical residence.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg border border-dashed bg-muted/30 text-center text-sm text-muted-foreground">
                  Residence verification features are coming soon.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── PRIVACY TAB ── */}
          <TabsContent value="privacy" className="mt-6">
            <PrivacySettings />
          </TabsContent>

          {/* ── CUSTOMIZATION TAB ── */}
          <TabsContent value="customization" className="mt-6 space-y-6">
            <AppearanceSettingsTab />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brush className="w-5 h-5" />
                  Profile Studio
                </CardTitle>
                <CardDescription>
                  Customise your civic resume — themes, avatar frames, accent colours, and profile animations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileStudioEmbed />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <NotificationSettingsTab />
          </TabsContent>

          {/* ── ACCOUNT TAB ── */}
          <TabsContent value="account" className="mt-6 space-y-4">
            <AccountSettingsTab userId={user?.id ?? ''} />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};
export default Settings;


// H5: Notification Settings Tab
function NotificationSettingsTab() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({
    on_comment:       true,
    on_reply:         true,
    on_issue_update:  true,
    on_governance:    false,
    weekly_digest:    true,
  });

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('notification_settings').eq('id', user.id).single()
      .then(({ data }) => {
        if (data?.notification_settings) {
          const ns = data.notification_settings as Record<string, boolean>;
          setPrefs(prev => ({ ...prev, ...ns }));
        }
      });
  }, [user]);

  const handleToggle = async (key: keyof typeof prefs) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    setSaving(true);
    await supabase.from('profiles').update({ notification_settings: updated }).eq('id', user?.id ?? '');
    setSaving(false);
    toast.success('Notifications updated');
  };

  const rows = [
    { key: 'on_comment'      as const, label: 'New comments on your posts', desc: 'Get notified when someone comments on your post' },
    { key: 'on_reply'        as const, label: 'Replies to your comments',   desc: 'Get notified when someone replies to your comment' },
    { key: 'on_issue_update' as const, label: 'Issue status updates',       desc: 'When an issue you reported changes status' },
    { key: 'on_governance'   as const, label: 'Governance alerts',          desc: 'New promises, Q&A answers, and position claims in your area' },
    { key: 'weekly_digest'   as const, label: 'Weekly civic digest',        desc: 'Summary of civic activity in your region every Monday' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" />Notification Preferences</CardTitle>
        <p className="text-sm text-muted-foreground">Choose what notifications you want to receive.</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {rows.map(row => (
          <div key={row.key} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{row.label}</p>
              <p className="text-sm text-muted-foreground">{row.desc}</p>
            </div>
            <Switch checked={prefs[row.key]} onCheckedChange={() => handleToggle(row.key)} disabled={saving} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// H5: Appearance Settings Tab
function AppearanceSettingsTab() {
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>(() => {
    return (localStorage.getItem('wana-theme') as 'system' | 'light' | 'dark') || 'system';
  });
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem('wana-compact') === 'true');

  const applyTheme = (t: 'system' | 'light' | 'dark') => {
    setTheme(t);
    localStorage.setItem('wana-theme', t);
    const isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  };

  const applyCompact = (v: boolean) => {
    setCompactMode(v);
    localStorage.setItem('wana-compact', String(v));
    document.documentElement.classList.toggle('compact', v);
  };

  const themeOptions: { value: 'system' | 'light' | 'dark'; label: string; icon: React.ReactNode }[] = [
    { value: 'system', label: 'System',   icon: <Monitor className="w-4 h-4" /> },
    { value: 'light',  label: 'Light',    icon: <Sun className="w-4 h-4" /> },
    { value: 'dark',   label: 'Dark',     icon: <Moon className="w-4 h-4" /> },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5" />Appearance Settings</CardTitle>
        <p className="text-sm text-muted-foreground">Customize how the interface looks and feels.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme selection */}
        <div>
          <Label className="text-base font-medium mb-3 block">Theme</Label>
          <div className="flex gap-3">
            {themeOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => applyTheme(opt.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-colors text-sm font-medium ${
                  theme === opt.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Compact mode */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Compact Mode</p>
            <p className="text-sm text-muted-foreground">Reduce spacing for a denser information layout</p>
          </div>
          <Switch checked={compactMode} onCheckedChange={applyCompact} />
        </div>
      </CardContent>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// VERIFICATION REQUEST FORM
// Apply for /w/ trusted member status — writes to a review_requests table
// ────────────────────────────────────────────────────────────────────────────
function VerificationRequestForm({ userId }: { userId: string }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !userId) return;
    setLoading(true);
    try {
      // Insert into civic_actions table as a standard verification tracking mechanism
      const { error } = await supabase.from('civic_actions').insert({
        title: 'Verified Member Status Request',
        description: reason,
        category: 'verification_request',
        user_id: userId,
        status: 'open',
        metadata: { requested_role: 'trusted_member', review_status: 'pending' }
      });
      if (error) throw error;
      toast.success('Request submitted! Our administrative team will review your application.');
      setSubmitted(true);
    } catch {
      toast.error('Could not submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg border border-green-500/30 bg-green-500/5">
        <BadgeCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
        <div>
          <p className="font-medium text-sm">Application submitted</p>
          <p className="text-xs text-muted-foreground">Our team will review your request within 3–5 business days.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="verification-reason">Why should you be a Trusted Member?</Label>
        <Textarea
          id="verification-reason"
          placeholder="Describe your role (e.g. journalist at Daily Nation, civil society expert at ILEG, community leader of Mathare Ward)..."
          rows={4}
          value={reason}
          onChange={e => setReason(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          Include links to your professional profile, organisation website, or published work.
        </p>
      </div>
      <Button type="submit" disabled={loading || !reason.trim()}>
        <BadgeCheck className="w-4 h-4 mr-2" />
        {loading ? 'Submitting...' : 'Submit Application'}
      </Button>
    </form>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// PROFILE STUDIO EMBED
// Summary: links to profile studio page; studio is a separate heavy page
// ────────────────────────────────────────────────────────────────────────────
function ProfileStudioEmbed() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { emoji: '🎨', label: 'Avatar Frames',    desc: 'Animated civic borders' },
          { emoji: '🌈', label: 'Accent Colours',   desc: 'Personalise your profile palette' },
          { emoji: '✨', label: 'Animations',       desc: 'Profile card effects' },
          { emoji: '🌙', label: 'Dark Banner',      desc: 'Custom banner themes' },
          { emoji: '🏆', label: 'Trophy Display',   desc: 'Showcase your badges' },
          { emoji: '🎖️', label: 'Title Card',      desc: 'Custom GOAT title style' },
        ].map(({ emoji, label, desc }) => (
          <div key={label} className="p-3 border rounded-lg space-y-1 hover:border-primary/30 transition-colors cursor-pointer">
            <div className="text-2xl">{emoji}</div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// ACCOUNT SETTINGS TAB
// Password change + danger zone (delete account)
// ────────────────────────────────────────────────────────────────────────────
function AccountSettingsTab({ userId }: { userId: string }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password';
      toast.error(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Type DELETE to confirm');
      return;
    }
    try {
      // Soft delete: set is_deleted flag and sign out. Hard delete is a Supabase admin action.
      await supabase.from('profiles').update({ is_deleted: true } as never).eq('id', userId);
      await supabase.auth.signOut();
      toast.success('Your account has been deactivated.');
    } catch {
      toast.error('Could not delete account. Contact support.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-4 h-4" />
            Account Information
          </CardTitle>
          <CardDescription>Your primary account details.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input
              value={useAuth().user?.email || 'Loading...'}
              disabled
              className="bg-muted text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">
              To change your email address, please contact support.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="w-4 h-4" />
            Change Password
          </CardTitle>
          <CardDescription>Use a strong password with at least 8 characters.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
              />
            </div>
            <Button type="submit" disabled={passwordLoading}>
              <Lock className="w-4 h-4 mr-2" />
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <AlertTriangle className="w-4 h-4" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            These actions are irreversible. Please be certain.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator className="border-destructive/20" />
          <div className="space-y-3">
            <div>
              <p className="font-medium text-sm">Delete Account</p>
              <p className="text-xs text-muted-foreground mb-3">
                Your profile, civic reports, and all content will be permanently deactivated. This cannot be undone.
              </p>
              <div className="space-y-2">
                <Label htmlFor="delete-confirm" className="text-xs text-destructive">
                  Type <strong>DELETE</strong> to confirm
                </Label>
                <Input
                  id="delete-confirm"
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  className="border-destructive/40 max-w-xs"
                />
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== 'DELETE'}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete My Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

