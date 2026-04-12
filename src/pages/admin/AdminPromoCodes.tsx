import { useState, useEffect } from 'react';
import { MobileDataCard, MobileCardList } from '@/components/admin/MobileDataCard';
import { usePagination } from '@/hooks/usePagination';
import { TablePagination } from '@/components/admin/TablePagination';
import { motion } from 'framer-motion';
import { 
  Search, 
  Plus,
  Ticket,
  Copy,
  Download,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Pencil,
  Trash2,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface PromoCodeUsageRow {
  id: string;
  user_id?: string;
  user_name: string | null;
  user_email: string | null;
  course_name: string;
  used_at: string;
  paid_amount?: number | string | null;
  final_price_paid?: number | string | null;
  promo_price?: number | string | null;
  original_price_at_purchase?: number | string | null;
}

interface PromoCode {
  id: string;
  code: string;
  course_id: string;
  promo_price?: number | null;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  expires_at: string | null;
  created_at: string;
  courses?: {
    title: string;
  };
  promo_code_usage?: PromoCodeUsageRow[];
}

interface Course {
  id: string;
  title: string;
  price?: number | null;
  discount_price?: number | null;
  is_free?: boolean | null;
}

function getSortedCourseUsage(code: PromoCode): PromoCodeUsageRow[] {
  const rows = code.promo_code_usage ?? [];
  return [...rows].sort(
    (a, b) => new Date(b.used_at).getTime() - new Date(a.used_at).getTime()
  );
}

function getCourseUsageSummary(code: PromoCode) {
  const rows = getSortedCourseUsage(code);
  const count = rows.length;
  const latest = rows[0];
  return { rows, count, latest };
}

function formatInrCell(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return '—';
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

/** Paid (₹): paid_amount → final_price_paid → usage promo_price → code promo_price. Always show ₹0 instead of —. */
function getPaidDisplayForPromoCode(code: PromoCode): string {
  const rows = getSortedCourseUsage(code);
  // Check usage rows for paid amounts
  for (const r of rows) {
    const v = r.paid_amount ?? r.final_price_paid ?? r.promo_price;
    if (v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v))) {
      return formatInrCell(Number(v));
    }
  }
  // Fall back to promo_price on the code itself (always set at generation time)
  if (code.promo_price != null && Number.isFinite(Number(code.promo_price))) {
    return formatInrCell(Number(code.promo_price));
  }
  return '—';
}

type ProfileRow = { id: string; full_name: string | null; email: string | null };

function displayNameFromProfile(p: ProfileRow | undefined): string {
  const n = p?.full_name?.trim();
  if (n) return n;
  const e = p?.email?.trim();
  if (e) return e.split('@')[0] || e;
  return 'User';
}

