import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  BookOpen, 
  Ticket, 
  TrendingUp,
  Calendar,
  BarChart3,
  Loader2
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface AnalyticsData {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalPromoCodes: number;
  usedPromoCodes: number;
  enrollmentsByMonth: { month: string; enrollments: number }[];
  courseEnrollments: { name: string; enrollments: number }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const AdminAnalytics = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [data, setData] = useState<AnalyticsData>({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalPromoCodes: 0,
    usedPromoCodes: 0,
    enrollmentsByMonth: [],
    courseEnrollments: [],
  });

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      // Fetch total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch total courses
      const { count: coursesCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });

      // Fetch total enrollments
      const { count: enrollmentsCount } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true });

      // Fetch promo codes stats
      const { count: totalPromos } = await supabase
        .from('promo_codes')
        .select('*', { count: 'exact', head: true });

      const { count: usedPromos } = await supabase
        .from('promo_codes')
        .select('*', { count: 'exact', head: true })
        .eq('is_used', true);

      // Fetch enrollments with dates for chart
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('enrolled_at')
        .order('enrolled_at', { ascending: true });

      // Group enrollments by month
      const enrollmentsByMonth = new Map<string, number>();
      enrollments?.forEach(e => {
        const date = new Date(e.enrolled_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        enrollmentsByMonth.set(monthKey, (enrollmentsByMonth.get(monthKey) || 0) + 1);
      });

      const monthlyData = Array.from(enrollmentsByMonth.entries()).map(([month, count]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        enrollments: count,
      }));

      // Fetch course enrollment stats
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title');

      const courseStats = await Promise.all(
        (courses || []).map(async (course) => {
          const { count } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);
          return { name: course.title, enrollments: count || 0 };
        })
      );

      setData({
        totalUsers: usersCount || 0,
        totalCourses: coursesCount || 0,
        totalEnrollments: enrollmentsCount || 0,
        totalPromoCodes: totalPromos || 0,
        usedPromoCodes: usedPromos || 0,
        enrollmentsByMonth: monthlyData,
        courseEnrollments: courseStats.filter(c => c.enrollments > 0),
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = [
    { icon: Users, label: "Total Users", value: data.totalUsers, color: "text-blue-500" },
    { icon: BookOpen, label: "Total Courses", value: data.totalCourses, color: "text-green-500" },
    { icon: TrendingUp, label: "Total Enrollments", value: data.totalEnrollments, color: "text-purple-500" },
    { icon: Ticket, label: "Promo Codes Used", value: `${data.usedPromoCodes}/${data.totalPromoCodes}`, color: "text-orange-500" },
  ];

  if (isLoading) {
    return (
      <AdminLayout title="Analytics" subtitle="Platform performance insights">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Analytics" 
      subtitle="Platform performance insights"
      actions={
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[140px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-secondary flex items-center justify-center mb-3 sm:mb-4`}>
                  <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                </div>
                <h3 className="font-display text-2xl font-bold">{stat.value}</h3>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Enrollments Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Enrollments Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.enrollmentsByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.enrollmentsByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="enrollments" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No enrollment data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Course Enrollments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Enrollments by Course
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.courseEnrollments.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.courseEnrollments} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      width={100}
                      tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="enrollments" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No course enrollment data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
