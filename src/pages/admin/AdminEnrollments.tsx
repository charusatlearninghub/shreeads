import { useState, useEffect } from "react";
import { usePagination } from '@/hooks/usePagination';
import { TablePagination } from '@/components/admin/TablePagination';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Search,
  Calendar,
  Filter,
  X,
  BookOpen,
  Ticket,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

function formatEnrollmentRupee(n: unknown): string {
  if (n === null || n === undefined || n === "") return "—";
  const num = Number(n);
  if (!Number.isFinite(num)) return "—";
  return `₹${num.toLocaleString("en-IN")}`;
}

const AdminEnrollments = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [enrollmentType, setEnrollmentType] = useState<string>("all");

  // Fetch all enrollments
  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["admin-enrollments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("*")
        .order("enrolled_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch profiles for user names
  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email");
      if (error) throw error;
      return data;
    },
  });

  // Fetch courses for course names
  const { data: courses } = useQuery({
    queryKey: ["admin-courses-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, is_free");
      if (error) throw error;
      return data;
    },
  });

  // Create lookup maps
  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
  const courseMap = new Map(courses?.map((c) => [c.id, c]) || []);

  // Filter enrollments
  const filteredEnrollments = enrollments?.filter((enrollment) => {
    const profile = profileMap.get(enrollment.user_id);
    const course = courseMap.get(enrollment.course_id);

    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const promoLabel =
      typeof (enrollment as any).promo_code === "string" ? (enrollment as any).promo_code : "";
    const matchesSearch =
      !searchQuery ||
      profile?.full_name?.toLowerCase().includes(searchLower) ||
      profile?.email?.toLowerCase().includes(searchLower) ||
      course?.title?.toLowerCase().includes(searchLower) ||
      promoLabel.toLowerCase().includes(searchLower);

    // Course filter
    const matchesCourse =
      selectedCourse === "all" || enrollment.course_id === selectedCourse;

    // Enrollment type filter
    let matchesType = true;
    if (enrollmentType !== "all") {
      if (enrollmentType === "promo") {
        matchesType = !!enrollment.promo_code_id;
      } else if (enrollmentType === "direct") {
        matchesType = !enrollment.promo_code_id;
      }
    }

    // Date range filter
    let matchesDate = true;
    if (dateRange !== "all") {
      const enrollDate = new Date(enrollment.enrolled_at);
      const now = new Date();
      switch (dateRange) {
        case "today":
          matchesDate = enrollDate.toDateString() === now.toDateString();
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = enrollDate >= weekAgo;
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = enrollDate >= monthAgo;
          break;
        case "year":
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          matchesDate = enrollDate >= yearAgo;
          break;
      }
    }

    return matchesSearch && matchesCourse && matchesType && matchesDate;
  });

  const enrollmentsPagination = usePagination(filteredEnrollments, { pageSize: 10 });
  const paginatedEnrollments = enrollmentsPagination.paginatedItems;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCourse("all");
    setDateRange("all");
    setEnrollmentType("all");
  };

  const hasActiveFilters =
    searchQuery ||
    selectedCourse !== "all" ||
    dateRange !== "all" ||
    enrollmentType !== "all";

  // Calculate stats
  const promoEnrollments =
    enrollments?.filter((e) => e.promo_code_id).length || 0;
  const directEnrollments = (enrollments?.length || 0) - promoEnrollments;

  return (
    <AdminLayout title="Enrollments" subtitle="View and manage all course enrollments">
      <div className="space-y-6">

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{enrollments?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total Enrollments</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <Ticket className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{promoEnrollments}</p>
                <p className="text-sm text-muted-foreground">Via Promo Code</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{directEnrollments}</p>
                <p className="text-sm text-muted-foreground">Direct Enrollments</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, course..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Course Filter */}
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Courses" />
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

                {/* Enrollment Type Filter */}
                <Select value={enrollmentType} onValueChange={setEnrollmentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="promo">Via Promo Code</SelectItem>
                    <SelectItem value="direct">Direct Enrollment</SelectItem>
                  </SelectContent>
                </Select>

                {/* Date Range Filter */}
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <Calendar className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                  </SelectContent>
                </Select>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Enrollments Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-0">
              {enrollmentsLoading ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredEnrollments && filteredEnrollments.length > 0 ? (
                <>
                <div className="overflow-x-auto">
                  <Table>
                     <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead className="hidden sm:table-cell">Course</TableHead>
                        <TableHead className="hidden lg:table-cell text-right">Original</TableHead>
                        <TableHead className="hidden md:table-cell">Promo Code</TableHead>
                        <TableHead className="hidden lg:table-cell text-right">Paid</TableHead>
                        <TableHead className="hidden md:table-cell">Type</TableHead>
                        <TableHead className="hidden lg:table-cell">Enrolled Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedEnrollments.map((enrollment) => {
                        const profile = profileMap.get(enrollment.user_id);
                        const course = courseMap.get(enrollment.course_id);
                        const row = enrollment as {
                          course_name?: string | null;
                          original_price?: number | null;
                          final_price_paid?: number | null;
                          promo_code?: string | null;
                        };
                        const courseTitle =
                          row.course_name || course?.title || "Unknown Course";
                        const originalSnap = row.original_price;
                        const paidSnap = row.final_price_paid;
                        const codeSnap = row.promo_code || "";
                        return (
                          <TableRow key={enrollment.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {profile?.full_name || "Unknown"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {profile?.email || "N/A"}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate max-w-[200px]">
                                  {courseTitle}
                                </span>
                                {course?.is_free && (
                                  <Badge variant="secondary" className="text-xs">
                                    Free
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-right tabular-nums text-sm">
                              {formatEnrollmentRupee(originalSnap)}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {enrollment.promo_code_id ? (
                                <code className="text-xs bg-secondary px-2 py-1 rounded font-mono">
                                  {codeSnap || "—"}
                                </code>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-right tabular-nums text-sm font-medium">
                              {formatEnrollmentRupee(paidSnap)}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              {enrollment.promo_code_id ? (
                                <Badge
                                  variant="outline"
                                  className="bg-green-500/10 text-green-600 border-green-500/30"
                                >
                                  <Ticket className="w-3 h-3 mr-1" />
                                  Promo Code
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-blue-500/10 text-blue-600 border-blue-500/30"
                                >
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  Direct
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm">
                              {format(new Date(enrollment.enrolled_at), "PPP")}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <TablePagination
                  currentPage={enrollmentsPagination.currentPage}
                  totalPages={enrollmentsPagination.totalPages}
                  totalItems={enrollmentsPagination.totalItems}
                  pageSize={enrollmentsPagination.pageSize}
                  onPageChange={enrollmentsPagination.goToPage}
                />
                </>
              ) : (
                <div className="p-12 text-center">
                  <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Enrollments Found
                  </h3>
                  <p className="text-muted-foreground">
                    {hasActiveFilters
                      ? "Try adjusting your filters to see more results."
                      : "No course enrollments have been made yet."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary Stats */}
        {filteredEnrollments && filteredEnrollments.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-muted-foreground text-center"
          >
            Showing {filteredEnrollments.length} of {enrollments?.length || 0}{" "}
            enrollments
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminEnrollments;
