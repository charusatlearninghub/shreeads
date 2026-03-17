import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users,
  BookOpen,
  Ticket,
  TrendingUp,
  Plus,
  GraduationCap,
  Award,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useRealtimeDashboard } from '@/hooks/useRealtimeDashboard';

interface DashboardStats {
  totalStudents: number;
  activeCourses: number;
  totalEnrollments: number;
  usedPromoCodes: number;
  totalPromoCodes: number;
  totalCertificates: number;
}

interface RecentUser {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  enrollments_count: number;
}

interface RecentCourse {
  id: string;
  title: string;
  is_published: boolean;
  enrollments_count: number;
  created_at: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeCourses: 0,
    totalEnrollments: 0,
    usedPromoCodes: 0,
    totalPromoCodes: 0,
    totalCertificates: 0,
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentCourses, setRecentCourses] = useState<RecentCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setIsRefreshing(!showLoading);

    try {
      const [
        { count: studentsCount },
        { count: coursesCount },
        { count: enrollmentsCount },
        { count: usedCodesCount },
        { count: totalCodesCount },
        { count: certificatesCount },
        { data: profiles },
        { data: courses },
      ] = await Promise.all([
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }),
        supabase.from('promo_codes').select('*', { count: 'exact', head: true }).eq('is_used', true),
        supabase.from('promo_codes').select('*', { count: 'exact', head: true }),
        supabase.from('certificates').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('courses').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      setStats({
        totalStudents: studentsCount || 0,
        activeCourses: coursesCount || 0,
        totalEnrollments: enrollmentsCount || 0,
        usedPromoCodes: usedCodesCount || 0,
        totalPromoCodes: totalCodesCount || 0,
        totalCertificates: certificatesCount || 0,
      });

      if (profiles) {
        const usersWithCounts = await Promise.all(
          profiles.map(async (profile) => {
            const { count } = await supabase
              .from('enrollments')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', profile.id);
            return { ...profile, enrollments_count: count || 0 };
          })
        );
        setRecentUsers(usersWithCounts);
      }

      if (courses) {
        const coursesWithCounts = await Promise.all(
          courses.map(async (course) => {
            const { count } = await supabase
              .from('enrollments')
              .select('*', { count: 'exact', head: true })
              .eq('course_id', course.id);
            return { ...course, enrollments_count: count || 0 };
          })
        );
        setRecentCourses(coursesWithCounts);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({ title: 'Error', description: 'Failed to load dashboard data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useRealtimeDashboard({
    onEnrollmentChange: () => fetchDashboardData(false),
    onUserChange: () => fetchDashboardData(false),
    onCourseChange: () => fetchDashboardData(false),
    onPromoCodeChange: () => fetchDashboardData(false),
    onCertificateChange: () => fetchDashboardData(false),
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const statsCards = [
    { 
      icon: Users, 
      label: 'Total Students', 
      value: stats.totalStudents,
      description: 'Registered learners',
      gradient: 'from-blue-500 to-blue-600',
      link: '/admin/users'
    },
    { 
      icon: BookOpen, 
      label: 'Active Courses', 
      value: stats.activeCourses,
      description: 'Published courses',
      gradient: 'from-emerald-500 to-emerald-600',
      link: '/admin/courses'
    },
    { 
      icon: TrendingUp, 
      label: 'Total Enrollments', 
      value: stats.totalEnrollments,
      description: 'Course enrollments',
      gradient: 'from-purple-500 to-purple-600',
      link: '/admin/enrollments'
    },
    { 
      icon: Award, 
      label: 'Certificates Issued', 
      value: stats.totalCertificates,
      description: 'Completed courses',
      gradient: 'from-amber-500 to-amber-600',
      link: '/admin/certificates'
    },
  ];

  const StatCardSkeleton = () => (
    <Card>
      <CardContent className="p-6">
        <Skeleton className="w-12 h-12 rounded-xl mb-4" />
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>
  );

  const ListItemSkeleton = () => (
    <div className="flex items-center justify-between p-3 rounded-xl">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );

  return (
    <AdminLayout 
      title="Dashboard" 
      subtitle="Welcome back! Here's your platform overview"
      actions={
        <Button onClick={() => navigate('/admin/courses')} className="gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Course</span>
        </Button>
      }
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          statsCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(stat.link)}
              className="cursor-pointer"
            >
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm hover:scale-[1.02]">
                <CardContent className="p-3 sm:p-6">
                  <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-2 sm:mb-4 shadow-lg`}>
                    <stat.icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="font-display text-xl sm:text-3xl font-bold tracking-tight">
                    {stat.value.toLocaleString('en-IN')}
                  </h3>
                  <p className="text-[11px] sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">{stat.label}</p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5 hidden sm:block">{stat.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Promo Code Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-6 sm:mb-8"
      >
        <Card className="border-0 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shrink-0">
                  <Ticket className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-lg">Promo Code Usage</h3>
                  <p className="text-xs text-muted-foreground">Track your promotional campaigns</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xl sm:text-3xl font-bold tracking-tight">
                  {stats.usedPromoCodes} <span className="text-muted-foreground text-sm sm:text-lg font-normal">/ {stats.totalPromoCodes}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalPromoCodes > 0 
                    ? `${Math.round((stats.usedPromoCodes / stats.totalPromoCodes) * 100)}% redemption rate`
                    : 'No promo codes created'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Recent Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 bg-card/50 backdrop-blur-sm h-full">
            <CardHeader className="px-4 sm:px-6 pb-3 sm:pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                  </div>
                  Recent Students
                </CardTitle>
                <Link to="/admin/users" className="text-primary text-xs sm:text-sm font-medium hover:underline flex items-center gap-1 shrink-0">
                  View All
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-3 sm:px-6">
              {isLoading ? (
                <div className="space-y-3">
                  <ListItemSkeleton />
                  <ListItemSkeleton />
                  <ListItemSkeleton />
                </div>
              ) : recentUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No students yet</p>
                  <p className="text-sm">Students will appear here once they register</p>
                </div>
              ) : (
                <div className="space-y-0.5 sm:space-y-1">
                  {recentUsers.map((user, index) => (
                    <motion.div 
                      key={user.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.05 }}
                      className="flex items-center justify-between p-2 sm:p-3 rounded-xl hover:bg-secondary/50 transition-colors group gap-2"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center font-semibold text-primary text-xs sm:text-sm shrink-0">
                          {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-xs sm:text-sm truncate">{user.full_name || 'No name'}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="font-normal text-[10px] sm:text-xs shrink-0 whitespace-nowrap px-1.5 sm:px-2.5">
                        {user.enrollments_count} {user.enrollments_count === 1 ? 'course' : 'courses'}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Courses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-0 bg-card/50 backdrop-blur-sm h-full">
            <CardHeader className="px-4 sm:px-6 pb-3 sm:pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                  </div>
                  Recent Courses
                </CardTitle>
                <Link to="/admin/courses" className="text-primary text-xs sm:text-sm font-medium hover:underline flex items-center gap-1 shrink-0">
                  View All
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-3 sm:px-6">
              {isLoading ? (
                <div className="space-y-3">
                  <ListItemSkeleton />
                  <ListItemSkeleton />
                  <ListItemSkeleton />
                </div>
              ) : recentCourses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No courses yet</p>
                  <p className="text-sm">Create your first course to get started</p>
                </div>
              ) : (
                <div className="space-y-0.5 sm:space-y-1">
                  {recentCourses.map((course, index) => (
                    <motion.div 
                      key={course.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.05 }}
                      className="p-2 sm:p-3 rounded-xl hover:bg-secondary/50 transition-colors group"
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-xs sm:text-sm leading-snug line-clamp-2">{course.title}</p>
                          <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                              {course.enrollments_count} {course.enrollments_count === 1 ? 'student' : 'students'} • {formatDate(course.created_at)}
                            </p>
                            <Badge 
                              variant={course.is_published ? 'default' : 'secondary'}
                              className={`text-[10px] sm:text-xs px-1.5 sm:px-2.5 ${course.is_published ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' : ''}`}
                            >
                              {course.is_published ? 'Published' : 'Draft'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-6 sm:mt-8"
      >
        <Card className="border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button 
                variant="outline" 
                className="h-auto py-3 sm:py-6 flex-col gap-1.5 sm:gap-3 hover:bg-primary/5 hover:border-primary/20 transition-all"
                onClick={() => navigate('/admin/courses')}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <span className="text-[11px] sm:text-sm font-medium text-center leading-tight">Add Course</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-3 sm:py-6 flex-col gap-1.5 sm:gap-3 hover:bg-emerald-500/5 hover:border-emerald-500/20 transition-all"
                onClick={() => navigate('/admin/promo-codes')}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Ticket className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                </div>
                <span className="text-[11px] sm:text-sm font-medium text-center leading-tight">Promo Codes</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-3 sm:py-6 flex-col gap-1.5 sm:gap-3 hover:bg-blue-500/5 hover:border-blue-500/20 transition-all"
                onClick={() => navigate('/admin/users')}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                </div>
                <span className="text-[11px] sm:text-sm font-medium text-center leading-tight">Users</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-3 sm:py-6 flex-col gap-1.5 sm:gap-3 hover:bg-purple-500/5 hover:border-purple-500/20 transition-all"
                onClick={() => navigate('/admin/analytics')}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                </div>
                <span className="text-[11px] sm:text-sm font-medium text-center leading-tight">Analytics</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AdminLayout>
  );
};

export default AdminDashboard;
