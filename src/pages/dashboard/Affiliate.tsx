import { useEffect, useState } from "react";
import { Loader2, Copy, Share2, IndianRupee, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Affiliate {
  id: string; user_id: string; referral_code: string; status: "pending" | "approved" | "rejected";
  total_earnings: number; total_sales: number; pending_earnings: number; paid_earnings: number;
}
interface SaleRow {
  id: string; package_id: string | null; course_id: string | null;
  sale_type: "course" | "package"; product_name: string | null;
  sale_amount: number; commission_amount: number;
  status: "pending" | "paid" | "rejected"; created_at: string;
  packages?: { name: string } | null;
  courses?: { title: string } | null;
}

export default function Affiliate() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [applying, setApplying] = useState(false);

  useEffect(() => { if (user) void load(); }, [user]);

  async function load() {
    setLoading(true);
    const { data: aff } = await supabase
      .from("affiliates").select("*").eq("user_id", user!.id).maybeSingle();
    setAffiliate(aff as Affiliate | null);
    if (aff) {
      const { data: s } = await supabase
        .from("affiliate_sales")
        .select("id, package_id, course_id, sale_type, product_name, sale_amount, commission_amount, status, created_at, packages(name), courses(title)")
        .eq("affiliate_id", aff.id)
        .order("created_at", { ascending: false });
      setSales((s || []) as unknown as SaleRow[]);
    }
    setLoading(false);
  }

  async function apply() {
    setApplying(true);
    try {
      const { data, error } = await supabase.rpc("apply_as_affiliate");
      if (error) throw error;
      setAffiliate(data as Affiliate);
      toast({ title: "Application submitted", description: "We'll review and approve your affiliate account shortly." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed";
      toast({ title: "Failed", description: msg, variant: "destructive" });
    } finally { setApplying(false); }
  }

  function copyLink() {
    if (!affiliate) return;
    const url = `${window.location.origin}/?ref=${affiliate.referral_code}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied", description: url });
  }

  if (loading) {
    return <DashboardLayout title="Affiliate"><div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  if (!affiliate) {
    return (
      <DashboardLayout title="Affiliate Program" subtitle="Earn commission for every package you sell">
        <Card><CardContent className="py-12 text-center">
          <Share2 className="w-12 h-12 mx-auto text-primary mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">Become an Affiliate</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Apply to join our affiliate program. Once approved, you'll get a unique referral link and earn commission on every package sold through your link.
          </p>
          <Button size="lg" onClick={apply} disabled={applying}>
            {applying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Apply Now
          </Button>
        </CardContent></Card>
      </DashboardLayout>
    );
  }

  if (affiliate.status === "pending") {
    return (
      <DashboardLayout title="Affiliate Program">
        <Card><CardContent className="py-12 text-center">
          <Clock className="w-12 h-12 mx-auto text-amber-500 mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">Application Under Review</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your affiliate application is pending admin approval. You'll be notified once approved and can start sharing your link.
          </p>
        </CardContent></Card>
      </DashboardLayout>
    );
  }

  if (affiliate.status === "rejected") {
    return (
      <DashboardLayout title="Affiliate Program">
        <Card><CardContent className="py-12 text-center">
          <h2 className="font-display text-2xl font-bold mb-2">Application Not Approved</h2>
          <p className="text-muted-foreground">Please contact support for more information.</p>
        </CardContent></Card>
      </DashboardLayout>
    );
  }

  const link = `${window.location.origin}/?ref=${affiliate.referral_code}`;

  return (
    <DashboardLayout title="Affiliate Dashboard" subtitle="Track your referrals and earnings">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card><CardContent className="p-4">
          <TrendingUp className="w-5 h-5 text-primary mb-2" />
          <div className="text-2xl font-bold">₹{Number(affiliate.total_sales).toLocaleString("en-IN")}</div>
          <div className="text-xs text-muted-foreground">Total Sales</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <IndianRupee className="w-5 h-5 text-green-500 mb-2" />
          <div className="text-2xl font-bold">₹{Number(affiliate.total_earnings).toLocaleString("en-IN")}</div>
          <div className="text-xs text-muted-foreground">Total Earnings</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <Clock className="w-5 h-5 text-amber-500 mb-2" />
          <div className="text-2xl font-bold">₹{Number(affiliate.pending_earnings).toLocaleString("en-IN")}</div>
          <div className="text-xs text-muted-foreground">Pending</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-2" />
          <div className="text-2xl font-bold">₹{Number(affiliate.paid_earnings).toLocaleString("en-IN")}</div>
          <div className="text-xs text-muted-foreground">Paid</div>
        </CardContent></Card>
      </div>

      {/* Referral link */}
      <Card className="mb-6"><CardContent className="p-5">
        <h3 className="font-semibold mb-3">Your Referral Link</h3>
        <div className="flex flex-wrap gap-2 items-center">
          <code className="flex-1 min-w-0 px-3 py-2 bg-muted rounded-lg text-sm break-all">{link}</code>
          <Button onClick={copyLink}><Copy className="w-4 h-4 mr-2" /> Copy</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Share this link. When someone visits a package page through your link and purchases, you earn the package commission.
        </p>
      </CardContent></Card>

      {/* Sales table */}
      <Card><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Sale</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                No sales yet — share your link to start earning.
              </TableCell></TableRow>
            )}
            {sales.map(s => (
              <TableRow key={s.id}>
                <TableCell className="text-sm">{format(new Date(s.created_at), "dd MMM yyyy")}</TableCell>
                <TableCell>{s.packages?.name || "—"}</TableCell>
                <TableCell>₹{Number(s.sale_amount).toLocaleString("en-IN")}</TableCell>
                <TableCell className="font-medium">₹{Number(s.commission_amount).toLocaleString("en-IN")}</TableCell>
                <TableCell>
                  <Badge variant={s.status === "paid" ? "default" : s.status === "pending" ? "secondary" : "destructive"}>
                    {s.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </DashboardLayout>
  );
}
