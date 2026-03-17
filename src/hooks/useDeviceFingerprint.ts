import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DeviceInfo {
  fingerprint: string;
  deviceName: string;
}

// Generate a device fingerprint based on browser characteristics
const generateFingerprint = async (): Promise<DeviceInfo> => {
  const components = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset().toString(),
    screen.width.toString(),
    screen.height.toString(),
    screen.colorDepth.toString(),
    navigator.hardwareConcurrency?.toString() || '0',
    navigator.platform,
    // Add canvas fingerprint
    await getCanvasFingerprint(),
  ];

  const fingerprint = await hashString(components.join('|'));
  
  // Determine device name
  const ua = navigator.userAgent;
  let deviceName = 'Unknown Device';
  
  if (/Android/i.test(ua)) {
    deviceName = 'Android Device';
    const match = ua.match(/Android\s[\d.]+;\s([^;)]+)/);
    if (match) deviceName = match[1].trim();
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    if (/iPad/i.test(ua)) deviceName = 'iPad';
    else if (/iPhone/i.test(ua)) deviceName = 'iPhone';
    else deviceName = 'iPod';
  } else if (/Windows/i.test(ua)) {
    deviceName = 'Windows PC';
  } else if (/Mac/i.test(ua)) {
    deviceName = 'Mac';
  } else if (/Linux/i.test(ua)) {
    deviceName = 'Linux PC';
  }
  
  // Add browser info
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) {
    deviceName += ' - Chrome';
  } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    deviceName += ' - Safari';
  } else if (/Firefox/i.test(ua)) {
    deviceName += ' - Firefox';
  } else if (/Edg/i.test(ua)) {
    deviceName += ' - Edge';
  }

  return { fingerprint, deviceName };
};

// Canvas fingerprinting
const getCanvasFingerprint = async (): Promise<string> => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    canvas.width = 200;
    canvas.height = 50;
    
    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Fingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Canvas', 4, 17);
    
    return canvas.toDataURL();
  } catch {
    return '';
  }
};

// Hash function using Web Crypto API
const hashString = async (str: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export function useDeviceFingerprint() {
  const { user } = useAuth();
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate and check device on mount
  useEffect(() => {
    const checkDevice = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Generate fingerprint
        const info = await generateFingerprint();
        setDeviceInfo(info);

        // Check if device is registered
        const response = await supabase.functions.invoke('check-device', {
          body: { 
            fingerprint: info.fingerprint,
            deviceName: info.deviceName,
          },
        });

        if (response.error) {
          throw new Error(response.error.message);
        }

        const result = response.data;
        
        if (result.blocked) {
          setIsBlocked(true);
          setIsRegistered(false);
        } else {
          setIsBlocked(false);
          setIsRegistered(result.registered);
        }
      } catch (err: any) {
        console.error('Device check error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    checkDevice();
  }, [user]);

  // Register current device
  const registerDevice = useCallback(async () => {
    if (!user || !deviceInfo) return { success: false, error: 'Not authenticated' };

    try {
      const response = await supabase.functions.invoke('register-device', {
        body: { 
          fingerprint: deviceInfo.fingerprint,
          deviceName: deviceInfo.deviceName,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data.success) {
        setIsRegistered(true);
        setIsBlocked(false);
        return { success: true };
      } else {
        setIsBlocked(response.data.blocked || false);
        return { success: false, error: response.data.error };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [user, deviceInfo]);

  return {
    deviceInfo,
    isRegistered,
    isBlocked,
    isLoading,
    error,
    registerDevice,
  };
}
