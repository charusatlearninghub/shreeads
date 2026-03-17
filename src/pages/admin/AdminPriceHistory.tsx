import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrendingUp, TrendingDown, Minus, History, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePriceHistory } from '@/hooks/usePriceHistory';
import { formatPrice } from '@/lib/price-utils';

interface Course {
  id: string;
  title: string;
}

export default function AdminPriceHistory() {
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  
  const { data: courses } = useQuery({
    queryKey: ['courses-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .order('title');
      if (error) throw error;
      return data as Course[];
    },
  });
  
  const { data: priceHistory, isLoading } = usePriceHistory(
    selectedCourse !== 'all' ? selectedCourse : undefined
  );
  
  const { data: profiles } = useQuery({
    queryKey: ['profiles-for-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email');
      if (error) throw error;
      return data;
    },
  });
  
  const getProfileName = (userId: string | null) => {
    if (!userId) return 'System';
    const profile = profiles?.find(p => p.id === userId);
    return profile?.full_name || profile?.email || 'Unknown';
  };
  
  const getCourseName = (courseId: string) => {
    const course = courses?.find(c => c.id === courseId);
    return course?.title || 'Unknown Course';
  };
  
  const getPriceChange = (oldPrice: number | null, newPrice: number | null) => {
    if (oldPrice === null && newPrice !== null) return { type: 'new', icon: TrendingUp, color: 'text-green-500' };
    if (oldPrice !== null && newPrice === null) return { type: 'removed', icon: Minus, color: 'text-gray-500' };
    if ((oldPrice || 0) < (newPrice || 0)) return { type: 'increase', icon: TrendingUp, color: 'text-red-500' };
    if ((oldPrice || 0) > (newPrice || 0)) return { type: 'decrease', icon: TrendingDown, color: 'text-green-500' };
    return { type: 'same', icon: Minus, color: 'text-gray-500' };
  };
  
  return (
    <AdminLayout
      title="Price History"
      subtitle="Track all course price changes over time"
    >
      {/* Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses?.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {priceHistory?.length || 0} price change(s) found
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Price Change History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : priceHistory && priceHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Price Change</TableHead>
                    <TableHead className="hidden md:table-cell">Discount Price</TableHead>
                    <TableHead className="hidden lg:table-cell">Free Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Changed By</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priceHistory.map((entry) => {
                    const priceChange = getPriceChange(entry.old_price, entry.new_price);
                    const PriceIcon = priceChange.icon;
                    
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          {getCourseName(entry.course_id)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              {entry.old_price !== null ? formatPrice(entry.old_price) : '-'}
                            </span>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            <span className={priceChange.color}>
                              {entry.new_price !== null ? formatPrice(entry.new_price) : '-'}
                            </span>
                            <PriceIcon className={`w-4 h-4 ${priceChange.color}`} />
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              {entry.old_discount_price !== null ? formatPrice(entry.old_discount_price) : '-'}
                            </span>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            <span>
                              {entry.new_discount_price !== null ? formatPrice(entry.new_discount_price) : '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {entry.old_is_free !== entry.new_is_free ? (
                            <div className="flex items-center gap-2">
                              <Badge variant={entry.old_is_free ? 'secondary' : 'outline'}>
                                {entry.old_is_free ? 'Free' : 'Paid'}
                              </Badge>
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                              <Badge variant={entry.new_is_free ? 'secondary' : 'outline'}>
                                {entry.new_is_free ? 'Free' : 'Paid'}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No change</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {getProfileName(entry.changed_by)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {format(parseISO(entry.changed_at), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <History className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-2">No price history yet</h3>
              <p className="text-muted-foreground text-sm">
                Price changes will be tracked automatically when you update course prices.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