/** Merge promo_code_usage rows with enrollments + profiles so Used By / Used Date always populate. */
function mergeUsageWithEnrollments(
  codes: PromoCode[],
  usageRows: Array<{
    id: string;
    promo_code_id: string;
    user_id: string;
    user_name: string | null;
    user_email: string | null;
    course_name: string;
    used_at: string;
    paid_amount?: number | string | null;
    final_price_paid?: number | string | null;
    promo_price?: number | string | null;
    original_price_at_purchase?: number | string | null;
  }>,
  enrollments: Array<{
    id: string;
    promo_code_id: string | null;
    user_id: string;
    enrolled_at: string;
    final_price_paid?: number | string | null;
    promo_price?: number | string | null;
    original_price?: number | string | null;
    promo_code?: string | null;
    courses: { title: string } | null;
    promo_codes?: { promo_price: number | string | null } | null;
  }>,
  profilesById: Map<string, ProfileRow>
): PromoCode[] {
  const byPromoId = new Map<string, PromoCodeUsageRow[]>();

  for (const row of usageRows) {
    const prof = profilesById.get(row.user_id);
    const name =
      row.user_name?.trim() ||
      (prof ? displayNameFromProfile(prof) : '') ||
      row.user_email?.split('@')[0] ||
      'User';
    const slice: PromoCodeUsageRow = {
      id: row.id,
      user_id: row.user_id,
      user_name: name,
      user_email: row.user_email || prof?.email || '',
      course_name: row.course_name,
      used_at: row.used_at,
      paid_amount: row.paid_amount ?? null,
      final_price_paid: row.final_price_paid ?? null,
      promo_price: row.promo_price ?? null,
      original_price_at_purchase: row.original_price_at_purchase ?? null,
    };
    const list = byPromoId.get(row.promo_code_id) ?? [];
    list.push(slice);
    byPromoId.set(row.promo_code_id, list);
  }

  for (const e of enrollments) {
    if (!e.promo_code_id) continue;
    const list = byPromoId.get(e.promo_code_id) ?? [];
    const prof = profilesById.get(e.user_id);
    const courseTitle = e.courses?.title ?? 'Course';
    const idx = list.findIndex((r) => r.user_id === e.user_id);
    if (idx >= 0) {
      const cur = list[idx];
      const mergedNames = !cur.user_name?.trim()
        ? {
            user_name: displayNameFromProfile(prof) || cur.user_email?.split('@')[0] || 'User',
            user_email: (cur.user_email || prof?.email || '').trim() || null,
            course_name: cur.course_name || courseTitle,
          }
        : { course_name: cur.course_name || courseTitle };
      const ep = e.final_price_paid;
      const pp = e.promo_price;
      const pcPrice = e.promo_codes?.promo_price;
      list[idx] = {
        ...cur,
        ...mergedNames,
        paid_amount:
          cur.paid_amount ?? ep ?? cur.final_price_paid ?? pp ?? pcPrice ?? null,
        final_price_paid: cur.final_price_paid ?? ep ?? pp ?? pcPrice ?? null,
        promo_price: cur.promo_price ?? pp ?? pcPrice ?? null,
        original_price_at_purchase: cur.original_price_at_purchase ?? e.original_price ?? null,
      };
    } else {
      const ep = e.final_price_paid;
      const pp = e.promo_price;
      const pcPrice = e.promo_codes?.promo_price;
      list.push({
        id: `enrollment-${e.id}`,
        user_id: e.user_id,
        user_name: displayNameFromProfile(prof),
        user_email: prof?.email ?? '',
        course_name: courseTitle,
        used_at: e.enrolled_at,
        paid_amount: ep ?? pp ?? pcPrice ?? null,
        final_price_paid: ep ?? pp ?? pcPrice ?? null,
        promo_price: pp ?? pcPrice ?? null,
        original_price_at_purchase: e.original_price ?? null,
      });
    }
    byPromoId.set(e.promo_code_id, list);
  }

  for (const [, list] of byPromoId) {
    list.sort((a, b) => new Date(b.used_at).getTime() - new Date(a.used_at).getTime());
  }

  return codes.map((c) => {
    let usage = byPromoId.get(c.id) ?? [];
    if (c.is_used && c.used_by && usage.length === 0) {
      const prof = profilesById.get(c.used_by);
      const legacyPaid =
        c.promo_price != null && Number.isFinite(Number(c.promo_price))
          ? Number(c.promo_price)
          : null;
      usage = [
        {
          id: `legacy-${c.id}`,
          user_id: c.used_by,
          user_name: displayNameFromProfile(prof),
          user_email: prof?.email ?? '',
          course_name: c.courses?.title ?? 'Course',
          used_at: c.used_at ?? c.created_at,
          paid_amount: legacyPaid,
          final_price_paid: legacyPaid,
          promo_price: legacyPaid,
        },
      ];
    }
    return { ...c, promo_code_usage: usage };
  });
}

