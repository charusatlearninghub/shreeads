import { useEffect, useState } from "react";
import { Loader2, Copy, IndianRupee, TrendingUp, Clock, CheckCircle2, Share2, MessageCircle, Users } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { buildReferralLink } from "@/lib/site-url";
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
  const [referralCount, setReferralCount] = useState(0);

  useEffect(() => { if (user) void load(); }, [user]);

  async function load() {
    setLoading(true);
    try {
      // Find or auto-provision (auto-approved) affiliate row for this user.
      let { data: aff } = await supabase
        .from("affiliates").select("*").eq("user_id", user!.id).maybeSingle();
      if (!aff) {
        const { data: created, error } = await supabase.rpc("apply_as_affiliate");
        if (error) throw error;
        aff = created as typeof aff;
      }
      setAffiliate(aff as unknown as Affiliate);

      if (aff) {
        const [{ data: s }, { count }] = await Promise.all([
          supabase
            .from("affiliate_sales")
            .select("id, package_id, course_id, sale_type, product_name, sale_amount, commission_amount, status, created_at, packages(name), courses(title)")
            .eq("affiliate_id", aff.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("sponsor_id", user!.id),
        ]);
        setSales((s || []) as unknown as SaleRow[]);
        setReferralCount(count ?? 0);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load affiliate data";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  if (loading || !affiliate) {
    return (
      <DashboardLayout title="Affiliate">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const link = buildReferralLink(affiliate.referral_code);
  const code = affiliate.referral_code;

  const copy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast({ title: `${label} copied`, description: value });
  };

  const shareWhatsApp = () => {
    const text = `Join SHREE ADS LEARNx using my referral code *${code}* — sign up here: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const nativeShare = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Join SHREE ADS LEARNx",
          text: `Use my referral code ${code}`,
          url: link,
        });
      } catch { /* user cancelled */ }
    } else {
      copy(link, "Link");
    }
  };

  return (
    <DashboardLayout title="Affiliate Dashboard" subtitle="Your single referral code — share, track, and earn">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <Card><CardContent className="p-4">
          <Users className="w-5 h-5 text-primary mb-2" />
          <div className="text-2xl font-bold">{referralCount}</div>
          <div className="text-xs text-muted-foreground">Total Referrals</div>
        </CardContent></Card>
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

      {/* Referral code + link */}
      <Card className="mb-6"><CardContent className="p-5 space-y-5">
        <div>
          <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Your Referral Code</h3>
          <div className="flex flex-wrap gap-2 items-center">
            <code className="flex-1 min-w-0 px-4 py-3 bg-secondary rounded-lg font-mono font-bold text-xl tracking-wider text-center">{code}</code>
            <Button variant="outline" onClick={() => copy(code, "Code")}>
              <Copy className="w-4 h-4 mr-2" /> Copy Code
            </Button>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Your Referral Link</h3>
          <div className="flex flex-wrap gap-2 items-center">
            <code className="flex-1 min-w-0 px-3 py-2 bg-muted rounded-lg text-sm break-all">{link}</code>
            <Button variant="outline" onClick={() => copy(link, "Link")}>
              <Copy className="w-4 h-4 mr-2" /> Copy Link
            </Button>
            <Button className="bg-[#25D366] hover:bg-[#1ebd5a] text-white" onClick={shareWhatsApp}>
              <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
            </Button>
            <Button variant="secondary" onClick={nativeShare}>
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Share this link or code. When someone signs up and buys a course or package, you earn the configured commission automatically.
          </p>
        </div>
      </CardContent></Card>

      {/* Sales table — desktop */}
      <Card className="hidden md:block"><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Sale</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                No sales yet — share your link to start earning.
              </TableCell></TableRow>
            )}
            {sales.map(s => {
              const name = s.product_name || s.packages?.name || s.courses?.title || "—";
              const isCourse = s.sale_type === "course";
              return (
                <TableRow key={s.id}>
                  <TableCell className="text-sm">{format(new Date(s.created_at), "dd MMM yyyy")}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{name}</TableCell>
                  <TableCell>
                    <Badge variant={isCourse ? "outline" : "secondary"}>
                      {isCourse ? "Course" : "Package"}
                    </Badge>
                  </TableCell>
                  <TableCell>₹{Number(s.sale_amount).toLocaleString("en-IN")}</TableCell>
                  <TableCell className="font-medium">₹{Number(s.commission_amount).toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === "paid" ? "default" : s.status === "pending" ? "secondary" : "destructive"}>
                      {s.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent></Card>

      {/* Sales — mobile cards */}
      <div className="md:hidden space-y-3">
        {sales.length === 0 && (
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">
            No sales yet — share your link to start earning.
          </CardContent></Card>
        )}
        {sales.map(s => {
          const name = s.product_name || s.packages?.name || s.courses?.title || "—";
          const isCourse = s.sale_type === "course";
          return (
            <Card key={s.id}><CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm truncate flex-1">{name}</p>
                <Badge variant={isCourse ? "outline" : "secondary"} className="shrink-0 text-[10px]">
                  {isCourse ? "Course" : "Package"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{format(new Date(s.created_at), "dd MMM yyyy")}</span>
                <Badge variant={s.status === "paid" ? "default" : s.status === "pending" ? "secondary" : "destructive"} className="text-[10px]">
                  {s.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm border-t pt-2">
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground">Sale</div>
                  <div className="font-medium">₹{Number(s.sale_amount).toLocaleString("en-IN")}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase text-muted-foreground">Commission</div>
                  <div className="font-semibold text-primary">₹{Number(s.commission_amount).toLocaleString("en-IN")}</div>
                </div>
              </div>
            </CardContent></Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
