import { Award, Download, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { buildCertificateHtml } from "@/lib/certificate-html";

interface CertificatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseTitle: string;
  userName: string;
  certificateNumber?: string | null;
  issuedAt?: string | null;
  completedLessons: number;
  totalLessons: number;
  /** Only true when every lesson is completed — gates the download button. */
  canDownload: boolean;
  onDownload: () => void;
}

/**
 * Shows a watermarked "PREVIEW" version of the student's certificate.
 * Downloading stays locked until the course is 100% complete.
 */
export function CertificatePreviewDialog({
  open,
  onOpenChange,
  courseTitle,
  userName,
  certificateNumber,
  issuedAt,
  completedLessons,
  totalLessons,
  canDownload,
  onDownload,
}: CertificatePreviewDialogProps) {
  const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const html = buildCertificateHtml({
    courseTitle,
    userName,
    issuedDate: issuedAt
      ? new Date(issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : "Pending completion",
    certificateNumber: certificateNumber || "PENDING",
    isPreview: true,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Certificate Preview
          </DialogTitle>
          <DialogDescription>
            {canDownload
              ? "You've completed this course — your certificate is ready to download."
              : "This is a watermarked preview. Finish all lessons to unlock the download."}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted overflow-hidden">
          <div className="aspect-[4/3] w-full">
            <iframe
              title="Certificate preview"
              srcDoc={html}
              sandbox=""
              className="w-full h-full border-0 pointer-events-none"
            />
          </div>
        </div>

        {!canDownload && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Course progress</span>
              <span className="font-medium">
                {completedLessons}/{totalLessons} lessons ({percentage}%)
              </span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Close
          </Button>
          <Button
            onClick={onDownload}
            disabled={!canDownload}
            className="w-full sm:w-auto"
          >
            {canDownload ? (
              <>
                <Download className="w-4 h-4 mr-2" /> Download Certificate
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" /> Complete course to download
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
