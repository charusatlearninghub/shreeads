import { useState, useEffect } from 'react';
import { MobileDataCard, MobileCardList } from '@/components/admin/MobileDataCard';
import { usePagination } from '@/hooks/usePagination';
import { TablePagination } from '@/components/admin/TablePagination';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Percent, 
  Trash2,
  Edit,
  Tag,
  Clock
} from 'lucide-react';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  usePromotions,
  usePromotionCourses,
  usePromotionSoftware,
  useCreatePromotion,
  useUpdatePromotion,
  useDeletePromotion,
  Promotion,
} from '@/hooks/usePromotions';
import { PromotionForm } from '@/components/admin/PromotionForm';

interface Course {
  id: string;
  title: string;
  price: number | null;
  is_free: boolean | null;
}

interface SoftwareProduct {
  id: string;
  title: string;
  price: number | null;
  is_free: boolean | null;
}

const getPromotionStatus = (promotion: Promotion) => {
  const now = new Date();
  const start = parseISO(promotion.start_date);
  const end = parseISO(promotion.end_date);
  
  if (!promotion.is_active) return { status: 'inactive', color: 'secondary' as const };
  if (isBefore(now, start)) return { status: 'scheduled', color: 'outline' as const };
  if (isAfter(now, end)) return { status: 'expired', color: 'destructive' as const };
  return { status: 'active', color: 'default' as const };
};

