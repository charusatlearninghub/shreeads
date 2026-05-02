import { useState, useEffect } from 'react';
import { MobileDataCard, MobileCardList } from '@/components/admin/MobileDataCard';
import { motion } from 'framer-motion';
import { 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  MoreVertical,
  Users,
  Shield,
  Ban,
  CheckCircle,
  Smartphone,
  Mail,
  Calendar,
  RefreshCw,
  UserX,
  UserCheck
} from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import { TablePagination } from '@/components/admin/TablePagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  role: 'admin' | 'student';
  enrollments_count: number;
  is_blocked?: boolean;
}

interface DeviceRegistration {
  id: string;
  device_fingerprint: string;
  device_name: string | null;
  is_active: boolean;
  registered_at: string;
  last_used_at: string;
}

const AdminUsers = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [activeDeviceCount, setActiveDeviceCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showDevicesDialog, setShowDevicesDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDevices, setUserDevices] = useState<DeviceRegistration[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/admin-delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token ?? ''}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ user_id: deleteTarget.id }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to delete user');

      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
      toast({ title: 'User deleted', description: `${deleteTarget.full_name || deleteTarget.email} has been removed.` });
      setDeleteTarget(null);
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Get profiles and active device count in parallel
      const [profilesRes, devicesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('device_registrations').select('id', { count: 'exact' }).eq('is_active', true),
      ]);

      if (profilesRes.error) throw profilesRes.error;

      setActiveDeviceCount(devicesRes.count || 0);

      // Get roles for each user
      const usersWithRoles = await Promise.all(
        (profilesRes.data || []).map(async (profile) => {
          const [roleRes, enrollmentsRes] = await Promise.all([
            supabase.from('user_roles').select('role').eq('user_id', profile.id).maybeSingle(),
            supabase.from('enrollments').select('id', { count: 'exact' }).eq('user_id', profile.id),
          ]);

          return {
            ...profile,
            role: (roleRes.data?.role || 'student') as 'admin' | 'student',
            enrollments_count: enrollmentsRes.count || 0,
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ title: 'Error', description: 'Failed to fetch users', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'student') => {
    try {
      // Delete existing role
      await supabase.from('user_roles').delete().eq('user_id', userId);
      
      // Insert new role
      const { error } = await supabase.from('user_roles').insert({
        user_id: userId,
        role: newRole,
      });

      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast({ title: 'Success', description: 'User role updated' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleResetDevice = async (userId: string) => {
    try {
      const response = await supabase.functions.invoke('admin-device-management', {
        body: { action: 'reset_device', userId },
      });

      if (response.error) throw new Error(response.error.message);
      
      toast({ title: 'Success', description: 'Device binding reset successfully' });
      
      if (selectedUser?.id === userId) {
        fetchUserDevices(userId);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const fetchUserDevices = async (userId: string) => {
    setIsLoadingDevices(true);
    try {
      const response = await supabase.functions.invoke('admin-device-management', {
        body: { action: 'get_user_devices', userId },
      });

      if (response.error) throw new Error(response.error.message);
      setUserDevices(response.data.devices || []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoadingDevices(false);
    }
  };

  const openDevicesDialog = (user: User) => {
    setSelectedUser(user);
    setShowDevicesDialog(true);
    fetchUserDevices(user.id);
  };

  const handleDeactivateDevice = async (deviceId: string) => {
    try {
      const response = await supabase.functions.invoke('admin-device-management', {
        body: { action: 'deactivate_device', deviceId },
      });

      if (response.error) throw new Error(response.error.message);
      
      setUserDevices(devices => 
        devices.map(d => d.id === deviceId ? { ...d, is_active: false } : d)
      );
      toast({ title: 'Success', description: 'Device deactivated' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const usersPagination = usePagination(filteredUsers, { pageSize: 10 });
  const paginatedUsers = usersPagination.paginatedItems;

  return (
    <AdminLayout 
      title="Users" 
      subtitle="Manage students and administrators"
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="student">Students</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'student').length}</p>
                <p className="text-xs text-muted-foreground">Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
                <p className="text-xs text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeDeviceCount}</p>
                <p className="text-xs text-muted-foreground">Active Devices</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
            {/* Mobile Card View */}
            <MobileCardList>
              {paginatedUsers.map((user) => (
                <MobileDataCard
                  key={user.id}
                  fields={[
                    { label: 'Name', value: <span className="font-medium">{user.full_name || 'No name'}</span> },
                    { label: 'Email', value: <span className="text-xs">{user.email}</span> },
                    { label: 'Phone', value: user.phone || '—' },
                    { label: 'Role', value: <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role === 'admin' ? 'Admin' : 'Student'}</Badge> },
                    { label: 'Courses', value: user.enrollments_count },
                    { label: 'Joined', value: format(new Date(user.created_at), 'MMM d, yyyy') },
                  ]}
                  actions={
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openDevicesDialog(user)}><Smartphone className="w-4 h-4 mr-2" /> View Devices</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResetDevice(user.id)}><RefreshCw className="w-4 h-4 mr-2" /> Reset Device</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.role === 'student' ? (
                          <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'admin')}><Shield className="w-4 h-4 mr-2" /> Make Admin</DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'student')}><UserX className="w-4 h-4 mr-2" /> Remove Admin</DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(user)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  }
                />
              ))}
            </MobileCardList>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Courses</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center font-semibold text-primary text-sm">
                            {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{user.full_name || 'No name'}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.phone ? <span className="text-sm">{user.phone}</span> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? <><Shield className="w-3 h-3 mr-1" /> Admin</> : 'Student'}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.enrollments_count}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{format(new Date(user.created_at), 'MMM d, yyyy')}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(user.created_at), 'h:mm a')}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openDevicesDialog(user)}><Smartphone className="w-4 h-4 mr-2" /> View Devices</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetDevice(user.id)}><RefreshCw className="w-4 h-4 mr-2" /> Reset Device</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.role === 'student' ? (
                              <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'admin')}><Shield className="w-4 h-4 mr-2" /> Make Admin</DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'student')}><UserX className="w-4 h-4 mr-2" /> Remove Admin</DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(user)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <TablePagination
              currentPage={usersPagination.currentPage}
              totalPages={usersPagination.totalPages}
              totalItems={usersPagination.totalItems}
              pageSize={usersPagination.pageSize}
              onPageChange={usersPagination.goToPage}
            />
            </>
          )}
        </CardContent>
      </Card>

      {/* Devices Dialog */}
      <Dialog open={showDevicesDialog} onOpenChange={setShowDevicesDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>User Devices</DialogTitle>
            <DialogDescription>
              {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {isLoadingDevices ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : userDevices.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No devices registered
              </div>
            ) : (
              <div className="space-y-3">
                {userDevices.map((device) => (
                  <div 
                    key={device.id}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <Smartphone className={`w-5 h-5 ${device.is_active ? 'text-green-500' : 'text-muted-foreground'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{device.device_name || 'Unknown Device'}</p>
                      <p className="text-xs text-muted-foreground">
                        Last used: {format(new Date(device.last_used_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={device.is_active ? 'success' : 'secondary'}>
                        {device.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {device.is_active && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeactivateDevice(device.id)}
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => selectedUser && handleResetDevice(selectedUser.id)}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset All Devices
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminUsers;
