import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  IndianRupee, 
  TrendingUp, 
  BookOpen,
  Package,
  Calendar,
  Download,
  Loader2
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { formatPrice } from "@/lib/price-utils";

interface RevenueData {
  totalCourseRevenue: number;
  totalSoftwareRevenue: number;
  courseEnrollments: number;
  softwarePurchases: number;
  revenueByDate: { date: string; courses: number; software: number; total: number }[];
  topCourses: { name: string; revenue: number; enrollments: number }[];
  topSoftware: { name: string; revenue: number; purchases: number }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

function promoEnrollmentRevenue(e: {
  final_price_paid?: number | string | null;
  promo_price?: number | string | null;
  promo_codes?: { promo_price?: number | string | null } | null;
}): number {
  const pick = (v: unknown) => {
    if (v === null || v === undefined || v === '') return NaN;
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
  };
  const a = pick(e.final_price_paid);
  if (Number.isFinite(a)) return a;
  const b = pick(e.promo_price);
  if (Number.isFinite(b)) return b;
  const c = pick(e.promo_codes?.promo_price);
  return Number.isFinite(c) ? c : 0;
}

const AdminRevenue = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");
  const [data, setData] = useState<RevenueData>({
    totalCourseRevenue: 0,
    totalSoftwareRevenue: 0,
    courseEnrollments: 0,
    softwarePurchases: 0,
    revenueByDate: [],
    topCourses: [],
    topSoftware: [],
  });

  useEffect(() => {
    fetchRevenueData();
  }, [timeRange]);

  const fetchRevenueData = async () => {
    setIsLoading(true);
    try {
      const days = parseInt(timeRange);
      const startDate = startOfDay(subDays(new Date(), days));

      // Fetch course enrollments with promo codes (to estimate revenue)
      const { data: enrollments } = await (supabase as any)
        .from('enrollments')
        .select(`
          id,
          enrolled_at,
          course_id,
          promo_code_id,
          final_price_paid,
          promo_price,
          promo_codes (promo_price),
          courses (
            id,
            title,
            price,
            discount_price,
            is_free
          )
        `)
        .gte('enrolled_at', startDate.toISOString());

      // Fetch software purchases
      const { data: purchases } = await supabase
        .from('software_purchases')
        .select(`
          id,
          purchased_at,
          amount_paid,
          product_id,
          software_products (
            id,
            title
          )
        `)
        .gte('purchased_at', startDate.toISOString());

      // Calculate revenue
      let totalCourseRevenue = 0;
      let totalSoftwareRevenue = 0;
      const courseEnrollments = enrollments?.length || 0;
      const softwarePurchases = purchases?.length || 0;

      // Course revenue (estimated from prices - since we use promo codes)
      const courseRevenueMap: Record<string, { name: string; revenue: number; enrollments: number }> = {};
      enrollments?.forEach((e) => {
        const course = e.courses as {
          id: string;
          title: string;
          price: number | null;
          discount_price: number | null;
          is_free: boolean | null;
        } | null;
        if (!course) return;

        let revenue = 0;
        if (e.promo_code_id) {
          // Promo code enrollment: revenue = paid amount (could be 0)
          revenue = promoEnrollmentRevenue(e);
        } else {
          // Skip free courses entirely — no revenue
          if (course.is_free || (Number(course.price ?? 0) === 0)) return;
          revenue = Number(course.discount_price ?? course.price ?? 0) || 0;
        }

        if (!Number.isFinite(revenue)) revenue = 0;
        // Skip zero-revenue entries (free courses / ₹0 promo codes)
        if (revenue <= 0) return;

        totalCourseRevenue += revenue;

        if (!courseRevenueMap[course.id]) {
          courseRevenueMap[course.id] = { name: course.title, revenue: 0, enrollments: 0 };
        }
        courseRevenueMap[course.id].revenue += revenue;
        courseRevenueMap[course.id].enrollments += 1;
      });

      // Software revenue
      const softwareRevenueMap: Record<string, { name: string; revenue: number; purchases: number }> = {};
      purchases?.forEach(p => {
        const amount = p.amount_paid || 0;
        totalSoftwareRevenue += amount;
        
        const product = p.software_products as any;
        if (product) {
          if (!softwareRevenueMap[product.id]) {
            softwareRevenueMap[product.id] = { name: product.title, revenue: 0, purchases: 0 };
          }
          softwareRevenueMap[product.id].revenue += amount;
          softwareRevenueMap[product.id].purchases += 1;
        }
      });

      // Revenue by date
      const dateMap: Record<string, { courses: number; software: number }> = {};
      
      enrollments?.forEach((e) => {
        const date = format(new Date(e.enrolled_at), 'yyyy-MM-dd');
        const course = e.courses as {
          price: number | null;
          discount_price: number | null;
          is_free: boolean | null;
        } | null;
        if (!course) return;
        if (!dateMap[date]) dateMap[date] = { courses: 0, software: 0 };

        let rev = 0;
        if (e.promo_code_id) {
          rev = promoEnrollmentRevenue(e);
        } else if (!course.is_free && Number(course.price ?? 0) > 0) {
          rev = Number(course.discount_price ?? course.price ?? 0) || 0;
        }
        if (Number.isFinite(rev) && rev > 0) dateMap[date].courses += rev;
      });

      purchases?.forEach(p => {
        const date = format(new Date(p.purchased_at), 'yyyy-MM-dd');
        if (!dateMap[date]) dateMap[date] = { courses: 0, software: 0 };
        dateMap[date].software += p.amount_paid || 0;
      });

      const revenueByDate = Object.entries(dateMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, values]) => ({
          date: format(new Date(date), 'MMM d'),
          courses: values.courses,
          software: values.software,
          total: values.courses + values.software,
        }));

