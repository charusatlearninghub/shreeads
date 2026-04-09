import { useState } from 'react';
import { usePagination } from '@/hooks/usePagination';
import { TablePagination } from '@/components/admin/TablePagination';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Ticket, Copy, Check, X, Loader2, Pencil, Calendar, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SoftwarePromoCodeUsageRow {
  id: string;
  user_name: string | null;
  user_email: string | null;
  product_name: string;
  used_at: string;
}

interface SoftwarePromoCodeRow {
  id: string;
  code: string;
  product_id: string;
  promo_price?: number | null;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  expires_at: string | null;
  created_at: string;
  product?: { title: string };
  software_promo_code_usage?: SoftwarePromoCodeUsageRow[];
}

function getSortedSoftwareUsage(code: SoftwarePromoCodeRow): SoftwarePromoCodeUsageRow[] {
  const rows = code.software_promo_code_usage ?? [];
  return [...rows].sort(
    (a, b) => new Date(b.used_at).getTime() - new Date(a.used_at).getTime()
  );
}

function getSoftwareUsageSummary(code: SoftwarePromoCodeRow) {
  const rows = getSortedSoftwareUsage(code);
  const count = rows.length;
  const latest = rows[0];
  return { rows, count, latest };
}

const AdminSoftwarePromoCodes = () => {
  const queryClient = useQueryClient();
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [codeCount, setCodeCount] = useState('10');
  const [expiryDays, setExpiryDays] = useState('30');
  const [softwarePromoPrice, setSoftwarePromoPrice] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingCode, setEditingCode] = useState<SoftwarePromoCodeRow | null>(null);
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [usageDetailCode, setUsageDetailCode] = useState<SoftwarePromoCodeRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SoftwarePromoCodeRow | null>(null);

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ['software-products-for-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('software_products')
        .select('id, title')
        .order('title');
      if (error) throw error;
      return data;
    },
  });

  // Fetch promo codes
  const { data: promoCodes, isLoading } = useQuery({
    queryKey: ['admin-software-promo-codes'],
    queryFn: async () => {
      const { data: codes, error } = await supabase
        .from('software_promo_codes')
        .select(`*, product:software_products(title)`)
        .order('created_at', { ascending: false });
      if (error) throw error;

      let merged = (codes || []) as SoftwarePromoCodeRow[];
      const ids = merged.map((c) => c.id);
      if (ids.length > 0) {
        const { data: usageRows, error: usageError } = await (supabase as any)
          .from('software_promo_code_usage')
          .select('id, software_promo_code_id, user_name, user_email, product_name, used_at')
          .in('software_promo_code_id', ids);

        if (!usageError && usageRows?.length) {
          const byId = new Map<string, SoftwarePromoCodeUsageRow[]>();
          for (const row of usageRows) {
            const slice: SoftwarePromoCodeUsageRow = {
              id: row.id,
              user_name: row.user_name,
              user_email: row.user_email,
              product_name: row.product_name,
              used_at: row.used_at,
            };
            const list = byId.get(row.software_promo_code_id) ?? [];
            list.push(slice);
            byId.set(row.software_promo_code_id, list);
          }
          merged = merged.map((c) => ({
            ...c,
            software_promo_code_usage: byId.get(c.id) ?? c.software_promo_code_usage ?? [],
          }));
        } else if (usageError) {
          console.warn('software_promo_code_usage fetch skipped:', usageError.message);
        }
      }

      return merged;
    },
  });

  // Generate codes mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct) throw new Error('Please select a product');
      const count = parseInt(codeCount) || 10;
      const days = parseInt(expiryDays) || 30;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
      const codes = [];
      const paid = Math.max(0, Number(softwarePromoPrice) || 0);
      for (let i = 0; i < count; i++) {
        codes.push({
          code: `SW-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          product_id: selectedProduct,
          expires_at: expiresAt.toISOString(),
          promo_price: paid,
        });
      }
      const { error } = await supabase.from('software_promo_codes').insert(codes);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Generated ${codeCount} promo codes`);
      queryClient.invalidateQueries({ queryKey: ['admin-software-promo-codes'] });
      setIsGenerateOpen(false);
      setSelectedProduct('');
      setSoftwarePromoPrice('');
    },
    onError: (error: any) => toast.error(error.message || 'Failed to generate codes'),
  });

  // Delete code mutation
  const deleteMutation = useMutation({
    mutationFn: async (code: SoftwarePromoCodeRow) => {
      const { data, error } = await supabase.functions.invoke('delete-promo-code', {
        body: { codeId: code.id, type: 'software' },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Code deleted');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin-software-promo-codes'] });
    },
    onError: (error: any) => toast.error(error.message || 'Failed to delete code'),
  });

  // Update expiration mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingCode) throw new Error('No code selected');
      const { error } = await supabase
        .from('software_promo_codes')
        .update({ expires_at: editExpiresAt ? new Date(editExpiresAt).toISOString() : null })
        .eq('id', editingCode.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Expiration date updated');
      queryClient.invalidateQueries({ queryKey: ['admin-software-promo-codes'] });
      setShowEditDialog(false);
      setEditingCode(null);
    },
    onError: (error: any) => toast.error(error.message || 'Failed to update'),
  });

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleEditCode = (code: SoftwarePromoCodeRow) => {
    setEditingCode(code);
    setEditExpiresAt(code.expires_at ? code.expires_at.split('T')[0] : '');
    setShowEditDialog(true);
  };

  const getCodeStatus = (code: SoftwarePromoCodeRow) => {
    if (code.is_used) return 'used';
    if (code.expires_at && new Date(code.expires_at) <= new Date()) return 'expired';
    return 'active';
  };

  const stats = {
    total: promoCodes?.length || 0,
    used: promoCodes?.filter(c => c.is_used).length || 0,
    available: promoCodes?.filter(c => getCodeStatus(c) === 'active').length || 0,
    expired: promoCodes?.filter(c => getCodeStatus(c) === 'expired').length || 0,
  };

  const filteredCodes = (promoCodes || []).filter((code: SoftwarePromoCodeRow) => {
    const matchesSearch = code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (code.product?.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const status = getCodeStatus(code);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const softCodesPagination = usePagination(filteredCodes, { pageSize: 10 });
  const paginatedSoftCodes = softCodesPagination.paginatedItems;

  return (
    <AdminLayout title="Software Promo Codes" subtitle="Generate and manage promo codes for software products">
      <div className="space-y-6">
        {/* Actions */}
        <div className="flex justify-end">
          <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Generate Codes
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Promo Codes</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Software Product *</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Number of Codes</Label>
                    <Input type="number" min="1" max="100" value={codeCount} onChange={(e) => setCodeCount(e.target.value)} />
                  </div>
                  <div>
                    <Label>Expires in (days)</Label>
                    <Input type="number" min="1" value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Price paid on redeem (₹)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    placeholder="e.g. 1000"
                    value={softwarePromoPrice}
                    onChange={(e) => setSoftwarePromoPrice(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Recorded as software purchase revenue.</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>Cancel</Button>
                  <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending || !selectedProduct}>
                    {generateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Generate
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Codes</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Available</p><p className="text-2xl font-bold text-green-500">{stats.available}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Used</p><p className="text-2xl font-bold text-blue-500">{stats.used}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Expired</p><p className="text-2xl font-bold text-red-500">{stats.expired}</p></CardContent></Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search codes or products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Available</SelectItem>
              <SelectItem value="used">Used</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Codes Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : promoCodes?.length === 0 ? (
              <div className="p-16 text-center">
                <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No promo codes generated yet</p>
              </div>
            ) : (
              <>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead className="hidden sm:table-cell">Product</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell text-center w-[72px]">Uses</TableHead>
                    <TableHead className="hidden md:table-cell min-w-[120px]">Used By</TableHead>
                    <TableHead className="hidden md:table-cell">Used Date</TableHead>
                    <TableHead className="hidden lg:table-cell">Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSoftCodes.map((code: SoftwarePromoCodeRow) => {
                    const isExpired = code.expires_at && new Date(code.expires_at) <= new Date();
                    const { count: usageCount, latest } = getSoftwareUsageSummary(code);
                    const usedByDisplay =
                      usageCount === 0
                        ? '—'
                        : usageCount === 1
                          ? latest?.user_name?.trim() || latest?.user_email || '—'
                          : `${latest?.user_name?.trim() || latest?.user_email || 'User'} · +${usageCount - 1}`;
                    return (
                      <TableRow key={code.id}>
                        <TableCell>
                          <button
                            type="button"
                            className="bg-secondary px-2 py-1 rounded text-sm font-mono text-left hover:bg-muted transition-colors max-w-[140px] truncate"
                            title="View usage details"
                            onClick={() => setUsageDetailCode(code)}
                          >
                            {code.code}
                          </button>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {code.product?.title || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {code.is_used ? (
                            <Badge className="bg-blue-500/10 text-blue-500">Used</Badge>
                          ) : isExpired ? (
                            <Badge variant="destructive">Expired</Badge>
                          ) : (
                            <Badge className="bg-green-500/10 text-green-500">Available</Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-center tabular-nums">
                          {usageCount}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm max-w-[160px] truncate" title={usedByDisplay}>
                          {usedByDisplay}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {latest ? format(new Date(latest.used_at), 'MMM d, yyyy') : '—'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {code.expires_at ? format(new Date(code.expires_at), 'MMM d, yyyy') : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => copyCode(code.code)}
                              title="Copy code"
                            >
                              {copiedCode === code.code ? (
                                <Check className="w-3 h-3 text-green-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditCode(code)}
                              disabled={code.is_used}
                              title="Edit expiration"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setDeleteTarget(code)}
                              disabled={deleteMutation.isPending}
                              title="Delete code"
                            >
                              <X className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
              <TablePagination
                currentPage={softCodesPagination.currentPage}
                totalPages={softCodesPagination.totalPages}
                totalItems={softCodesPagination.totalItems}
                pageSize={softCodesPagination.pageSize}
                onPageChange={softCodesPagination.goToPage}
              />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!usageDetailCode} onOpenChange={(open) => !open && setUsageDetailCode(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col overflow-hidden sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 shrink-0" />
              Software promo code usage
            </DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <code className="font-mono bg-secondary px-2 py-0.5 rounded text-foreground">
                {usageDetailCode?.code}
              </code>
              {usageDetailCode && (
                <span className="text-muted-foreground">
                  {getSoftwareUsageSummary(usageDetailCode).count}{' '}
                  {getSoftwareUsageSummary(usageDetailCode).count === 1 ? 'use' : 'uses'} total
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 -mx-4 px-4 sm:mx-0 sm:px-0">
            {usageDetailCode &&
              (() => {
                const rows = getSortedSoftwareUsage(usageDetailCode);
                if (rows.length === 0) {
                  return (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      This code has not been used yet.
                    </p>
                  );
                }
                return (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User name</TableHead>
                        <TableHead className="hidden sm:table-cell">Email</TableHead>
                        <TableHead className="hidden md:table-cell">Product</TableHead>
                        <TableHead>Date used</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">
                            {row.user_name?.trim() || '—'}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {row.user_email || '—'}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">{row.product_name}</TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {format(new Date(row.used_at), 'MMM d, yyyy · HH:mm')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                );
              })()}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && deleteMutation.isPending) return;
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete promo code</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-left">
              <span className="block">Are you sure you want to delete this promo code?</span>
              {deleteTarget?.is_used ? (
                <span className="block">This will also revoke software access for the user who redeemed it.</span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Expiration Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Edit Expiration Date
            </DialogTitle>
            <DialogDescription>
              Update the expiration date for code <code className="font-mono bg-secondary px-2 py-0.5 rounded">{editingCode?.code}</code>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="edit-expires">Expiration Date</Label>
            <Input
              id="edit-expires"
              type="date"
              value={editExpiresAt}
              onChange={(e) => setEditExpiresAt(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-muted-foreground">Leave empty for no expiration</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={updateMutation.isPending}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSoftwarePromoCodes;
