import { useEffect, useState } from 'react';
import { Download, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface PdfPreviewTarget {
  title: string;
  /** Fresh, directly-fetchable URL to the PDF (signed or public). */
  url: string;
  /** Optional URL used for the Download button (e.g. signed with ?download=). */
  downloadUrl?: string;
  fileName?: string;
}

interface Props {
  target: PdfPreviewTarget | null;
  onClose: () => void;
}

/**
 * Renders a PDF inside the modal from a blob URL (same-origin, so it is not
 * blocked by storage CSP/frame headers). Falls back to explicit
 * "Open in new tab" / "Download" actions when inline rendering fails.
 */
export function PdfPreviewDialog({ target, onClose }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!target) {
      setBlobUrl(null);
      setStatus('idle');
      setErrorMessage(null);
      return;
    }

    let active = true;
    let createdUrl: string | null = null;
    setStatus('loading');
    setErrorMessage(null);

    (async () => {
      try {
        const res = await fetch(target.url, { credentials: 'omit' });
        if (!res.ok) throw new Error(`The file could not be loaded (HTTP ${res.status}).`);
        const raw = await res.blob();
        // Force the PDF content type — some storage responses omit or override it.
        const blob = raw.type === 'application/pdf' ? raw : new Blob([raw], { type: 'application/pdf' });
        createdUrl = URL.createObjectURL(blob);
        if (!active) {
          URL.revokeObjectURL(createdUrl);
          return;
        }
        setBlobUrl(createdUrl);
        setStatus('ready');
      } catch (err: unknown) {
        if (!active) return;
        setErrorMessage(err instanceof Error ? err.message : 'The PDF could not be loaded.');
        setStatus('error');
      }
    })();

    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [target]);

  const openInNewTab = () => {
    const url = blobUrl || target?.url;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const download = () => {
    const url = target?.downloadUrl || blobUrl || target?.url;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.rel = 'noopener';
    a.download = target?.fileName || `${target?.title || 'document'}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 pb-3 border-b">
          <DialogTitle className="truncate pr-8 text-left">{target?.title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 bg-muted">
          {status === 'loading' && (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {status === 'ready' && blobUrl && (
            <object data={blobUrl} type="application/pdf" className="w-full h-full">
              <iframe src={blobUrl} title={target?.title || 'PDF preview'} className="w-full h-full border-0" />
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Inline preview isn’t supported on this device.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={openInNewTab}>
                    <ExternalLink className="w-4 h-4 mr-1" /> Open in new tab
                  </Button>
                  <Button size="sm" onClick={download}>
                    <Download className="w-4 h-4 mr-1" /> Download PDF
                  </Button>
                </div>
              </div>
            </object>
          )}
          {status === 'error' && (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm text-muted-foreground max-w-sm">{errorMessage}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={openInNewTab}>
                  <ExternalLink className="w-4 h-4 mr-1" /> Open in new tab
                </Button>
                <Button size="sm" onClick={download}>
                  <Download className="w-4 h-4 mr-1" /> Download PDF
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="p-3 border-t flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={openInNewTab} disabled={!target}>
            <ExternalLink className="w-4 h-4 mr-1" />
            Open in new tab
          </Button>
          <Button size="sm" variant="outline" onClick={download} disabled={!target}>
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
