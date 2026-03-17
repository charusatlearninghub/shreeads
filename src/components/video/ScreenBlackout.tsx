import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ShieldOff, Camera, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScreenBlackoutProps {
  isActive: boolean;
  reason: 'recording' | 'screenshot' | 'devtools' | 'tab_blur' | null;
  onDismiss: () => void;
}

export function ScreenBlackout({ isActive, reason, onDismiss }: ScreenBlackoutProps) {
  if (!isActive) return null;

  const getIcon = () => {
    switch (reason) {
      case 'recording': return <Monitor className="w-16 h-16 text-destructive" />;
      case 'screenshot': return <Camera className="w-16 h-16 text-destructive" />;
      case 'devtools': return <ShieldOff className="w-16 h-16 text-destructive" />;
      default: return <ShieldAlert className="w-16 h-16 text-destructive" />;
    }
  };

  const getTitle = () => {
    switch (reason) {
      case 'recording': return 'Screen Recording Detected!';
      case 'screenshot': return 'Screenshot Attempt Detected!';
      case 'devtools': return 'Developer Tools Detected!';
      case 'tab_blur': return 'Window Not Active';
      default: return 'Security Alert';
    }
  };

  const getMessage = () => {
    switch (reason) {
      case 'recording':
        return 'Screen recording or screen sharing has been detected. This content is protected and cannot be recorded.';
      case 'screenshot':
        return 'A screenshot attempt was detected. This content is protected and screenshots are not allowed.';
      case 'devtools':
        return 'Developer tools are open. Please close them to continue viewing content.';
      case 'tab_blur':
        return 'Please return to this window to continue.';
      default:
        return 'A security violation has been detected.';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] bg-black flex items-center justify-center"
        style={{ 
          // Ensure complete blackout - covers everything
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          width: '100vw',
          height: '100vh',
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="bg-gradient-to-br from-destructive/20 to-destructive/5 border border-destructive/30 rounded-2xl p-8 max-w-md text-center mx-4"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            {getIcon()}
          </motion.div>

          <h2 className="text-2xl font-bold mt-4 mb-3 text-white">
            {getTitle()}
          </h2>

          <p className="text-gray-300 text-sm mb-2">
            {getMessage()}
          </p>

          <p className="text-xs text-gray-500 mb-6">
            ⚠️ Your activity has been logged for security purposes.
          </p>

          {reason !== 'tab_blur' && (
            <p className="text-xs text-destructive/80 mb-4">
              Stop all recording/sharing software to continue.
            </p>
          )}

          <Button
            variant="outline"
            className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
            onClick={onDismiss}
          >
            {reason === 'tab_blur' ? 'I\'m Back' : 'Continue Watching'}
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
