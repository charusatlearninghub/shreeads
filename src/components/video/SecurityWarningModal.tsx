import { motion } from 'framer-motion';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface SecurityWarningModalProps {
  isOpen: boolean;
  message: string;
  onDismiss: () => void;
}

export function SecurityWarningModal({ isOpen, message, onDismiss }: SecurityWarningModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center"
            >
              <ShieldAlert className="w-8 h-8 text-destructive" />
            </motion.div>
          </div>
          <DialogTitle className="text-center text-xl text-destructive">
            Security Alert
          </DialogTitle>
          <DialogDescription className="text-center">
            Suspicious activity has been detected
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">{message}</p>
                <p className="text-muted-foreground mt-2">
                  Video playback has been paused. This incident has been logged for security purposes.
                  Continued violations may result in account suspension.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Button onClick={onDismiss} variant="outline" className="w-full">
          I understand — Resume Playback
        </Button>
      </DialogContent>
    </Dialog>
  );
}
