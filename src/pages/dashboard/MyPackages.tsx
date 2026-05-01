import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package as PackageIcon, BookOpen, Box, ArrowRight, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PurchaseRow {
  id: string; package_id: string; amount_paid: number; purchased_at: string;
  packages?: { name: string; description: string | null; thumbnail_url: string | null };
}
interface ItemRow {
  package_id: string; item_type: "course" | "software"; item_id: string;
  title?: string;
}

export default function MyPackages() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [itemsByPkg, setItemsByPkg] = useState<Record<string, ItemRow[]>>({});

  useEffect(() => { if (user) void load(); }, [user]);

  async function load() {
    setLoading(true);
    const { data: p } = await supabase
      .from("package_purchases")
      .select("id, package_id, amount_paid, purchased_at, packages(name, description, thumbnail_url)")
      .eq("user_id", user!.id)
      .order("purchased_at", { ascending: false });
    const purs = (p || []) as PurchaseRow[];
    setPurchases(purs);

    const ids = purs.map(x => x.package_id);
    if (ids.length) {
      const { data: items } = await supabase
        .from("package_items")
        .select("package_id, item_type, item_id")
        .in("package_id", ids);
      const courseIds = (items || []).filter(i => i.item_type === "course").map(i => i.item_id);
      const swIds = (items || []).filter(i => i.item_type === "software").map(i => i.item_id);
      const [cRes, sRes] = await Promise.all([
        courseIds.length ? supabase.from("courses").select("id, title").in("id", courseIds) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
        swIds.length ? supabase.from("software_products").select("id, title").in("id", swIds) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      ]);
      const titleMap = new Map<string, string>();
      (cRes.data || []).forEach(c => titleMap.set("c:" + c.id, c.title));
      (sRes.data || []).forEach(s => titleMap.set("s:" + s.id, s.title));
      const grouped: Record<string, ItemRow[]> = {};
      (items || []).forEach(i => {
        const key = (i.item_type === "course" ? "c:" : "s:") + i.item_id;
        const row: ItemRow = { ...i, item_type: i.item_type as "course" | "software", title: titleMap.get(key) };
        if (!grouped[i.package_id]) grouped[i.package_id] = [];
        grouped[i.package_id].push(row);
      });
      setItemsByPkg(grouped);
    }
    setLoading(false);
  }

  return (
    <DashboardLayout title="My Packages" subtitle="Bundles you've unlocked">
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : purchases.length === 0 ? (
        <Card><CardContent className="py-16 text-center">
          <PackageIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="font-semibold mb-1">No packages yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Browse our learning bundles and unlock multiple courses + tools at once.</p>
          <Button asChild><Link to="/packages">Browse Packages</Link></Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {purchases.map(p => {
            const items = itemsByPkg[p.package_id] || [];
            const courses = items.filter(i => i.item_type === "course");
            const software = items.filter(i => i.item_type === "software");
            return (
              <Card key={p.id}><CardContent className="p-5">
                <div className="flex items-start gap-4 flex-wrap">
                  {p.packages?.thumbnail_url ? (
                    <img src={p.packages.thumbnail_url} alt={p.packages.name} className="w-24 h-24 rounded-lg object-cover" />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center shrink-0">
                      <PackageIcon className="w-8 h-8 text-primary/60" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-display font-bold">{p.packages?.name}</h3>
                      <Badge variant="secondary">Unlocked</Badge>
                    </div>
                    {p.packages?.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{p.packages.description}</p>}
                    <div className="grid sm:grid-cols-2 gap-3 mt-2">
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Courses</h4>
                        <ul className="space-y-1">
                          {courses.length === 0 && <li className="text-sm text-muted-foreground">None</li>}
                          {courses.map(c => (
                            <li key={c.item_id}>
                              <Link to={`/course/${c.item_id}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                                {c.title || "Course"} <ArrowRight className="w-3 h-3" />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 flex items-center gap-1.5"><Box className="w-3.5 h-3.5" /> Software</h4>
                        <ul className="space-y-1">
                          {software.length === 0 && <li className="text-sm text-muted-foreground">None</li>}
                          {software.map(s => (
                            <li key={s.item_id}>
                              <Link to={`/software/${s.item_id}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                                {s.title || "Software"} <ArrowRight className="w-3 h-3" />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent></Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