const AdminPromoCodes = () => {
  const { toast } = useToast();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [codeToDelete, setCodeToDelete] = useState<PromoCode | null>(null);
  const [usageDetailCode, setUsageDetailCode] = useState<PromoCode | null>(null);

  const [generateForm, setGenerateForm] = useState({
    courseId: '',
    quantity: 1,
    prefix: '',
    expiresAt: '',
    promoPrice: '',
  });

  useEffect(() => {
    fetchPromoCodes();
    fetchCourses();
  }, []);

  const fetchPromoCodes = async () => {
    setIsLoading(true);
    try {
      // Load codes without embedding usage: nested selects fail if the usage table or FK
      // is missing (migration not applied) or PostgREST cannot resolve the relationship.
      const { data: codes, error } = await supabase
        .from('promo_codes')
        .select(`
          *,
          courses (title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      let merged: PromoCode[] = (codes || []) as PromoCode[];

      const ids = merged.map((c) => c.id);
      if (ids.length > 0) {
        const { data: usageRows, error: usageError } = await (supabase as any)
          .from('promo_code_usage')
          .select(
            'id, promo_code_id, user_id, user_name, user_email, course_name, used_at, paid_amount, final_price_paid, promo_price, original_price_at_purchase'
          )
          .in('promo_code_id', ids);

        const { data: enrollRows, error: enrollError } = await (supabase as any)
          .from('enrollments')
          .select(
            'id, promo_code_id, user_id, enrolled_at, final_price_paid, promo_price, original_price, promo_code, payment_type, courses(title), promo_codes(promo_price)'
          )
          .in('promo_code_id', ids)
          .not('promo_code_id', 'is', null);

        if (usageError) {
          console.warn('promo_code_usage fetch skipped:', usageError.message);
        }
        if (enrollError) {
          console.warn('enrollments (promo) fetch skipped:', enrollError.message);
        }

        const uRows = usageError ? [] : usageRows ?? [];
        const eRows = enrollError ? [] : enrollRows ?? [];

        const userIdSet = new Set<string>();
        for (const r of uRows) userIdSet.add(r.user_id);
        for (const r of eRows) userIdSet.add(r.user_id);
        for (const c of merged) {
          if (c.used_by) userIdSet.add(c.used_by);
        }

        let profilesById = new Map<string, ProfileRow>();
        if (userIdSet.size > 0) {
          const { data: profs } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', [...userIdSet]);
          profilesById = new Map((profs ?? []).map((p) => [p.id, p]));
        }

        merged = mergeUsageWithEnrollments(merged, uRows, eRows, profilesById);
      }

      setPromoCodes(merged);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      toast({ title: 'Error', description: 'Failed to fetch promo codes', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, price, discount_price, is_free')
        .order('title');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleGenerateCodes = async () => {
    if (!generateForm.courseId) {
      toast({ title: 'Error', description: 'Please select a course', variant: 'destructive' });
      return;
    }

    const selected = courses.find((c) => c.id === generateForm.courseId);
    const listPrice = selected
      ? Number(selected.discount_price ?? selected.price ?? 0) || 0
      : 0;
    const promoAmt = Math.max(0, Number(generateForm.promoPrice) || 0);
    if (listPrice > 0 && promoAmt <= 0) {
      toast({
        title: 'Error',
        description:
          'For paid courses, enter a "Price paid on redeem" greater than 0. Codes with ₹0 cannot be redeemed on paid courses.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke('generate-promo-codes', {
        body: {
          courseId: generateForm.courseId,
          quantity: generateForm.quantity,
          prefix: generateForm.prefix || undefined,
          expiresAt: generateForm.expiresAt || undefined,
          promoPrice: Math.max(0, Number(generateForm.promoPrice) || 0),
        },
      });

      if (response.error) throw new Error(response.error.message);

      const newCodes = response.data.codes.map((c: any) => c.code);
      setGeneratedCodes(newCodes);
      setShowGenerateDialog(false);
      setShowResultsDialog(true);
      fetchPromoCodes();
      
      toast({ 
        title: 'Success', 
        description: `Generated ${newCodes.length} promo code(s)` 
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copied!', description: 'Code copied to clipboard' });
  };

  const handleCopyAllCodes = () => {
    navigator.clipboard.writeText(generatedCodes.join('\n'));
    toast({ title: 'Copied!', description: 'All codes copied to clipboard' });
  };

  const handleExportCodes = () => {
    const csv = 'Code\n' + generatedCodes.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promo-codes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleEditCode = (code: PromoCode) => {
    setEditingCode(code);
    setEditExpiresAt(code.expires_at ? code.expires_at.split('T')[0] : '');
    setShowEditDialog(true);
  };

  const handleUpdateExpiration = async () => {
    if (!editingCode) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ 
          expires_at: editExpiresAt ? new Date(editExpiresAt).toISOString() : null 
        })
        .eq('id', editingCode.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Expiration date updated' });
      setShowEditDialog(false);
      setEditingCode(null);
      fetchPromoCodes();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const openDeleteDialog = (code: PromoCode) => {
    setCodeToDelete(code);
    setShowDeleteDialog(true);
  };

  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (!open && isDeleting) return;
    setShowDeleteDialog(open);
    if (!open) setCodeToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!codeToDelete) return;

    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-promo-code', {
        body: { codeId: codeToDelete.id, type: 'course' },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast({ title: 'Success', description: data?.message || 'Promo code deleted' });
      setShowDeleteDialog(false);
      setCodeToDelete(null);
      fetchPromoCodes();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const getCodeStatus = (code: PromoCode) => {
    if (code.is_used) return 'used';
    if (code.expires_at && new Date(code.expires_at) < new Date()) return 'expired';
    return 'active';
  };

  const filteredCodes = promoCodes.filter(code => {
    const matchesSearch = code.code.toLowerCase().includes(searchQuery.toLowerCase());
    const status = getCodeStatus(code);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const codesPagination = usePagination(filteredCodes, { pageSize: 10 });
  const paginatedCodes = codesPagination.paginatedItems;

  const stats = {
    total: promoCodes.length,
    active: promoCodes.filter(c => getCodeStatus(c) === 'active').length,
    used: promoCodes.filter(c => c.is_used).length,
    expired: promoCodes.filter(c => getCodeStatus(c) === 'expired').length,
  };

  return (
    <AdminLayout 
      title="Promo Codes" 
      subtitle="Generate and manage promo codes"
      actions={
        <Button 
          variant="hero" 
          size="sm"
          onClick={() => {
            setGenerateForm({ courseId: '', quantity: 1, prefix: '', expiresAt: '', promoPrice: '' });
            setShowGenerateDialog(true);
          }}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline ml-2">Generate Codes</span>
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Codes</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="text-2xl font-bold text-green-500">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Used</p>
            <p className="text-2xl font-bold text-blue-500">{stats.used}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Expired</p>
            <p className="text-2xl font-bold text-red-500">{stats.expired}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search codes..."
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="used">Used</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Codes Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredCodes.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-bold text-lg mb-2">No Promo Codes</h3>
              <p className="text-muted-foreground mb-4">Generate your first promo codes</p>
              <Button onClick={() => setShowGenerateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Generate Codes
              </Button>
            </div>
          ) : (
            <>
            {/* Mobile Card View */}
            <MobileCardList>
              {paginatedCodes.map((code) => {
                const status = getCodeStatus(code);
                const { count: usageCount, latest } = getCourseUsageSummary(code);
                const usedByDisplay = usageCount === 0 ? '—' : usageCount === 1 ? latest?.user_name?.trim() || latest?.user_email || '—' : `${latest?.user_name?.trim() || latest?.user_email || 'User'} · +${usageCount - 1}`;
                return (
                  <MobileDataCard
                    key={code.id}
                    fields={[
                      { label: 'Code', value: <code className="font-mono text-sm bg-secondary px-2 py-0.5 rounded">{code.code}</code> },
                      { label: 'Course', value: code.courses?.title || 'Unknown' },
                      { label: 'Status', value: status === 'active' ? <Badge className="bg-green-500/10 text-green-500">Available</Badge> : status === 'used' ? <Badge className="bg-blue-500/10 text-blue-500">Used</Badge> : <Badge variant="destructive">Expired</Badge> },
                      { label: 'Uses', value: usageCount },
                      { label: 'Used By', value: usedByDisplay },
                      { label: 'Used Date', value: latest ? format(new Date(latest.used_at), 'MMM d, yyyy') : '—' },
                      { label: 'Paid (₹)', value: getPaidDisplayForPromoCode(code) },
                      { label: 'Expires', value: code.expires_at ? format(new Date(code.expires_at), 'MMM d, yyyy') : 'Never' },
                    ]}
                    actions={
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditCode(code)} disabled={code.is_used}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopyCode(code.code)}><Copy className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDeleteDialog(code)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
                    <TableHead>Code</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center w-[72px]">Uses</TableHead>
                    <TableHead className="min-w-[120px]">Used By</TableHead>
                    <TableHead>Used Date</TableHead>
                    <TableHead className="text-right">Paid (₹)</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCodes.map((code) => {
                    const status = getCodeStatus(code);
                    const { count: usageCount, latest } = getCourseUsageSummary(code);
                    const usedByDisplay = usageCount === 0 ? '—' : usageCount === 1 ? latest?.user_name?.trim() || latest?.user_email || '—' : `${latest?.user_name?.trim() || latest?.user_email || 'User'} · +${usageCount - 1}`;
                    return (
                      <TableRow key={code.id}>
                        <TableCell>
                          <button type="button" className="font-mono text-sm bg-secondary px-2 py-1 rounded text-left hover:bg-muted transition-colors max-w-[140px] truncate" title="View usage details" onClick={() => setUsageDetailCode(code)}>{code.code}</button>
                        </TableCell>
                        <TableCell><span className="text-sm truncate max-w-[200px] block">{code.courses?.title || 'Unknown'}</span></TableCell>
                        <TableCell>
                          {status === 'active' ? <Badge className="bg-green-500/10 text-green-500">Available</Badge> : status === 'used' ? <Badge className="bg-blue-500/10 text-blue-500">Used</Badge> : <Badge variant="destructive">Expired</Badge>}
                        </TableCell>
                        <TableCell className="text-center tabular-nums">{usageCount}</TableCell>
                        <TableCell className="text-sm max-w-[160px] truncate" title={usedByDisplay}>{usedByDisplay}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{latest ? format(new Date(latest.used_at), 'MMM d, yyyy') : '—'}</TableCell>
                        <TableCell className="text-right tabular-nums text-sm">{getPaidDisplayForPromoCode(code)}</TableCell>
                        <TableCell>{code.expires_at ? format(new Date(code.expires_at), 'MMM d, yyyy') : <span className="text-muted-foreground">Never</span>}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditCode(code)} disabled={code.is_used} title="Edit expiration"><Pencil className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopyCode(code.code)} title="Copy code"><Copy className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDeleteDialog(code)} disabled={isDeleting} title="Delete code"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <TablePagination
              currentPage={codesPagination.currentPage}
              totalPages={codesPagination.totalPages}
              totalItems={codesPagination.totalItems}
              pageSize={codesPagination.pageSize}
              onPageChange={codesPagination.goToPage}
            />
            </>
          )}
        </CardContent>
      </Card>

      {/* Generate Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Promo Codes</DialogTitle>
            <DialogDescription>
              Create one-time-use promo codes for course enrollment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="course">Course *</Label>
              <Select
                value={generateForm.courseId}
                onValueChange={(value) => setGenerateForm({ ...generateForm, courseId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  max={100}
                  value={generateForm.quantity}
                  onChange={(e) => setGenerateForm({ ...generateForm, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prefix">Prefix (optional)</Label>
                <Input
                  id="prefix"
                  value={generateForm.prefix}
                  onChange={(e) => setGenerateForm({ ...generateForm, prefix: e.target.value.toUpperCase() })}
                  placeholder="e.g., SALE"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="promo-price">Price paid on redeem (₹) *</Label>
              <Input
                id="promo-price"
                type="number"
                min={0}
                step={1}
                placeholder="e.g. 1000"
                value={generateForm.promoPrice}
                onChange={(e) => setGenerateForm({ ...generateForm, promoPrice: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Revenue is recorded as this amount when a student uses the code.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires">Expiration Date (optional)</Label>
              <Input
                id="expires"
                type="date"
                value={generateForm.expiresAt}
                onChange={(e) => setGenerateForm({ ...generateForm, expiresAt: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateCodes} disabled={isGenerating || !generateForm.courseId}>
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                `Generate ${generateForm.quantity} Code${generateForm.quantity > 1 ? 's' : ''}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generated Codes</DialogTitle>
            <DialogDescription>
              {generatedCodes.length} code(s) generated successfully
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-secondary rounded-lg p-4 max-h-60 overflow-y-auto">
              <div className="space-y-2">
                {generatedCodes.map((code, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <code className="font-mono text-sm">{code}</code>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleCopyCode(code)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleCopyAllCodes} className="w-full sm:w-auto">
              <Copy className="w-4 h-4 mr-2" />
              Copy All
            </Button>
            <Button variant="outline" onClick={handleExportCodes} className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => setShowResultsDialog(false)} className="w-full sm:w-auto">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={handleDeleteDialogOpenChange}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promo Code</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-left">
              <span className="block">
                Are you sure you want to delete this promo code?
              </span>
              <span className="block">
                This action will also remove the student&apos;s enrollment, progress, and certificates for this course.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
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

      <Dialog open={!!usageDetailCode} onOpenChange={(open) => !open && setUsageDetailCode(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col overflow-hidden sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 shrink-0" />
              Promo code usage
            </DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <code className="font-mono bg-secondary px-2 py-0.5 rounded text-foreground">
                {usageDetailCode?.code}
              </code>
              {usageDetailCode && (
                <span className="text-muted-foreground">
                  {getCourseUsageSummary(usageDetailCode).count}{' '}
                  {getCourseUsageSummary(usageDetailCode).count === 1 ? 'use' : 'uses'} total
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 -mx-4 px-4 sm:mx-0 sm:px-0">
            {usageDetailCode &&
              (() => {
                const rows = getSortedCourseUsage(usageDetailCode);
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
                        <TableHead className="hidden md:table-cell">Course</TableHead>
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
                          <TableCell className="hidden md:table-cell text-sm">{row.course_name}</TableCell>
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
          
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-expires">Expiration Date</Label>
              <Input
                id="edit-expires"
                type="date"
                value={editExpiresAt}
                onChange={(e) => setEditExpiresAt(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for no expiration
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleUpdateExpiration} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPromoCodes;
