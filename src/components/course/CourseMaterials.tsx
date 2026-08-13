import { useEffect, useState } from 'react';
import { Download, FileText, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatFileSize, type CourseMaterial } from '@/components/admin/CourseMaterialsManager';

interface Props {
  courseId: string;
  hasAccess: boolean;
}

export function CourseMaterials({ courseId, hasAccess }: Props) {
  const { toast } = useToast();
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

  const handleDownload = async (material: CourseMaterial) => {
    setDownloadingId(material.id);
    try {
      const { data, error } = await supabase.storage
        .from('course-materials')
        .createSignedUrl(material.file_path, 300, { download: material.file_name || `${material.title}.pdf` });
      if (error || !data?.signedUrl) throw error || new Error('Could not create download link');

      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.rel = 'noopener';
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
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
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
              ) : (
                <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
