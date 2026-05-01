import { useEffect, useState } from "react";
import { Loader2, Check, X, IndianRupee, Users, TrendingUp } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Affiliate {
  id: string; user_id: string; referral_code: string; status: "pending" | "approved" | "rejected";
  total_earnings: number; total_sales: number; pending_earnings: number; paid_earnings: number;
  created_at: string;
  profiles?: { full_name: string | null; email: string };
}
interface SaleRow {
  id: string; affiliate_id: string; user_id: string; package_id: string; sale_amount: number;
  commission_amount: number; commission_percent: number; status: "pending" | "paid" | "rejected";
  paid_at: string | null; created_at: string;
  packages?: { name: string };
  affiliates?: { referral_code: string; profiles?: { full_name: string | null; email: string } };
}

export default function AdminAffiliates() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const affRes = await supabase
      .from("affiliates")
      .select("*")
      .order("created_at", { ascending: false });

    // Manual profile join (no FK declared)
    const userIds = (affRes.data || []).map(a => a.user_id);
    const profileMap = new Map<string, { full_name: string | null; email: string }>();
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      (profs || []).forEach(p => profileMap.set(p.id, { full_name: p.full_name, email: p.email }));
    }
    const affs: Affiliate[] = (affRes.data || []).map(a => ({
      ...a,
      profiles: profileMap.get(a.user_id),
    })) as Affiliate[];
    setAffiliates(affs);

    const salesRes = await supabase
      .from("affiliate_sales")
      .select("*, packages(name)")
      .order("created_at", { ascending: false });
    const affMap = new Map(affs.map(a => [a.id, a]));
    const salesRows: SaleRow[] = (salesRes.data || []).map(s => ({
      ...s,
      affiliates: affMap.get(s.affiliate_id) ? {
        referral_code: affMap.get(s.affiliate_id)!.referral_code,
        profiles: affMap.get(s.affiliate_id)!.profiles,
      } : undefined,
    })) as SaleRow[];
    setSales(salesRows);

    setLoading(false);
  }

  async function setStatus(id: string, status: "approved" | "rejected") {
    const patch: Record<string, unknown> = { status };
    if (status === "approved") patch.approved_at = new Date().toISOString();
    const { error } = await supabase.from("affiliates").update(patch).eq("id", id);
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { toast({ title: status === "approved" ? "Affiliate approved" : "Affiliate rejected" }); void load(); }
  }

  async function markPaid(saleId: string) {
    const { error } = await supabase.rpc("mark_affiliate_sale_paid", { _sale_id: saleId });
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Marked as paid" }); void load(); }
  }

  const totalAffiliates = affiliates.filter(a => a.status === "approved").length;
  const totalSales = sales.reduce((s, x) => s + Number(x.sale_amount || 0), 0);
  const totalCommission = sales.reduce((s, x) => s + Number(x.commission_amount || 0), 0);
  const pending = affiliates.filter(a => a.status === "pending");

  return (
    <AdminLayout title="Affiliates" subtitle="Approve affiliates and manage commission payouts">
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <Card><CardContent className="p-4">
              <Users className="w-5 h-5 text-primary mb-2" />
              <div className="text-2xl font-bold">{totalAffiliates}</div>
              <div className="text-xs text-muted-foreground">Approved Affiliates</div>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <Users className="w-5 h-5 text-amber-500 mb-2" />
              <div className="text-2xl font-bold">{pending.length}</div>
              <div className="text-xs text-muted-foreground">Pending Approval</div>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
              <div className="text-2xl font-bold">₹{totalSales.toLocaleString("en-IN")}</div>
              <div className="text-xs text-muted-foreground">Total Affiliate Sales</div>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <IndianRupee className="w-5 h-5 text-purple-500 mb-2" />
              <div className="text-2xl font-bold">₹{totalCommission.toLocaleString("en-IN")}</div>
              <div className="text-xs text-muted-foreground">Total Commissions</div>
            </CardContent></Card>
          </div>

          <Tabs defaultValue="affiliates">
            <TabsList>
              <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
              <TabsTrigger value="sales">Sales & Payouts</TabsTrigger>
            </TabsList>

            <TabsContent value="affiliates" className="mt-4">
              <Card><CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sales</TableHead>
                      <TableHead>Earnings</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {affiliates.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                        No affiliate applications yet.
                      </TableCell></TableRow>
                    )}
                    {affiliates.map(a => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <div className="font-medium text-sm">{a.profiles?.full_name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{a.profiles?.email}</div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{a.referral_code}</TableCell>
                        <TableCell>
                          <Badge variant={a.status === "approved" ? "default" : a.status === "pending" ? "secondary" : "destructive"}>
                            {a.status}
                          </Badge>
                        </TableCell>
                        <TableCell>₹{Number(a.total_sales).toLocaleString("en-IN")}</TableCell>
                        <TableCell>₹{Number(a.total_earnings).toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-amber-600">₹{Number(a.pending_earnings).toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-right space-x-1">
                          {a.status === "pending" && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => setStatus(a.id, "approved")}>
                                <Check className="w-3.5 h-3.5 mr-1" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" className="text-destructive" onClick={() => setStatus(a.id, "rejected")}>
                                <X className="w-3.5 h-3.5 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                          {a.status === "approved" && (
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setStatus(a.id, "rejected")}>
                              Revoke
                            </Button>
                          )}
                          {a.status === "rejected" && (
                            <Button size="sm" variant="outline" onClick={() => setStatus(a.id, "approved")}>Approve</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="sales" className="mt-4">
              <Card><CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Affiliate</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Sale</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                        No affiliate sales yet.
                      </TableCell></TableRow>
                    )}
                    {sales.map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="text-sm">{format(new Date(s.created_at), "dd MMM yyyy")}</TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{s.affiliates?.profiles?.full_name || s.affiliates?.profiles?.email || "—"}</div>
                          <div className="text-xs text-muted-foreground font-mono">{s.affiliates?.referral_code}</div>
                        </TableCell>
                        <TableCell>{s.packages?.name || "—"}</TableCell>
                        <TableCell>₹{Number(s.sale_amount).toLocaleString("en-IN")}</TableCell>
                        <TableCell>
                          <div className="text-sm">₹{Number(s.commission_amount).toLocaleString("en-IN")}</div>
                          <div className="text-xs text-muted-foreground">{Number(s.commission_percent)}%</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={s.status === "paid" ? "default" : s.status === "pending" ? "secondary" : "destructive"}>
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {s.status === "pending" && (
                            <Button size="sm" onClick={() => markPaid(s.id)}>Mark Paid</Button>
                          )}
                          {s.status === "paid" && s.paid_at && (
                            <span className="text-xs text-muted-foreground">{format(new Date(s.paid_at), "dd MMM yyyy")}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent></Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </AdminLayout>
  );
}
