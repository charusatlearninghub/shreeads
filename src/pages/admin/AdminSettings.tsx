import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Shield, Bell, Globe, Database, RefreshCw, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Fetch all platform settings as a key-value map
function useAllSettings() {
  return useQuery({
    queryKey: ['platform-settings-all'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('platform_settings')
        .select('key, value');
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const row of data || []) {
        const v = row.value;
        map[row.key] = typeof v === 'string' ? v : JSON.stringify(v);
      }
      return map;
    },
  });
}

function parseSetting(settings: Record<string, string> | undefined, key: string, fallback: string): string {
  if (!settings || !(key in settings)) return fallback;
  return settings[key];
}

function parseBool(settings: Record<string, string> | undefined, key: string, fallback: boolean): boolean {
  if (!settings || !(key in settings)) return fallback;
  const v = settings[key];
  return v === 'true' || v === '"true"';
}

function parseNum(settings: Record<string, string> | undefined, key: string, fallback: number): number {
  if (!settings || !(key in settings)) return fallback;
  const n = parseFloat(settings[key].replace(/"/g, ''));
  return isNaN(n) ? fallback : n;
}

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: settings, isLoading: settingsLoading } = useAllSettings();

  // General
  const [siteName, setSiteName] = useState('SHREE ADS');
  const [whatsappNumber, setWhatsappNumber] = useState('919265106657');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoApproveReviews, setAutoApproveReviews] = useState(false);

  // Security
  const [bgOpacity, setBgOpacity] = useState(0.06);
  const [centerOpacity, setCenterOpacity] = useState(0.18);
  const [sessionTimeout, setSessionTimeout] = useState(60);

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Load settings from DB
  useEffect(() => {
    if (!settings) return;
    setSiteName(parseSetting(settings, 'site_name', 'SHREE ADS').replace(/^"|"$/g, ''));
    setWhatsappNumber(parseSetting(settings, 'whatsapp_number', '919265106657').replace(/^"|"$/g, ''));
    setMaintenanceMode(parseBool(settings, 'maintenance_mode', false));
    setAutoApproveReviews(parseBool(settings, 'auto_approve_reviews', false));
    setBgOpacity(parseNum(settings, 'watermark_opacity', 0.06));
    setCenterOpacity(parseNum(settings, 'watermark_center_opacity', 0.18));
    setSessionTimeout(parseNum(settings, 'session_timeout_minutes', 60));
    setEmailNotifications(parseBool(settings, 'email_notifications', true));
  }, [settings]);

  // Generic save function
  const saveSetting = useCallback(async (key: string, value: string) => {
    const jsonValue = JSON.stringify(value);
    // Try update first, then insert
    const { data: existing } = await (supabase as any)
      .from('platform_settings')
      .select('id')
      .eq('key', key)
      .maybeSingle();

    if (existing) {
      await (supabase as any)
        .from('platform_settings')
        .update({ value: jsonValue, updated_at: new Date().toISOString(), updated_by: user?.id })
        .eq('key', key);
    } else {
      await (supabase as any)
        .from('platform_settings')
        .insert({ key, value: jsonValue, updated_by: user?.id });
    }
  }, [user?.id]);

  const saveGeneralMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        saveSetting('site_name', siteName),
        saveSetting('whatsapp_number', whatsappNumber),
        saveSetting('maintenance_mode', String(maintenanceMode)),
        saveSetting('auto_approve_reviews', String(autoApproveReviews)),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings-all'] });
      queryClient.invalidateQueries({ queryKey: ['platform-setting'] });
      toast.success('General settings saved successfully');
    },
    onError: () => toast.error('Failed to save general settings'),
  });

  const saveSecurityMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        saveSetting('watermark_opacity', String(bgOpacity)),
        saveSetting('watermark_center_opacity', String(centerOpacity)),
        saveSetting('session_timeout_minutes', String(sessionTimeout)),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings-all'] });
      queryClient.invalidateQueries({ queryKey: ['platform-setting'] });
      toast.success('Security settings saved successfully');
    },
    onError: () => toast.error('Failed to save security settings'),
  });

  const saveNotificationsMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        saveSetting('email_notifications', String(emailNotifications)),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings-all'] });
      toast.success('Notification settings saved successfully');
    },
    onError: () => toast.error('Failed to save notification settings'),
  });

  const handleClearCache = () => {
    localStorage.removeItem('supabase.auth.token');
    toast.success('Cache cleared successfully');
  };

  if (settingsLoading) {
    return (
      <AdminLayout title="Settings" subtitle="Manage platform configuration and preferences">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings" subtitle="Manage platform configuration and preferences">
      <div className="grid gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>Configure basic platform settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="Enter site name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp Support Number</Label>
                <Input
                  id="whatsapp"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="919265106657"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Temporarily disable access for non-admin users
                </p>
              </div>
              <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-Approve Reviews</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically approve new course reviews
                </p>
              </div>
              <Switch checked={autoApproveReviews} onCheckedChange={setAutoApproveReviews} />
            </div>

            <Button onClick={() => saveGeneralMutation.mutate()} disabled={saveGeneralMutation.isPending}>
              {saveGeneralMutation.isPending ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Saving...</>
              ) : (
                'Save General Settings'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>Configure security and access controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Device Restriction</Label>
                <p className="text-sm text-muted-foreground">Limit users to one device at a time</p>
              </div>
              <Switch defaultChecked disabled />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Screen Recording Protection</Label>
                <p className="text-sm text-muted-foreground">Detect and prevent screen recording attempts</p>
              </div>
              <Switch defaultChecked disabled />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Video Watermarks</Label>
                <p className="text-sm text-muted-foreground">Display user email as watermark on videos</p>
              </div>
              <Switch defaultChecked disabled />
            </div>

            <Separator />

            {/* Watermark Opacity Controls */}
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <Label className="text-base font-semibold">Watermark Opacity</Label>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Background Pattern Opacity</Label>
                    <span className="text-sm font-mono text-muted-foreground">{(bgOpacity * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[bgOpacity * 100]}
                    onValueChange={(v) => setBgOpacity(v[0] / 100)}
                    min={1}
                    max={30}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Controls the diagonal repeating email pattern across the video
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Center Watermark Opacity</Label>
                    <span className="text-sm font-mono text-muted-foreground">{(centerOpacity * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[centerOpacity * 100]}
                    onValueChange={(v) => setCenterOpacity(v[0] / 100)}
                    min={5}
                    max={50}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    Controls the moving center watermark and corner labels
                  </p>
                </div>
              </div>

              {/* Live Preview */}
              <div className="relative bg-black rounded-lg overflow-hidden h-24">
                <div className="absolute inset-0 pointer-events-none select-none" style={{ transform: 'rotate(-25deg) scale(1.5)', transformOrigin: 'center' }}>
                  {Array.from({ length: 4 }).map((_, row) => (
                    <div key={row} className="flex gap-12 mb-6" style={{ marginLeft: row % 2 === 0 ? '0' : '40px' }}>
                      {Array.from({ length: 5 }).map((_, col) => (
                        <span key={col} className="text-white text-[10px] font-mono whitespace-nowrap" style={{ opacity: bgOpacity }}>
                          user@email.com
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-sm font-bold font-mono" style={{ opacity: centerOpacity }}>
                    user@email.com
                  </span>
                </div>
                <div className="absolute bottom-1 right-2">
                  <span className="text-white/50 text-[9px]">Live Preview</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Session Timeout (minutes)</Label>
              <Input
                type="number"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(parseInt(e.target.value) || 60)}
                className="max-w-xs"
                min={5}
                max={1440}
              />
              <p className="text-xs text-muted-foreground">
                How long a user session remains active without activity (5–1440 minutes)
              </p>
            </div>

            <Button onClick={() => saveSecurityMutation.mutate()} disabled={saveSecurityMutation.isPending}>
              {saveSecurityMutation.isPending ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Saving...</>
              ) : (
                'Save Security Settings'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>Configure email and push notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email alerts for new enrollments and purchases
                </p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New User Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified when new users register</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Review Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified when new reviews are submitted</p>
              </div>
              <Switch defaultChecked />
            </div>

            <Button onClick={() => saveNotificationsMutation.mutate()} disabled={saveNotificationsMutation.isPending}>
              {saveNotificationsMutation.isPending ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Saving...</>
              ) : (
                'Save Notification Settings'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* System Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Maintenance
            </CardTitle>
            <CardDescription>System maintenance and cache management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleClearCache}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Cache
              </Button>
            </div>
            
            <Separator />
            
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Platform Version:</strong> 2.0.0</p>
              <p><strong>Last Updated:</strong> February 5, 2026</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
