import { useEffect, useState } from 'react';
import { Download, Eye, FileText, Loader2, Lock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatFileSize, type CourseMaterial } from '@/components/admin/CourseMaterialsManager';

interface Props {
  courseId: string;
  hasAccess: boolean;
}

const LOCKED_MESSAGE = 'This material is locked. Enroll in the course to view or download it.';

export function CourseMaterials({ courseId, hasAccess }: Props) {
  const { toast } = useToast();
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ title: string; url: string } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('course_materials')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');
      if (active) {
        setMaterials((data as CourseMaterial[]) || []);
        setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [courseId]);

  /** Always mints a fresh signed URL right before use (mobile + desktop safe). */
  const getSignedUrl = async (material: CourseMaterial, forDownload: boolean) => {
    if (!hasAccess) throw new Error(LOCKED_MESSAGE);

    const { data, error } = await supabase.storage
      .from('course-materials')
      .createSignedUrl(
        material.file_path,
        300,
        forDownload ? { download: material.file_name || `${material.title}.pdf` } : undefined,
      );

    if (error || !data?.signedUrl) {
      const status = (error as any)?.statusCode;
      if (status === '403' || status === '400' || status === 403) throw new Error(LOCKED_MESSAGE);
      throw new Error(error?.message || 'Could not create a secure link. Please try again.');
    }
    return data.signedUrl;
  };

  const handleDownload = async (material: CourseMaterial) => {
    setDownloadingId(material.id);
    try {
      const url = await getSignedUrl(material, true);
      const link = document.createElement('a');
      link.href = url;
      link.rel = 'noopener';
      link.download = material.file_name || `${material.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      toast({
        title: 'Download failed',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async (material: CourseMaterial) => {
    setPreviewingId(material.id);
    try {
      const url = await getSignedUrl(material, false);
      setPreview({ title: material.title, url });
    } catch (err: any) {
      toast({
        title: 'Preview unavailable',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setPreviewingId(null);
    }
  };

  if (isLoading || materials.length === 0) return null;

  return (
    <div className="mb-10">
      <h2 className="text-2xl font-display font-bold mb-2">Course Materials</h2>
      <p className="text-muted-foreground mb-6">
        {materials.length} downloadable PDF{materials.length > 1 ? 's' : ''}
        {!hasAccess && ' — available after you enroll'}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {materials.map((material) => (
          <Card key={material.id}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{material.title}</p>
                <p className="text-xs text-muted-foreground">
                  PDF {formatFileSize(material.file_size_bytes) && `• ${formatFileSize(material.file_size_bytes)}`}
                </p>
              </div>
              {hasAccess ? (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Preview ${material.title}`}
                    disabled={previewingId === material.id}
                    onClick={() => handlePreview(material)}
                  >
                    {previewingId === material.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label={`Download ${material.title}`}
                    disabled={downloadingId === material.id}
                    onClick={() => handleDownload(material)}
                  >
                    {downloadingId === material.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 pb-3 border-b">
            <DialogTitle className="truncate pr-8 text-left">{preview?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 bg-muted">
            {preview && (
              <iframe
                src={`${preview.url}#toolbar=0`}
                title={preview.title}
                className="w-full h-full border-0"
              />
            )}
          </div>
          <div className="p-3 border-t flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => preview && window.open(preview.url, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Open in new tab
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
