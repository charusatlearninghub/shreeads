import { useEffect, useState } from "react";
import { Users, UserCheck, Network, Trophy, Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Stats {
  total_affiliates: number;
  pending_affiliates: number;
  total_referrals: number;
  total_users: number;
}

interface TopSponsor {
  sponsor_id: string;
  sponsor_name: string | null;
  sponsor_email: string | null;
  referral_count: number;
}

const AdminAffiliateNetwork = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [top, setTop] = useState<TopSponsor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, t] = await Promise.all([
          supabase.rpc("get_affiliate_network_stats"),
          supabase.rpc("get_top_sponsors", { _limit: 25 }),
        ]);
        if (s.error) throw s.error;
        if (t.error) throw t.error;
        setStats(s.data as unknown as Stats);
        setTop((t.data as unknown as TopSponsor[]) || []);
      } catch (e: any) {
        toast({ title: "Failed to load network stats", description: e.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const cards = [
    { label: "Total Users", value: stats?.total_users ?? 0, icon: Users, color: "text-primary bg-primary/10" },
    { label: "Total Affiliates", value: stats?.total_affiliates ?? 0, icon: UserCheck, color: "text-green-500 bg-green-500/10" },
    { label: "Pending Affiliates", value: stats?.pending_affiliates ?? 0, icon: Network, color: "text-orange-500 bg-orange-500/10" },
    { label: "Total Referrals", value: stats?.total_referrals ?? 0, icon: Trophy, color: "text-purple-500 bg-purple-500/10" },
  ];

  return (
    <AdminLayout title="Affiliate Network" subtitle="Sponsorship and referral overview">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map(c => (
          <Card key={c.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.color}`}>
                <c.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Sponsors</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : top.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No referrals recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Sponsor</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Referrals</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {top.map((s, i) => (
                    <TableRow key={s.sponsor_id}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{s.sponsor_name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.sponsor_email || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{s.referral_count}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminAffiliateNetwork;
