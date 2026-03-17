import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, Pencil, Trash2, Package, Eye, EyeOff, 
  Upload, Monitor, Smartphone, Apple, Terminal 
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { SoftwareVersionManager } from '@/components/admin/SoftwareVersionManager';

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  android: Smartphone,
  windows: Monitor,
  mac: Apple,
  linux: Terminal,
};

// Maximum file size in bytes (500MB)
const MAX_FILE_SIZE = 500 * 1024 * 1024;
const MAX_FILE_SIZE_DISPLAY = "500MB";

const AdminSoftware = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [manageVersionsProduct, setManageVersionsProduct] = useState<any>(null);

  // Form state - separate from dialog state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  // Fetch products
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-software-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('software_products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch version counts
  const { data: versionCounts } = useQuery({
    queryKey: ['software-version-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('software_versions')
        .select('product_id, platform');
      
      if (error) throw error;
      
      const counts: Record<string, { total: number; platforms: string[] }> = {};
      data?.forEach(v => {
        if (!counts[v.product_id]) {
          counts[v.product_id] = { total: 0, platforms: [] };
        }
        counts[v.product_id].total++;
        if (!counts[v.product_id].platforms.includes(v.platform)) {
          counts[v.product_id].platforms.push(v.platform);
        }
      });
      return counts;
    },
  });

  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setShortDescription('');
    setThumbnailUrl('');
    setCategory('');
    setPrice('');
    setDiscountPrice('');
    setIsFree(false);
    setIsPublished(false);
  }, []);

  const loadFormFromProduct = useCallback((product: any) => {
    setTitle(product.title || '');
    setDescription(product.description || '');
    setShortDescription(product.short_description || '');
    setThumbnailUrl(product.thumbnail_url || '');
    setCategory(product.category || '');
    setPrice(product.price?.toString() || '');
    setDiscountPrice(product.discount_price?.toString() || '');
    setIsFree(product.is_free || false);
    setIsPublished(product.is_published || false);
  }, []);

  // Create product
  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('software_products').insert({
        title: title,
        description: description,
        short_description: shortDescription,
        thumbnail_url: thumbnailUrl || null,
        category: category || null,
        price: isFree ? 0 : parseFloat(price) || 0,
        discount_price: discountPrice ? parseFloat(discountPrice) : null,
        is_free: isFree,
        is_published: isPublished,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Software created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-software-products'] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create software');
    },
  });

  // Update product
  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('software_products')
        .update({
          title: title,
          description: description,
          short_description: shortDescription,
          thumbnail_url: thumbnailUrl || null,
          category: category || null,
          price: isFree ? 0 : parseFloat(price) || 0,
          discount_price: discountPrice ? parseFloat(discountPrice) : null,
          is_free: isFree,
          is_published: isPublished,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Software updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-software-products'] });
      setEditingProduct(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update software');
    },
  });

  // Delete product
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('software_products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Software deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-software-products'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete software');
    },
  });

  const openEditDialog = (product: any) => {
    loadFormFromProduct(product);
    setEditingProduct(product);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (editingProduct) {
      updateMutation.mutate(editingProduct.id);
    } else {
      createMutation.mutate();
    }
  };

  const productFormContent = (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div>
        <Label htmlFor="form-title">Title *</Label>
        <Input
          id="form-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Software name"
        />
      </div>

      <div>
        <Label htmlFor="form-short-desc">Short Description</Label>
        <Input
          id="form-short-desc"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          placeholder="Brief description for cards"
        />
      </div>

      <div>
        <Label htmlFor="form-description">Full Description</Label>
        <Textarea
          id="form-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detailed description"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="form-category">Category</Label>
          <Input
            id="form-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Productivity, Games"
          />
        </div>
        <div>
          <Label htmlFor="form-thumbnail">Thumbnail URL</Label>
          <Input
            id="form-thumbnail"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="form-is-free"
            checked={isFree}
            onCheckedChange={setIsFree}
          />
          <Label htmlFor="form-is-free">Free Software</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="form-is-published"
            checked={isPublished}
            onCheckedChange={setIsPublished}
          />
          <Label htmlFor="form-is-published">Published</Label>
        </div>
      </div>

      {!isFree && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="form-price">Price (₹)</Label>
            <Input
              id="form-price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <Label htmlFor="form-discount-price">Discount Price (₹)</Label>
            <Input
              id="form-discount-price"
              type="number"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>
      )}

      {/* File Upload Info */}
      <div className="p-4 bg-secondary/50 rounded-lg">
        <h4 className="font-medium mb-2">File Upload Limits</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Maximum file size: <strong>{MAX_FILE_SIZE_DISPLAY}</strong> per file</li>
          <li>• Supported formats: APK, EXE, MSI, DMG, PKG, AppImage, DEB, RPM</li>
          <li>• Upload versions after creating the software</li>
        </ul>
      </div>

      <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-background pb-2">
        <Button
          variant="outline"
          onClick={() => {
            setIsCreateOpen(false);
            setEditingProduct(null);
            resetForm();
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {editingProduct ? 'Update' : 'Create'} Software
        </Button>
      </div>
    </div>
  );

  return (
    <AdminLayout title="Software Management" subtitle="Manage apps and software for your marketplace">
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex justify-end">
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Add Software
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Software</DialogTitle>
              </DialogHeader>
              {productFormContent}
            </DialogContent>
          </Dialog>
        </div>

        {/* Products Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : products?.length === 0 ? (
              <div className="p-16 text-center">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No software added yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Software</TableHead>
                    <TableHead className="hidden sm:table-cell">Category</TableHead>
                    <TableHead className="hidden md:table-cell">Platforms</TableHead>
                    <TableHead className="hidden lg:table-cell">Price</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.map((product) => {
                    const versions = versionCounts?.[product.id];
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded flex items-center justify-center shrink-0">
                              {product.thumbnail_url ? (
                                <img
                                  src={product.thumbnail_url}
                                  alt={product.title}
                                  className="w-full h-full object-cover rounded"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate max-w-[150px] sm:max-w-[200px]">{product.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {versions?.total || 0} version(s)
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {product.category ? (
                            <Badge variant="secondary">{product.category}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex gap-1">
                            {versions?.platforms.map((platform) => {
                              const Icon = platformIcons[platform] || Monitor;
                              return (
                                <Badge key={platform} variant="outline" className="p-1">
                                  <Icon className="w-3 h-3" />
                                </Badge>
                              );
                            })}
                            {!versions?.platforms.length && (
                              <span className="text-muted-foreground text-sm">None</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {product.is_free ? (
                            <Badge variant="secondary">Free</Badge>
                          ) : (
                            <span>₹{product.discount_price || product.price}</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {product.is_published ? (
                            <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                              <Eye className="w-3 h-3 mr-1" /> Published
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <EyeOff className="w-3 h-3 mr-1" /> Draft
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setManageVersionsProduct(product)}
                              title="Manage versions"
                            >
                              <Upload className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(product)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this software?')) {
                                  deleteMutation.mutate(product.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editingProduct} onOpenChange={(open) => {
          if (!open) {
            setEditingProduct(null);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Software</DialogTitle>
            </DialogHeader>
            {productFormContent}
          </DialogContent>
        </Dialog>

        {/* Version Manager Dialog */}
        <Dialog open={!!manageVersionsProduct} onOpenChange={() => setManageVersionsProduct(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Versions - {manageVersionsProduct?.title}</DialogTitle>
            </DialogHeader>
            {manageVersionsProduct && (
              <SoftwareVersionManager productId={manageVersionsProduct.id} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminSoftware;
