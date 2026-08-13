import { useCallback, useEffect, useState } from 'react';
import { FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface CourseMaterial {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  file_path: string;
  file_name: string | null;
  file_size_bytes: number | null;
  order_index: number;
}

export const formatFileSize = (bytes?: number | null) => {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

interface Props {
  courseId: string;
}

export function CourseMaterialsManager({ courseId }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fetchMaterials = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('course_materials')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setMaterials((data as CourseMaterial[]) || []);
    }
    setIsLoading(false);
  }, [courseId, toast]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    let uploaded = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        toast({ title: 'Skipped', description: `${file.name} is not a PDF`, variant: 'destructive' });
        continue;
      }
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${courseId}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(path, file, { contentType: 'application/pdf', upsert: false });

      if (uploadError) {
        toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
        continue;
      }

      const { error: insertError } = await supabase.from('course_materials').insert({
        course_id: courseId,
        title: file.name.replace(/\.pdf$/i, ''),
        file_path: path,
        file_name: file.name,
        file_size_bytes: file.size,
        order_index: materials.length + uploaded,
        created_by: user?.id ?? null,
      });

      if (insertError) {
        toast({ title: 'Error', description: insertError.message, variant: 'destructive' });
        continue;
      }
      uploaded++;
    }

    setIsUploading(false);
    if (uploaded > 0) {
      toast({ title: 'Uploaded', description: `${uploaded} PDF${uploaded > 1 ? 's' : ''} added` });
      fetchMaterials();
    }
  };

  const handleRename = async (material: CourseMaterial, title: string) => {
    if (!title.trim() || title === material.title) return;
    const { error } = await supabase
      .from('course_materials')
      .update({ title: title.trim() })
      .eq('id', material.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setMaterials((prev) => prev.map((m) => (m.id === material.id ? { ...m, title: title.trim() } : m)));
  };

  const handleDelete = async (material: CourseMaterial) => {
    if (!confirm(`Delete "${material.title}"?`)) return;
    await supabase.storage.from('course-materials').remove([material.file_path]);
    const { error } = await supabase.from('course_materials').delete().eq('id', material.id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Deleted', description: 'Material removed' });
    setMaterials((prev) => prev.filter((m) => m.id !== material.id));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="material-upload" className="mb-2 block">Upload PDFs (multiple allowed)</Label>
        <div className="flex items-center gap-3">
          <Input
            id="material-upload"
            type="file"
            accept="application/pdf"
            multiple
            disabled={isUploading}
            onChange={(e) => {
              handleFiles(e.target.files);
              e.currentTarget.value = '';
            }}
          />
          {isUploading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Students see these as downloadable resources before the first video.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-8 border rounded-lg">
          <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No PDFs uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {materials.map((material) => (
            <div key={material.id} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
              <FileText className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <Input
                  defaultValue={material.title}
                  className="h-8"
                  onBlur={(e) => handleRename(material, e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {material.file_name} {formatFileSize(material.file_size_bytes) && `• ${formatFileSize(material.file_size_bytes)}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive shrink-0"
                onClick={() => handleDelete(material)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
