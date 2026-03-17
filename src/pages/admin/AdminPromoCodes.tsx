import { useState, useEffect } from 'react';
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
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface PromoCode {
  id: string;
  code: string;
  course_id: string;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  expires_at: string | null;
  created_at: string;
  courses?: {
    title: string;
  };
}

interface Course {
  id: string;
  title: string;
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

  const [generateForm, setGenerateForm] = useState({
    courseId: '',
    quantity: 1,
    prefix: '',
    expiresAt: '',
  });

  useEffect(() => {
    fetchPromoCodes();
    fetchCourses();
  }, []);

  const fetchPromoCodes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select(`
          *,
          courses (title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
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
        .select('id, title')
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

    setIsGenerating(true);
    try {
      const response = await supabase.functions.invoke('generate-promo-codes', {
        body: {
          courseId: generateForm.courseId,
          quantity: generateForm.quantity,
          prefix: generateForm.prefix || undefined,
          expiresAt: generateForm.expiresAt || undefined,
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

  const handleDeleteCode = async (code: PromoCode) => {
    if (!confirm(`Delete promo code "${code.code}"? ${code.is_used ? 'This will also remove the student\'s enrollment, progress, and certificates for this course.' : ''}`)) return;
    
    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-promo-code', {
        body: { codeId: code.id, type: 'course' },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast({ title: 'Success', description: data?.message || 'Promo code deleted' });
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
            setGenerateForm({ courseId: '', quantity: 1, prefix: '', expiresAt: '' });
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead className="hidden sm:table-cell">Course</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCodes.map((code) => {
                    const status = getCodeStatus(code);
                    return (
                      <TableRow key={code.id}>
                        <TableCell>
                          <code className="font-mono text-sm bg-secondary px-2 py-1 rounded">
                            {code.code}
                          </code>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="text-sm truncate max-w-[200px] block">
                            {code.courses?.title || 'Unknown'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {status === 'active' ? (
                            <Badge className="bg-green-500/10 text-green-500">Available</Badge>
                          ) : status === 'used' ? (
                            <Badge className="bg-blue-500/10 text-blue-500">Used</Badge>
                          ) : (
                            <Badge variant="destructive">Expired</Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {code.expires_at ? (
                            format(new Date(code.expires_at), 'MMM d, yyyy')
                          ) : (
                            <span className="text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
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
                              onClick={() => handleCopyCode(code.code)}
                              title="Copy code"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleDeleteCode(code)}
                              disabled={isDeleting}
                              title="Delete code"
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
