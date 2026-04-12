import { useState } from 'react';
import { MobileDataCard, MobileCardList } from '@/components/admin/MobileDataCard';
import { usePagination } from '@/hooks/usePagination';
import { TablePagination } from '@/components/admin/TablePagination';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Search, AlertTriangle, Monitor, Smartphone } from 'lucide-react';
import { format } from 'date-fns';

const incidentTypeColors: Record<string, string> = {
  devtools_open: 'destructive',
  screen_recording: 'destructive',
  screen_sharing: 'destructive',
  screenshot_attempt: 'warning',
  right_click: 'secondary',
  keyboard_shortcut: 'secondary',
  tab_switch: 'outline',
  console_tamper: 'destructive',
  fps_drop: 'warning',
};

const AdminSecurityIncidents = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: incidents, isLoading } = useQuery({
    queryKey: ['security-incidents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_incidents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return data;
    },
  });

  // Get profiles for user names
  const userIds = [...new Set(incidents?.map(i => i.user_id) || [])];
  const { data: profiles } = useQuery({
    queryKey: ['incident-profiles', userIds],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);
      if (error) throw error;
      return data;
    },
    enabled: userIds.length > 0,
  });

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  const incidentTypes = [...new Set(incidents?.map(i => i.incident_type) || [])];

  const filtered = incidents?.filter(incident => {
    const profile = profileMap.get(incident.user_id);
    const matchesSearch = searchQuery === '' ||
      profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.incident_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || incident.incident_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const incidentsPagination = usePagination(filtered, { pageSize: 15 });
  const paginatedIncidents = incidentsPagination.paginatedItems;

  const stats = {
    total: incidents?.length || 0,
    today: incidents?.filter(i => {
      const d = new Date(i.created_at!);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length || 0,
    critical: incidents?.filter(i => 
      ['devtools_open', 'screen_recording', 'screen_sharing', 'console_tamper'].includes(i.incident_type)
    ).length || 0,
  };

  return (
    <AdminLayout title="Security Incidents" subtitle="Monitor suspicious activity and security violations">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Incidents</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.today}</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.critical}</p>
              <p className="text-xs text-muted-foreground">Critical</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by user or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {incidentTypes.map(type => (
              <SelectItem key={type} value={type}>
                {type.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden sm:table-cell">IP Address</TableHead>
                    <TableHead className="hidden md:table-cell">Details</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedIncidents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No security incidents found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedIncidents.map(incident => {
                      const profile = profileMap.get(incident.user_id);
                      const variant = incidentTypeColors[incident.incident_type] || 'secondary';
                      return (
                        <TableRow key={incident.id}>
                          <TableCell>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate max-w-[150px] sm:max-w-none">
                                {profile?.full_name || 'Unknown'}
                              </p>
                              <p className="text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-none">
                                {profile?.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={variant as any} className="text-xs whitespace-nowrap">
                              {incident.incident_type.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                            {incident.ip_address || '—'}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <p className="text-xs text-muted-foreground max-w-[200px] truncate">
                              {incident.details ? JSON.stringify(incident.details) : '—'}
                            </p>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {incident.created_at ? format(new Date(incident.created_at), 'MMM d, HH:mm') : '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            <TablePagination
              currentPage={incidentsPagination.currentPage}
              totalPages={incidentsPagination.totalPages}
              totalItems={incidentsPagination.totalItems}
              pageSize={incidentsPagination.pageSize}
              onPageChange={incidentsPagination.goToPage}
            />
            </>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminSecurityIncidents;
