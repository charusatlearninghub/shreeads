import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, Trash2, Upload, Monitor, Smartphone, Apple, Terminal, 
  Loader2, Check, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

type SoftwarePlatform = 'android' | 'windows' | 'mac' | 'linux';
type SoftwareFileType = 'apk' | 'exe' | 'msi' | 'dmg' | 'pkg' | 'appimage' | 'deb' | 'rpm';

interface SoftwareVersionManagerProps {
  productId: string;
}

const platformOptions = [
  { value: 'android', label: 'Android', icon: Smartphone },
  { value: 'windows', label: 'Windows', icon: Monitor },
  { value: 'mac', label: 'macOS', icon: Apple },
  { value: 'linux', label: 'Linux', icon: Terminal },
];

const fileTypeOptions: Record<string, string[]> = {
  android: ['apk'],
  windows: ['exe', 'msi'],
  mac: ['dmg', 'pkg'],
  linux: ['appimage', 'deb', 'rpm'],
};

// File size limits
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

export const SoftwareVersionManager = ({ productId }: SoftwareVersionManagerProps) => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({
    version_number: '',
    release_notes: '',
    platform: '',
    file_type: '',
    file: null as File | null,
    file_url: '',
    use_link: false,
    is_latest: true,
  });

  // Fetch versions
  const { data: versions, isLoading } = useQuery({
    queryKey: ['software-versions', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('software_versions')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Upload and create version
  const createMutation = useMutation({
    mutationFn: async () => {
      const usingLink = formData.use_link;
      
      if (!formData.platform || !formData.file_type || !formData.version_number) {
        throw new Error('Please fill all required fields');
      }

      if (usingLink && !formData.file_url.trim()) {
        throw new Error('Please provide a file URL');
      }

      if (!usingLink && !formData.file) {
        throw new Error('Please select a file to upload');
      }

      if (!usingLink && formData.file && formData.file.size > MAX_FILE_SIZE) {
        throw new Error(`File size exceeds the maximum limit of ${formatFileSize(MAX_FILE_SIZE)}`);
      }

      let fileUrl = '';
      let fileSizeBytes: number | null = null;

      if (usingLink) {
        // Use the provided URL directly
        fileUrl = formData.file_url.trim();
        fileSizeBytes = null;
      } else {
        // Upload file to storage
        setUploading(true);
        setUploadProgress(0);

        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + Math.random() * 10;
          });
        }, 500);

        try {
          const fileName = `${productId}/${formData.platform}/${formData.version_number}.${formData.file_type}`;
          const { error: uploadError } = await supabase.storage
            .from('software-files')
            .upload(fileName, formData.file!, {
              cacheControl: '3600',
              upsert: true,
            });

          clearInterval(progressInterval);
          setUploadProgress(95);

          if (uploadError) throw uploadError;

          fileUrl = fileName;
          fileSizeBytes = formData.file!.size;
        } catch (error) {
          clearInterval(progressInterval);
          throw error;
        }
      }

      // If this is marked as latest, unmark previous latest versions for same platform
      if (formData.is_latest) {
        await supabase
          .from('software_versions')
          .update({ is_latest: false })
          .eq('product_id', productId)
          .eq('platform', formData.platform as SoftwarePlatform);
      }

      // Create version record
      const { error: insertError } = await supabase.from('software_versions').insert({
        product_id: productId,
        version_number: formData.version_number,
        release_notes: formData.release_notes || null,
        platform: formData.platform as SoftwarePlatform,
        file_type: formData.file_type as SoftwareFileType,
        file_url: fileUrl,
        file_size_bytes: fileSizeBytes,
        is_latest: formData.is_latest,
      });

      setUploadProgress(100);

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      toast.success('Version uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['software-versions', productId] });
      queryClient.invalidateQueries({ queryKey: ['software-version-counts'] });
      setIsAdding(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload version');
    },
    onSettled: () => {
      setUploading(false);
      setUploadProgress(0);
    },
  });

  // Delete version
  const deleteMutation = useMutation({
    mutationFn: async (version: any) => {
      // Delete from storage
      await supabase.storage.from('software-files').remove([version.file_url]);
      
      // Delete record
      const { error } = await supabase
        .from('software_versions')
        .delete()
        .eq('id', version.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Version deleted');
      queryClient.invalidateQueries({ queryKey: ['software-versions', productId] });
      queryClient.invalidateQueries({ queryKey: ['software-version-counts'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete version');
    },
  });

  const resetForm = () => {
    setFormData({
      version_number: '',
      release_notes: '',
      platform: '',
      file_type: '',
      file: null,
      file_url: '',
      use_link: false,
      is_latest: true,
    });
    setUploadProgress(0);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const getPlatformIcon = (platform: string) => {
    const option = platformOptions.find(p => p.value === platform);
    return option?.icon || Monitor;
  };

  const isFileTooLarge = formData.file && formData.file.size > MAX_FILE_SIZE;

  return (
    <div className="space-y-6">
      {/* File Limits Info */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-500">Upload Limits</h4>
            <ul className="text-sm text-muted-foreground mt-1 space-y-0.5">
              <li>• Maximum file size: <strong>{formatFileSize(MAX_FILE_SIZE)}</strong></li>
              <li>• Supported: APK, EXE, MSI, DMG, PKG, AppImage, DEB, RPM</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add New Version */}
      {!isAdding ? (
        <Button onClick={() => setIsAdding(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Version
        </Button>
      ) : (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Version Number *</Label>
                <Input
                  placeholder="e.g., 1.0.0"
                  value={formData.version_number}
                  onChange={(e) => setFormData({ ...formData, version_number: e.target.value })}
                />
              </div>
              <div>
                <Label>Platform *</Label>
                <Select
                  value={formData.platform}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    platform: value,
                    file_type: fileTypeOptions[value]?.[0] || '',
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {platformOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="w-4 h-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.platform && (
              <div>
                <Label>File Type *</Label>
                <Select
                  value={formData.file_type}
                  onValueChange={(value) => setFormData({ ...formData, file_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select file type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fileTypeOptions[formData.platform]?.map(type => (
                      <SelectItem key={type} value={type}>
                        .{type.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Release Notes</Label>
              <Textarea
                placeholder="What's new in this version..."
                value={formData.release_notes}
                onChange={(e) => setFormData({ ...formData, release_notes: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label>Software File *</Label>
              <div className="flex items-center gap-2 mt-2 mb-3">
                <Button
                  type="button"
                  variant={!formData.use_link ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData({ ...formData, use_link: false, file_url: '' })}
                >
                  <Upload className="w-3 h-3 mr-1" /> Upload File
                </Button>
                <Button
                  type="button"
                  variant={formData.use_link ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormData({ ...formData, use_link: true, file: null })}
                >
                  🔗 File Link
                </Button>
              </div>

              {formData.use_link ? (
                <div>
                  <Input
                    placeholder="https://example.com/file.apk"
                    value={formData.file_url}
                    onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Paste a direct download link for the software file
                  </p>
                </div>
              ) : (
                <div>
                  <Input
                    type="file"
                    accept={formData.file_type ? `.${formData.file_type}` : undefined}
                    onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                  />
                  {formData.file && (
                    <div className={`mt-2 p-3 rounded-lg ${isFileTooLarge ? 'bg-destructive/10 border border-destructive/50' : 'bg-secondary/50'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{formData.file.name}</span>
                        <span className={`text-sm ${isFileTooLarge ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                          {formatFileSize(formData.file.size)}
                        </span>
                      </div>
                      {isFileTooLarge && (
                        <p className="text-sm text-destructive mt-1">
                          File exceeds maximum size of {formatFileSize(MAX_FILE_SIZE)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch
                id="is_latest"
                checked={formData.is_latest}
                onCheckedChange={(checked) => setFormData({ ...formData, is_latest: checked })}
              />
              <Label htmlFor="is_latest">Mark as latest version for this platform</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setIsAdding(false); resetForm(); }}>
                Cancel
              </Button>
              <Button 
                onClick={() => createMutation.mutate()}
                disabled={uploading || !formData.platform || !formData.version_number || (!formData.use_link && (!formData.file || !!isFileTooLarge)) || (formData.use_link && !formData.file_url.trim())}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" /> Upload Version
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Versions List */}
      <div className="space-y-3">
        {isLoading ? (
          <p className="text-muted-foreground">Loading versions...</p>
        ) : versions?.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No versions uploaded yet. Add your first version above.
          </p>
        ) : (
          versions?.map(version => {
            const PlatformIcon = getPlatformIcon(version.platform);
            return (
              <Card key={version.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                      <PlatformIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">v{version.version_number}</span>
                        <Badge variant="outline" className="uppercase text-xs">
                          {version.file_type}
                        </Badge>
                        {version.is_latest && (
                          <Badge className="bg-green-500/10 text-green-500">
                            <Check className="w-3 h-3 mr-1" /> Latest
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span>{platformOptions.find(p => p.value === version.platform)?.label}</span>
                        <span>•</span>
                        <span>{formatFileSize(version.file_size_bytes)}</span>
                        <span>•</span>
                        <span>{format(new Date(version.created_at), 'MMM d, yyyy')}</span>
                      </div>
                      {version.release_notes && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                          {version.release_notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Delete this version? The file will also be removed.')) {
                        deleteMutation.mutate(version);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