export default function AdminPromotions() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const { data: promotions, isLoading } = usePromotions();
  
  const { data: courses } = useQuery({
    queryKey: ['courses-for-promotions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, price, is_free')
        .eq('is_published', true);
      if (error) throw error;
      return data as Course[];
    },
  });
  
  const { data: software } = useQuery({
    queryKey: ['software-for-promotions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('software_products')
        .select('id, title, price, is_free')
        .eq('is_published', true);
      if (error) throw error;
      return data as SoftwareProduct[];
    },
  });
  
  const createPromotion = useCreatePromotion();
  const updatePromotion = useUpdatePromotion();
  const deletePromotion = useDeletePromotion();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_percentage: 10,
    start_date: '',
    end_date: '',
    is_active: true,
    course_ids: [] as string[],
    product_ids: [] as string[],
  });
  
  const { data: editingPromotionCourses } = usePromotionCourses(editingPromotion?.id || null);
  const { data: editingPromotionSoftware } = usePromotionSoftware(editingPromotion?.id || null);
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discount_percentage: 10,
      start_date: '',
      end_date: '',
      is_active: true,
      course_ids: [],
      product_ids: [],
    });
  };
  
  const handleCreate = async () => {
    await createPromotion.mutateAsync({
      name: formData.name,
      description: formData.description || undefined,
      discount_percentage: formData.discount_percentage,
      start_date: new Date(formData.start_date).toISOString(),
      end_date: new Date(formData.end_date).toISOString(),
      is_active: formData.is_active,
      course_ids: formData.course_ids,
      product_ids: formData.product_ids,
    });
    setIsCreateOpen(false);
    resetForm();
  };
  
  const handleUpdate = async () => {
    if (!editingPromotion) return;
    
    await updatePromotion.mutateAsync({
      id: editingPromotion.id,
      updates: {
        name: formData.name,
        description: formData.description || null,
        discount_percentage: formData.discount_percentage,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        is_active: formData.is_active,
      },
      course_ids: formData.course_ids,
      product_ids: formData.product_ids,
    });
    setEditingPromotion(null);
    resetForm();
  };
  
  // Update form when editing promotion courses/software are loaded
  useEffect(() => {
    if (editingPromotion && (editingPromotionCourses || editingPromotionSoftware)) {
      setFormData(prev => ({
        ...prev,
        course_ids: editingPromotionCourses?.map(pc => pc.course_id) || prev.course_ids,
        product_ids: editingPromotionSoftware?.map(ps => ps.product_id) || prev.product_ids,
      }));
    }
  }, [editingPromotionCourses, editingPromotionSoftware, editingPromotion]);
  
  const handleEdit = (promotion: Promotion) => {
    setFormData({
      name: promotion.name,
      description: promotion.description || '',
      discount_percentage: promotion.discount_percentage,
      start_date: format(parseISO(promotion.start_date), "yyyy-MM-dd'T'HH:mm"),
      end_date: format(parseISO(promotion.end_date), "yyyy-MM-dd'T'HH:mm"),
      is_active: promotion.is_active,
      course_ids: [],
      product_ids: [],
    });
    setEditingPromotion(promotion);
  };
  
  const handleDelete = async () => {
    if (!deleteId) return;
    await deletePromotion.mutateAsync(deleteId);
    setDeleteId(null);
  };
  
  const paidCourses = courses?.filter(c => !c.is_free && c.price && c.price > 0) || [];
  const paidSoftware = software?.filter(s => !s.is_free && s.price && s.price > 0) || [];

  const promosPagination = usePagination(promotions, { pageSize: 10 });
  const paginatedPromos = promosPagination.paginatedItems;
  
  return (
    <AdminLayout
      title="Promotions"
      subtitle="Manage time-limited discount campaigns for courses and software"
      actions={
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              New Promotion
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Promotion</DialogTitle>
            </DialogHeader>
            <PromotionForm 
              formData={formData}
              setFormData={setFormData}
              paidCourses={paidCourses}
              paidSoftware={paidSoftware}
              onSubmit={handleCreate} 
            />
          </DialogContent>
        </Dialog>
      }
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Tag className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {promotions?.filter(p => getPromotionStatus(p).status === 'active').length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Active Promotions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {promotions?.filter(p => getPromotionStatus(p).status === 'scheduled').length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Percent className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {promotions?.reduce((max, p) => Math.max(max, p.discount_percentage), 0) || 0}%
                </p>
                <p className="text-sm text-muted-foreground">Max Discount</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Promotions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Promotions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : promotions && promotions.length > 0 ? (
            <>
            {/* Mobile Card View */}
            <MobileCardList>
              {paginatedPromos.map((promotion) => {
                const { status, color } = getPromotionStatus(promotion);
                return (
                  <MobileDataCard
                    key={promotion.id}
                    fields={[
                      { label: 'Name', value: <span className="font-medium">{promotion.name}</span> },
                      { label: 'Discount', value: <Badge variant="outline" className="font-mono">{promotion.discount_percentage}% OFF</Badge> },
                      { label: 'Start', value: format(parseISO(promotion.start_date), 'MMM d, yyyy') },
                      { label: 'End', value: format(parseISO(promotion.end_date), 'MMM d, yyyy') },
                      { label: 'Status', value: <Badge variant={color} className="capitalize">{status}</Badge> },
                    ]}
                    actions={
                      <>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(promotion)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(promotion.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </>
                    }
                  />
                );
              })}
            </MobileCardList>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPromos.map((promotion) => {
                    const { status, color } = getPromotionStatus(promotion);
                    return (
                      <TableRow key={promotion.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{promotion.name}</p>
                            {promotion.description && <p className="text-sm text-muted-foreground truncate max-w-xs">{promotion.description}</p>}
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="font-mono">{promotion.discount_percentage}% OFF</Badge></TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{format(parseISO(promotion.start_date), 'MMM d, yyyy')}</p>
                            <p className="text-muted-foreground">to {format(parseISO(promotion.end_date), 'MMM d, yyyy')}</p>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant={color} className="capitalize">{status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(promotion)}><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(promotion.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <TablePagination
              currentPage={promosPagination.currentPage}
              totalPages={promosPagination.totalPages}
              totalItems={promosPagination.totalItems}
              pageSize={promosPagination.pageSize}
              onPageChange={promosPagination.goToPage}
            />
            </>
          ) : (
            <div className="text-center py-12">
              <Tag className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-2">No promotions yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Create your first promotion to offer discounts on courses and software.
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Promotion
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Edit Dialog */}
      <Dialog open={!!editingPromotion} onOpenChange={(open) => !open && setEditingPromotion(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Promotion</DialogTitle>
          </DialogHeader>
          <PromotionForm 
            formData={formData}
            setFormData={setFormData}
            paidCourses={paidCourses}
            paidSoftware={paidSoftware}
            onSubmit={handleUpdate} 
            isEdit 
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promotion?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this promotion. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
