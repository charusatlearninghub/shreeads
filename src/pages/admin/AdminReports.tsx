import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Download, 
  Calendar,
  Users,
  BookOpen,
  Ticket,
  TrendingUp,
  Loader2
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ReportData {
  users: {
    id: string;
    email: string;
    full_name: string | null;
    created_at: string;
    enrollments_count: number;
  }[];
  courses: {
    id: string;
    title: string;
    is_published: boolean;
    enrollments_count: number;
    lessons_count: number;
  }[];
  promoCodes: {
    code: string;
    course_title: string;
    is_used: boolean;
    used_at: string | null;
    expires_at: string | null;
  }[];
}

const AdminReports = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<'users' | 'courses' | 'promo-codes'>('users');
  const [data, setData] = useState<ReportData>({
    users: [],
    courses: [],
    promoCodes: [],
  });

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      // Fetch users with enrollment counts
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false });

      const usersWithEnrollments = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { count } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id);
          return { ...profile, enrollments_count: count || 0 };
        })
      );

      // Fetch courses with stats
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title, is_published')
        .order('created_at', { ascending: false });

      const coursesWithStats = await Promise.all(
        (courses || []).map(async (course) => {
          const { count: enrollments } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);
          const { count: lessons } = await supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);
          return {
            ...course,
            enrollments_count: enrollments || 0,
            lessons_count: lessons || 0,
          };
        })
      );

      // Fetch promo codes with course titles
      const { data: promoCodes } = await supabase
        .from('promo_codes')
        .select(`
          code,
          is_used,
          used_at,
          expires_at,
          courses (title)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      const formattedPromoCodes = (promoCodes || []).map((pc: any) => ({
        code: pc.code,
        course_title: pc.courses?.title || 'Unknown',
        is_used: pc.is_used,
        used_at: pc.used_at,
        expires_at: pc.expires_at,
      }));

      setData({
        users: usersWithEnrollments,
        courses: coursesWithStats,
        promoCodes: formattedPromoCodes,
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = (type: 'users' | 'courses' | 'promo-codes') => {
    let csvContent = '';
    let filename = '';

    if (type === 'users') {
      csvContent = 'Email,Full Name,Created At,Enrollments\n';
      data.users.forEach(user => {
        csvContent += `"${user.email}","${user.full_name || ''}","${format(new Date(user.created_at), 'yyyy-MM-dd')}",${user.enrollments_count}\n`;
      });
      filename = 'users-report.csv';
    } else if (type === 'courses') {
      csvContent = 'Title,Published,Enrollments,Lessons\n';
      data.courses.forEach(course => {
        csvContent += `"${course.title}",${course.is_published ? 'Yes' : 'No'},${course.enrollments_count},${course.lessons_count}\n`;
      });
      filename = 'courses-report.csv';
    } else {
      csvContent = 'Code,Course,Status,Used At,Expires At\n';
      data.promoCodes.forEach(pc => {
        csvContent += `"${pc.code}","${pc.course_title}",${pc.is_used ? 'Used' : 'Available'},"${pc.used_at ? format(new Date(pc.used_at), 'yyyy-MM-dd') : ''}","${pc.expires_at ? format(new Date(pc.expires_at), 'yyyy-MM-dd') : 'Never'}"\n`;
      });
      filename = 'promo-codes-report.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    toast({
      title: "Report Exported",
      description: `${filename} has been downloaded`,
    });
  };

  const reports = [
    { id: 'users' as const, icon: Users, label: 'Users Report', count: data.users.length },
    { id: 'courses' as const, icon: BookOpen, label: 'Courses Report', count: data.courses.length },
    { id: 'promo-codes' as const, icon: Ticket, label: 'Promo Codes Report', count: data.promoCodes.length },
  ];

  if (isLoading) {
    return (
      <AdminLayout title="Reports" subtitle="Generate and export platform reports">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Reports" subtitle="Generate and export platform reports">
      {/* Report Type Cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {reports.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={`cursor-pointer transition-all hover:shadow-lg ${activeReport === report.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setActiveReport(report.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <report.icon className="w-6 h-6 text-primary" />
                  </div>
                  <Badge variant="secondary">{report.count} records</Badge>
                </div>
                <h3 className="font-semibold">{report.label}</h3>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Report Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {reports.find(r => r.id === activeReport)?.label}
              </CardTitle>
              <CardDescription>
                View and export {activeReport.replace('-', ' ')} data
              </CardDescription>
            </div>
            <Button onClick={() => exportToCSV(activeReport)}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              {activeReport === 'users' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Enrollments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>{user.full_name || '-'}</TableCell>
                          <TableCell>{format(new Date(user.created_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell className="text-right">{user.enrollments_count}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              {activeReport === 'courses' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Lessons</TableHead>
                      <TableHead className="text-right">Enrollments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.courses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No courses found
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.courses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">{course.title}</TableCell>
                          <TableCell>
                            <Badge variant={course.is_published ? "default" : "secondary"}>
                              {course.is_published ? 'Published' : 'Draft'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{course.lessons_count}</TableCell>
                          <TableCell className="text-right">{course.enrollments_count}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}

              {activeReport === 'promo-codes' && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Used At</TableHead>
                      <TableHead>Expires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.promoCodes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No promo codes found
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.promoCodes.map((pc, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono font-medium">{pc.code}</TableCell>
                          <TableCell>{pc.course_title}</TableCell>
                          <TableCell>
                            <Badge variant={pc.is_used ? "secondary" : "default"}>
                              {pc.is_used ? 'Used' : 'Available'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {pc.used_at ? format(new Date(pc.used_at), 'MMM d, yyyy') : '-'}
                          </TableCell>
                          <TableCell>
                            {pc.expires_at ? format(new Date(pc.expires_at), 'MMM d, yyyy') : 'Never'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminReports;
