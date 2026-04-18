import { useState } from "react";
import { MobileDataCard, MobileCardList } from '@/components/admin/MobileDataCard';
import { usePagination } from '@/hooks/usePagination';
import { TablePagination } from '@/components/admin/TablePagination';
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Award, Search, Download, Calendar, Filter, X, RefreshCw, RefreshCwOff, FlaskConical } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";

const AdminCertificates = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [bulkRegenerating, setBulkRegenerating] = useState(false);
  const [testCourse, setTestCourse] = useState<string>("");
  const [generatingTest, setGeneratingTest] = useState(false);

  const callEdgeFunction = async (name: string, body: any) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(
      `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.functions.supabase.co/${name}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify(body),
      },
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Request failed");
    return json;
  };

  const handleRegenerateOne = async (certId: string) => {
    setRegeneratingId(certId);
    try {
      const r = await callEdgeFunction("regenerate-certificate", { certificate_id: certId });
      if (r.succeeded > 0) {
        toast.success("Certificate regenerated");
        queryClient.invalidateQueries({ queryKey: ["admin-certificates"] });
      } else {
        toast.error(r.results?.[0]?.error || "Regeneration failed");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleRegenerateBulk = async () => {
    if (selectedCourse === "all") {
      toast.error("Select a specific course in the filter to regenerate all its certificates");
      return;
    }
    if (!confirm("Regenerate ALL certificates for the selected course using the current template?")) return;
    setBulkRegenerating(true);
    try {
      const r = await callEdgeFunction("regenerate-certificate", { course_id: selectedCourse });
      toast.success(`Regenerated ${r.succeeded}/${r.total} certificates`);
      queryClient.invalidateQueries({ queryKey: ["admin-certificates"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBulkRegenerating(false);
    }
  };

  const handleGenerateTest = async () => {
    if (!testCourse) {
      toast.error("Pick a course first");
      return;
    }
    setGeneratingTest(true);
    try {
      const r = await callEdgeFunction("admin-test-certificate", { course_id: testCourse });
      toast.success(`Test certificate ${r.certificate.certificate_number} generated`);
      if (!r.has_template) toast.warning("No template configured — PDF was not generated");
      queryClient.invalidateQueries({ queryKey: ["admin-certificates"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGeneratingTest(false);
    }
  };

  // Fetch all certificates with user and course info
  const { data: certificates, isLoading: certificatesLoading } = useQuery({
    queryKey: ["admin-certificates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .order("issued_at", { ascending: false });

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
        .select("id, title");
      if (error) throw error;
      return data;
    },
  });

  // Create lookup maps
  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
  const courseMap = new Map(courses?.map((c) => [c.id, c]) || []);

  // Filter certificates
  const filteredCertificates = certificates?.filter((cert) => {
    const profile = profileMap.get(cert.user_id);
    const course = courseMap.get(cert.course_id);

    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      profile?.full_name?.toLowerCase().includes(searchLower) ||
      profile?.email?.toLowerCase().includes(searchLower) ||
      course?.title?.toLowerCase().includes(searchLower) ||
      cert.certificate_number.toLowerCase().includes(searchLower);

    // Course filter
    const matchesCourse =
      selectedCourse === "all" || cert.course_id === selectedCourse;

    // Date range filter
    let matchesDate = true;
    if (dateRange !== "all") {
      const certDate = new Date(cert.issued_at);
      const now = new Date();
      switch (dateRange) {
        case "today":
          matchesDate = certDate.toDateString() === now.toDateString();
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = certDate >= weekAgo;
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = certDate >= monthAgo;
          break;
        case "year":
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          matchesDate = certDate >= yearAgo;
          break;
      }
    }

    return matchesSearch && matchesCourse && matchesDate;
  });

  const certsPagination = usePagination(filteredCertificates, { pageSize: 10 });
  const paginatedCerts = certsPagination.paginatedItems;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCourse("all");
    setDateRange("all");
  };

  const hasActiveFilters =
    searchQuery || selectedCourse !== "all" || dateRange !== "all";

  return (
    <AdminLayout title="Certificates" subtitle="View and manage all issued certificates">
      <div className="space-y-6">
        {/* Stats + Test Cert */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center"
        >
          <Badge variant="secondary" className="text-base px-4 py-2 self-start">
            <Award className="w-5 h-5 mr-2" />
            {certificates?.length || 0} Total Certificates
          </Badge>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <Select value={testCourse} onValueChange={setTestCourse}>
              <SelectTrigger className="sm:w-[260px]">
                <SelectValue placeholder="Pick course for test cert..." />
              </SelectTrigger>
              <SelectContent>
                {courses?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleGenerateTest} disabled={generatingTest || !testCourse} variant="outline">
              <FlaskConical className="w-4 h-4 mr-2" />
              {generatingTest ? "Generating..." : "Generate Test Certificate"}
            </Button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

                {/* Clear Filters + Bulk Regenerate */}
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
              {selectedCourse !== "all" && (
                <div className="mt-4">
                  <Button onClick={handleRegenerateBulk} disabled={bulkRegenerating} variant="secondary" size="sm">
                    <RefreshCw className={`w-4 h-4 mr-2 ${bulkRegenerating ? "animate-spin" : ""}`} />
                    {bulkRegenerating ? "Regenerating all..." : "Regenerate all PDFs for this course"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Certificates Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-0">
              {certificatesLoading ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredCertificates && filteredCertificates.length > 0 ? (
                <>
                {/* Mobile Card View */}
                <MobileCardList>
                  {paginatedCerts.map((cert) => {
                    const profile = profileMap.get(cert.user_id);
                    const course = courseMap.get(cert.course_id);
                    return (
                      <MobileDataCard
                        key={cert.id}
                        fields={[
                          { label: 'Certificate', value: <Badge variant="outline" className="font-mono">{cert.certificate_number}</Badge> },
                          { label: 'Student', value: <span className="font-medium">{profile?.full_name || "Unknown"}</span> },
                          { label: 'Email', value: <span className="text-xs">{profile?.email || "N/A"}</span> },
                          { label: 'Course', value: course?.title || "Unknown Course" },
                          { label: 'Issued', value: format(new Date(cert.issued_at), "PPP") },
                        ]}
                        actions={
                          <div className="flex gap-2 flex-wrap">
                            {cert.pdf_url && (
                              <Button variant="ghost" size="sm" onClick={() => window.open(cert.pdf_url!, "_blank")}>
                                <Download className="w-4 h-4 mr-1" />Download
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleRegenerateOne(cert.id)} disabled={regeneratingId === cert.id}>
                              <RefreshCw className={`w-4 h-4 mr-1 ${regeneratingId === cert.id ? "animate-spin" : ""}`} />
                              Regenerate
                            </Button>
                          </div>
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
                        <TableHead>Certificate</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Issued Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedCerts.map((cert) => {
                        const profile = profileMap.get(cert.user_id);
                        const course = courseMap.get(cert.course_id);
                        return (
                          <TableRow key={cert.id}>
                            <TableCell><Badge variant="outline" className="font-mono">{cert.certificate_number}</Badge></TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium truncate max-w-[150px]">{profile?.full_name || "Unknown"}</p>
                                <p className="text-sm text-muted-foreground truncate max-w-[150px]">{profile?.email || "N/A"}</p>
                              </div>
                            </TableCell>
                            <TableCell><span className="font-medium truncate max-w-[200px] block">{course?.title || "Unknown Course"}</span></TableCell>
                            <TableCell>{format(new Date(cert.issued_at), "PPP")}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {cert.pdf_url && (
                                  <Button variant="ghost" size="sm" onClick={() => window.open(cert.pdf_url!, "_blank")}>
                                    <Download className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="sm" onClick={() => handleRegenerateOne(cert.id)} disabled={regeneratingId === cert.id} title="Regenerate PDF with current template">
                                  <RefreshCw className={`w-4 h-4 ${regeneratingId === cert.id ? "animate-spin" : ""}`} />
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
                  currentPage={certsPagination.currentPage}
                  totalPages={certsPagination.totalPages}
                  totalItems={certsPagination.totalItems}
                  pageSize={certsPagination.pageSize}
                  onPageChange={certsPagination.goToPage}
                />
                </>
              ) : (
                <div className="p-12 text-center">
                  <Award className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Certificates Found
                  </h3>
                  <p className="text-muted-foreground">
                    {hasActiveFilters
                      ? "Try adjusting your filters to see more results."
                      : "No certificates have been issued yet."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary Stats */}
        {filteredCertificates && filteredCertificates.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-muted-foreground text-center"
          >
            Showing {filteredCertificates.length} of {certificates?.length || 0}{" "}
            certificates
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCertificates;
