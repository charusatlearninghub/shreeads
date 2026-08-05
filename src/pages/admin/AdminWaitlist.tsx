import { useEffect, useState } from "react";
import { Loader2, BellRing, Trash2, MailCheck, Download } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface WaitlistRow {
  id: string;
  course_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  status: string;
  notified_at: string | null;
  created_at: string;
  courses?: { title: string } | null;
}

interface CourseOption {
  id: string;
  title: string;
  is_upcoming: boolean;
}

export default function AdminWaitlist() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<WaitlistRow[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [courseFilter, setCourseFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: waitlist, error }, { data: courseList }] = await Promise.all([
        supabase
          .from("course_waitlist")
          .select("id, course_id, email, full_name, phone, status, notified_at, created_at, courses(title)")
          .order("created_at", { ascending: false }),
        supabase.from("courses").select("id, title, is_upcoming").order("title"),
      ]);
      if (error) throw error;
      setRows((waitlist || []) as unknown as WaitlistRow[]);
      setCourses((courseList || []) as unknown as CourseOption[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load waitlist";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = courseFilter === "all" ? rows : rows.filter(r => r.course_id === courseFilter);
  const waitingCount = filtered.filter(r => r.status === "waiting").length;

  const markNotified = async (id: string) => {
    const { error } = await supabase
      .from("course_waitlist")
      .update({ status: "notified", notified_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Marked as notified" });
    void load();
  };

  const markAllNotified = async () => {
    const ids = filtered.filter(r => r.status === "waiting").map(r => r.id);
    if (ids.length === 0) return;
    const { error } = await supabase
      .from("course_waitlist")
      .update({ status: "notified", notified_at: new Date().toISOString() })
      .in("id", ids);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `${ids.length} entries marked as notified` });
    void load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("course_waitlist").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Entry removed" });
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const exportCsv = () => {
    const header = ["Course", "Name", "Email", "Phone", "Status", "Joined"];
    const lines = filtered.map(r => [
      r.courses?.title ?? "",
      r.full_name ?? "",
      r.email,
      r.phone ?? "",
      r.status,
      format(new Date(r.created_at), "yyyy-MM-dd"),
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [header.join(","), ...lines].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "course-waitlist.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout title="Course Waitlist" subtitle="People waiting for upcoming courses">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Card><CardContent className="p-4">
              <BellRing className="w-5 h-5 text-primary mb-2" />
              <div className="text-2xl font-bold">{filtered.length}</div>
              <div className="text-xs text-muted-foreground">Total signups</div>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <MailCheck className="w-5 h-5 text-amber-500 mb-2" />
              <div className="text-2xl font-bold">{waitingCount}</div>
              <div className="text-xs text-muted-foreground">Not yet notified</div>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <BellRing className="w-5 h-5 text-emerald-500 mb-2" />
              <div className="text-2xl font-bold">{courses.filter(c => c.is_upcoming).length}</div>
              <div className="text-xs text-muted-foreground">Upcoming courses</div>
            </CardContent></Card>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="All courses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All courses</SelectItem>
                {courses.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
            <Button onClick={markAllNotified} disabled={waitingCount === 0}>
              <MailCheck className="w-4 h-4 mr-2" /> Mark all notified
            </Button>
          </div>

          {/* Desktop table */}
          <Card className="hidden md:block"><CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    No waitlist signups yet.
                  </TableCell></TableRow>
                )}
                {filtered.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="max-w-[200px] truncate">{r.courses?.title ?? "—"}</TableCell>
                    <TableCell>{r.full_name || "—"}</TableCell>
                    <TableCell className="text-sm">{r.email}</TableCell>
                    <TableCell className="text-sm">{r.phone || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "notified" ? "default" : "secondary"}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{format(new Date(r.created_at), "dd MMM yyyy")}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {r.status !== "notified" && (
                        <Button size="sm" variant="outline" onClick={() => markNotified(r.id)}>
                          <MailCheck className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.length === 0 && (
              <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
                No waitlist signups yet.
              </CardContent></Card>
            )}
            {filtered.map(r => (
              <Card key={r.id}><CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm truncate flex-1">{r.courses?.title ?? "—"}</p>
                  <Badge variant={r.status === "notified" ? "default" : "secondary"} className="text-[10px]">{r.status}</Badge>
                </div>
                <p className="text-sm">{r.full_name || "—"}</p>
                <p className="text-xs text-muted-foreground break-all">{r.email}</p>
                {r.phone && <p className="text-xs text-muted-foreground">{r.phone}</p>}
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-xs text-muted-foreground">{format(new Date(r.created_at), "dd MMM yyyy")}</span>
                  <div className="flex gap-2">
                    {r.status !== "notified" && (
                      <Button size="sm" variant="outline" onClick={() => markNotified(r.id)}>
                        <MailCheck className="w-4 h-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent></Card>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