      setData({
        totalCourseRevenue,
        totalSoftwareRevenue,
        courseEnrollments,
        softwarePurchases,
        revenueByDate,
        topCourses: Object.values(courseRevenueMap)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5),
        topSoftware: Object.values(softwareRevenueMap)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5),
      });
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalRevenue = data.totalCourseRevenue + data.totalSoftwareRevenue;

  const pieData = [
    { name: 'Courses', value: data.totalCourseRevenue },
    { name: 'Software', value: data.totalSoftwareRevenue },
  ].filter(d => d.value > 0);

  const stats = [
    { 
      icon: IndianRupee, 
      label: "Total Revenue", 
      value: formatPrice(totalRevenue), 
      color: "text-green-500" 
    },
    { 
      icon: BookOpen, 
      label: "Course Revenue", 
      value: formatPrice(data.totalCourseRevenue), 
      color: "text-blue-500",
      subtext: `${data.courseEnrollments} enrollments`
    },
    { 
      icon: Package, 
      label: "Software Revenue", 
      value: formatPrice(data.totalSoftwareRevenue), 
      color: "text-purple-500",
      subtext: `${data.softwarePurchases} purchases`
    },
    { 
      icon: TrendingUp, 
      label: "Total Sales", 
      value: data.courseEnrollments + data.softwarePurchases, 
      color: "text-orange-500" 
    },
  ];

  if (isLoading) {
    return (
      <AdminLayout title="Revenue Analytics" subtitle="Track earnings from courses and software">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Revenue Analytics" 
      subtitle="Track earnings from courses and software"
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
                {stat.subtext && (
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Revenue Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.revenueByDate.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.revenueByDate}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => formatPrice(value)}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="courses" 
                      stackId="1"
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))"
                      fillOpacity={0.6}
                      name="Courses"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="software" 
                      stackId="1"
                      stroke="hsl(var(--chart-2))" 
                      fill="hsl(var(--chart-2))"
                      fillOpacity={0.6}
                      name="Software"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No revenue data available for this period
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Revenue Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Revenue Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatPrice(value)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No revenue data
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Sellers */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Courses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Top Courses by Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.topCourses.length > 0 ? (
                <div className="space-y-4">
                  {data.topCourses.map((course, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium line-clamp-1">{course.name}</p>
                        <p className="text-sm text-muted-foreground">{course.enrollments} enrollments</p>
                      </div>
                      <span className="font-bold text-primary">{formatPrice(course.revenue)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No course revenue data
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Software */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Top Software by Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.topSoftware.length > 0 ? (
                <div className="space-y-4">
                  {data.topSoftware.map((software, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium line-clamp-1">{software.name}</p>
                        <p className="text-sm text-muted-foreground">{software.purchases} purchases</p>
                      </div>
                      <span className="font-bold text-primary">{formatPrice(software.revenue)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No software revenue data
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminRevenue;
