import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const SESSION_KEY = 'terms_accepted_session';

interface TermsAcceptanceDialogProps {
  isOpen: boolean;
  onAccept: () => void;
  courseName?: string;
  courseId?: string;
}

export function hasSessionTermsAccepted(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

export function TermsAcceptanceDialog({
  isOpen,
  onAccept,
  courseName = 'this course',
  courseId,
}: TermsAcceptanceDialogProps) {
  const navigate = useNavigate();
  const [agreeNoRecording, setAgreeNoRecording] = useState(false);
  const [agreeNoSharing, setAgreeNoSharing] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const allAgreed = agreeNoRecording && agreeNoSharing && agreeTerms;

  const handleAccept = () => {
    if (allAgreed) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      onAccept();
    }
  };

  const handleDecline = () => {
    if (courseId) {
      navigate(`/course/${courseId}`);
    } else {
      navigate(-1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <ShieldCheck className="w-8 h-8 text-primary" />
            </motion.div>
          </div>
          <DialogTitle className="text-center text-xl">
            Content Protection Agreement
          </DialogTitle>
          <DialogDescription className="text-center">
            Before watching {courseName}, please agree to the following terms
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-600 dark:text-amber-400">
                  Protected Content
                </p>
                <p className="text-muted-foreground mt-1">
                  This video content is copyrighted and protected. Unauthorized recording or distribution is strictly prohibited and may result in legal action.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
              <Checkbox
                checked={agreeNoRecording}
                onCheckedChange={(checked) => setAgreeNoRecording(checked === true)}
                className="mt-0.5"
              />
              <div className="text-sm">
                <p className="font-medium">No Screen Recording</p>
                <p className="text-muted-foreground">
                  I will not record, capture screenshots, or use any screen recording software while watching this content.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
              <Checkbox
                checked={agreeNoSharing}
                onCheckedChange={(checked) => setAgreeNoSharing(checked === true)}
                className="mt-0.5"
              />
              <div className="text-sm">
                <p className="font-medium">No Screen Sharing</p>
                <p className="text-muted-foreground">
                  I will not share my screen via Zoom, Google Meet, WhatsApp, or any other platform while watching this content.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
              <Checkbox
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                className="mt-0.5"
              />
              <div className="text-sm">
                <p className="font-medium">Accept Terms of Use</p>
                <p className="text-muted-foreground">
                  I understand that violating these terms may result in account suspension and potential legal action.
                </p>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <FileText className="w-3 h-3" />
            <span>By proceeding, you agree to our content protection policy</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleAccept}
            disabled={!allAgreed}
            className="w-full"
            size="lg"
          >
            {allAgreed ? (
              <>
                <ShieldCheck className="w-4 h-4 mr-2" />
                I Agree - Start Watching
              </>
            ) : (
              'Please accept all terms to continue'
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={handleDecline}
            className="w-full"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Your agreement is logged for security purposes
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}