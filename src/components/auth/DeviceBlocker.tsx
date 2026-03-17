import { useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Shield, RefreshCw, AlertTriangle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDeviceFingerprint } from '@/hooks/useDeviceFingerprint';
import { useAuth } from '@/contexts/AuthContext';

interface DeviceBlockerProps {
  children: React.ReactNode;
}

const WHATSAPP_URL = "https://wa.me/919265106657?text=" + encodeURIComponent("Hi, I need help resetting my device binding for SHREE ADS. My account email is: ");

export function DeviceBlocker({ children }: DeviceBlockerProps) {
  const { isBlocked, isLoading, isRegistered, registerDevice, deviceInfo, error } = useDeviceFingerprint();
  const { signOut, profile } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

  // If still loading, show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying device...</p>
        </div>
      </div>
    );
  }

  // If blocked by another device
  if (isBlocked) {
    const whatsappWithEmail = WHATSAPP_URL + encodeURIComponent(profile?.email || '');
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="border-destructive/50">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">Device Limit Reached</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                Your account is already registered on another device. 
                For security purposes, only one device is allowed per account.
              </p>
              
              <div className="bg-secondary/50 rounded-lg p-4 text-left">
                <p className="text-sm font-medium mb-1">Current Device</p>
                <p className="text-xs text-muted-foreground">{deviceInfo?.deviceName}</p>
              </div>

              <div className="pt-4 space-y-3">
                <p className="text-xs text-muted-foreground">
                  If you need to switch devices, please contact support to reset your device binding.
                </p>
                
                <Button 
                  className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white"
                  asChild
                >
                  <a 
                    href={whatsappWithEmail}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact via WhatsApp
                  </a>
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={signOut}
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // If not yet registered, show registration prompt
  if (!isRegistered && deviceInfo) {
    const handleRegister = async () => {
      setIsRegistering(true);
      await registerDevice();
      setIsRegistering(false);
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Register This Device</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                To protect your account, we need to register this device. 
                You can only access your courses from one device at a time.
              </p>
              
              <div className="bg-secondary/50 rounded-lg p-4 text-left">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{deviceInfo.deviceName}</p>
                    <p className="text-xs text-muted-foreground">This device</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 text-left bg-amber-500/10 rounded-lg p-3">
                <Shield className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Once registered, you won't be able to access your account from another device 
                  without contacting support.
                </p>
              </div>

              <div className="pt-2 space-y-3">
                <Button 
                  className="w-full"
                  onClick={handleRegister}
                  disabled={isRegistering}
                >
                  {isRegistering ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Register This Device
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={signOut}
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Device is registered, show children
  return <>{children}</>;
}
