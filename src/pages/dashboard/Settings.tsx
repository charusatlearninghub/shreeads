import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Lock, Bell, Shield, Loader2, Eye, EyeOff, Smartphone, Check, Trash2, AlertTriangle, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { format } from "date-fns";

interface DeviceRegistration {
  id: string;
  device_fingerprint: string;
  device_name: string | null;
  registered_at: string;
  last_used_at: string | null;
  is_active: boolean | null;
}

const Settings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Notification preferences state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [totpSecret, setTotpSecret] = useState('');

  // Device management state
  const [devices, setDevices] = useState<DeviceRegistration[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(true);

  // Account deletion state
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Load user preferences and devices
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;
      
      setIsLoadingPreferences(true);
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setEmailNotifications(data.email_notifications);
          setPushNotifications(data.push_notifications);
        } else {
          // Create default preferences if they don't exist
          const { error: insertError } = await supabase
            .from('user_preferences')
            .insert({
              user_id: user.id,
              email_notifications: true,
              push_notifications: false,
            });

          if (insertError) console.error('Error creating preferences:', insertError);
        }

        // Derive 2FA status from Supabase Auth MFA (source of truth)
        const { data: factorsData } = await supabase.auth.mfa.listFactors();
        const hasVerifiedTotp = !!factorsData?.totp?.find((f) => f.status === 'verified');
        setTwoFactorEnabled(hasVerifiedTotp);
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setIsLoadingPreferences(false);
      }
    };

    const loadDevices = async () => {
      if (!user) return;
      
      setIsLoadingDevices(true);
      try {
        const { data, error } = await supabase
          .from('device_registrations')
          .select('*')
          .eq('user_id', user.id)
          .order('registered_at', { ascending: false });

        if (error) throw error;
        setDevices(data || []);
      } catch (error) {
        console.error('Error loading devices:', error);
      } finally {
        setIsLoadingDevices(false);
      }
    };

    loadPreferences();
    loadDevices();
  }, [user]);

  // Update fullName when profile changes
  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
  }, [profile?.full_name]);

  const handleUpdateProfile = async () => {
    if (!profile) return;

    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      toast({ title: "Success", description: "Profile updated successfully" });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({ title: "Success", description: "Password updated successfully" });
    } catch (error) {
      console.error('Error updating password:', error);
      toast({ title: "Error", description: "Failed to update password", variant: "destructive" });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleNotificationChange = async (type: 'email' | 'push', value: boolean) => {
    if (!user) return;

    // Optimistically update UI
    if (type === 'email') {
      setEmailNotifications(value);
    } else {
      setPushNotifications(value);
    }

    setIsSavingPreferences(true);
    try {
      const updateData = type === 'email' 
        ? { email_notifications: value }
        : { push_notifications: value };

      const { error } = await supabase
        .from('user_preferences')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ 
        title: "Saved", 
        description: `${type === 'email' ? 'Email' : 'Push'} notifications ${value ? 'enabled' : 'disabled'}` 
      });
    } catch (error) {
      console.error('Error updating notifications:', error);
      // Revert on error
      if (type === 'email') {
        setEmailNotifications(!value);
      } else {
        setPushNotifications(!value);
      }
      toast({ title: "Error", description: "Failed to update notification settings", variant: "destructive" });
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleEnable2FA = async () => {
    setIsEnabling2FA(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      });

      if (error) throw error;

      if (data?.totp?.qr_code && data?.totp?.secret) {
        setQrCodeUrl(data.totp.qr_code);
        setTotpSecret(data.totp.secret);
        setShow2FADialog(true);
      }
    } catch (error: any) {
      console.error('Error enrolling 2FA:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to setup 2FA", 
        variant: "destructive" 
      });
    } finally {
      setIsEnabling2FA(false);
    }
  };

  const handleVerify2FA = async () => {
    if (otpCode.length !== 6) {
      toast({ title: "Error", description: "Please enter a 6-digit code", variant: "destructive" });
      return;
    }

    setIsEnabling2FA(true);
    try {
      // Get the current factor to verify
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const totpFactor = factorsData?.totp?.find(f => f.factor_type === 'totp' && !f.friendly_name?.includes('verified'));

      if (!totpFactor) {
        throw new Error('No unverified TOTP factor found');
      }

      // Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id
      });

      if (challengeError) throw challengeError;

      // Verify with the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code: otpCode
      });

      if (verifyError) throw verifyError;

      // 2FA state lives in Supabase Auth MFA — no local mirror needed

      setTwoFactorEnabled(true);
      setShow2FADialog(false);
      setOtpCode('');
      toast({ title: "Success", description: "Two-factor authentication enabled!" });
    } catch (error: any) {
      console.error('Error verifying 2FA:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Invalid verification code", 
        variant: "destructive" 
      });
    } finally {
      setIsEnabling2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const totpFactor = factorsData?.totp?.find(f => f.status === 'verified');

      if (totpFactor) {
        const { error } = await supabase.auth.mfa.unenroll({
          factorId: totpFactor.id
        });

        if (error) throw error;
      }

      // 2FA state lives in Supabase Auth MFA — no local mirror needed

      setTwoFactorEnabled(false);
      toast({ title: "Success", description: "Two-factor authentication disabled" });
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to disable 2FA", 
        variant: "destructive" 
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast({ 
        title: "Error", 
        description: "Please type DELETE to confirm", 
        variant: "destructive" 
      });
      return;
    }

    setIsDeletingAccount(true);
    try {
      // Delete user data from various tables
      const userId = user?.id;
      if (!userId) throw new Error('No user found');

      // Delete device registrations
      await supabase.from('device_registrations').delete().eq('user_id', userId);
      
      // Delete user preferences
      await supabase.from('user_preferences').delete().eq('user_id', userId);
      
      // Delete lesson progress
      await supabase.from('lesson_progress').delete().eq('user_id', userId);
      
      // Delete enrollments
      await supabase.from('enrollments').delete().eq('user_id', userId);

      // Sign out and let them know to contact support for full deletion
      await supabase.auth.signOut();
      
      toast({ 
        title: "Account Data Deleted", 
        description: "Your data has been removed. Contact support to fully delete your account." 
      });
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete account", 
        variant: "destructive" 
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <DashboardLayout title="Settings" subtitle="Manage your account preferences">
      <div className="max-w-2xl space-y-6">
        {/* Profile Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <Button onClick={handleUpdateProfile} disabled={isUpdatingProfile}>
                {isUpdatingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Password Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Change Password
              </CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              <Button 
                onClick={handleUpdatePassword} 
                disabled={isUpdatingPassword || !newPassword || !confirmPassword}
              >
                {isUpdatingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notifications
              </CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingPreferences ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={(value) => handleNotificationChange('email', value)}
                      disabled={isSavingPreferences}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive browser notifications</p>
                    </div>
                    <Switch
                      checked={pushNotifications}
                      onCheckedChange={(value) => handleNotificationChange('push', value)}
                      disabled={isSavingPreferences}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Security
              </CardTitle>
              <CardDescription>Your account security information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Account Status</span>
                  <span className="text-green-500 font-medium">Active</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      {twoFactorEnabled 
                        ? 'Your account is protected with 2FA' 
                        : 'Add an extra layer of security'}
                    </p>
                  </div>
                  {twoFactorEnabled ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-green-500 text-sm font-medium">
                        <Check className="w-4 h-4" />
                        Enabled
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleDisable2FA}
                      >
                        Disable
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleEnable2FA}
                      disabled={isEnabling2FA}
                    >
                      {isEnabling2FA ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Smartphone className="w-4 h-4 mr-2" />
                          Enable
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Device Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-primary" />
                Device Management
              </CardTitle>
              <CardDescription>
                View your registered device. Only one device can be logged in at a time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingDevices ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : devices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No devices registered yet
                </p>
              ) : (
                <div className="space-y-3">
                  {devices.map((device) => (
                    <div 
                      key={device.id} 
                      className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {device.device_name || 'Unknown Device'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Registered: {format(new Date(device.registered_at), 'MMM d, yyyy')}
                          </p>
                          {device.last_used_at && (
                            <p className="text-xs text-muted-foreground">
                              Last used: {format(new Date(device.last_used_at), 'MMM d, yyyy h:mm a')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {device.is_active && (
                          <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground mt-2">
                    To switch devices, please contact support to reset your device binding.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Danger Zone - Account Deletion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions that affect your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        Delete Account
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-3">
                        <p>
                          This action cannot be undone. This will permanently delete your account
                          and remove all your data including:
                        </p>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          <li>Your profile information</li>
                          <li>Course enrollments and progress</li>
                          <li>Certificates earned</li>
                          <li>Device registrations</li>
                        </ul>
                        <div className="pt-2">
                          <Label htmlFor="deleteConfirm" className="text-foreground">
                            Type <span className="font-bold">DELETE</span> to confirm
                          </Label>
                          <Input
                            id="deleteConfirm"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="DELETE"
                            className="mt-2"
                          />
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== 'DELETE' || isDeletingAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeletingAccount ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          'Delete Account'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 2FA Setup Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app (like Google Authenticator or Authy)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {qrCodeUrl && (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            )}
            {totpSecret && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Or enter this code manually:</p>
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all">
                  {totpSecret}
                </code>
              </div>
            )}
            <div className="space-y-2">
              <Label>Enter the 6-digit code from your app</Label>
              <div className="flex justify-center">
                <InputOTP
                  value={otpCode}
                  onChange={setOtpCode}
                  maxLength={6}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShow2FADialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerify2FA} disabled={isEnabling2FA || otpCode.length !== 6}>
              {isEnabling2FA ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Verify & Enable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Settings;