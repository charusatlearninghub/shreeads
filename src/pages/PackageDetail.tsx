import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Package as PackageIcon, BookOpen, Box, Check, Loader2, Ticket } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SeoHead } from "@/components/common/SeoHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useAffiliateRefCapture, getStoredAffiliateRef, clearStoredAffiliateRef } from "@/hooks/useAffiliateRef";

interface Pkg {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number;
  thumbnail_url: string | null;
}

export default function PackageDetail() {
  useAffiliateRefCapture();
  const { packageId } = useParams<{ packageId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [pkg, setPkg] = useState<Pkg | null>(null);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [software, setSoftware] = useState<{ id: string; title: string }[]>([]);
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [owned, setOwned] = useState(false);

  useEffect(() => { if (packageId) void load(packageId); }, [packageId]);

  async function load(id: string) {
    setLoading(true);
    const { data: p } = await supabase.from("packages")
      .select("id, name, description, price, original_price, thumbnail_url, is_active")
      .eq("id", id).maybeSingle();
    if (!p || !p.is_active) { setPkg(null); setLoading(false); return; }
    setPkg(p as Pkg);

    const { data: items } = await supabase.from("package_items").select("item_type, item_id").eq("package_id", id);
    const courseIds = (items || []).filter(i => i.item_type === "course").map(i => i.item_id);
    const swIds = (items || []).filter(i => i.item_type === "software").map(i => i.item_id);
    const [cRes, sRes] = await Promise.all([
      courseIds.length ? supabase.from("courses").select("id, title").in("id", courseIds) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      swIds.length ? supabase.from("software_products").select("id, title").in("id", swIds) : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    ]);
    setCourses(cRes.data || []);
    setSoftware(sRes.data || []);

    if (user) {
      const { data: own } = await supabase.from("package_purchases").select("id")
        .eq("user_id", user.id).eq("package_id", id).maybeSingle();
      setOwned(!!own);
    }
    setLoading(false);
  }

  async function redeem() {
    if (!user) { navigate("/login"); return; }
    if (!code.trim()) { toast({ title: "Enter your promo code", variant: "destructive" }); return; }
    setRedeeming(true);
    try {
      const ref = getStoredAffiliateRef();
      const { data, error } = await supabase.rpc("redeem_package_promo", {
        _code: code.trim().toUpperCase(),
        _referral_code: ref ?? undefined,
      });
      if (error) throw error;
      const result = data as { success: boolean; affiliate_credited: boolean };
      if (result?.affiliate_credited) clearStoredAffiliateRef();
      toast({ title: "Package unlocked!", description: "All included courses and software are now in your dashboard." });
      navigate("/dashboard/packages");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Redemption failed";
      toast({ title: "Could not redeem", description: msg, variant: "destructive" });
    } finally { setRedeeming(false); }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center pt-40"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-32 pb-20 text-center">
          <PackageIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <h1 className="text-2xl font-bold mb-2">Package not found</h1>
          <Button asChild variant="outline"><Link to="/packages">Browse Packages</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  const save = Number(pkg.original_price) - Number(pkg.price);

  return (
    <div className="min-h-screen bg-background">
      <SeoHead title={`${pkg.name} – ShreeAds Package`} description={pkg.description || "Learning bundle"} />
      <Header />
      <main className="pt-32 md:pt-28 pb-20">
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            {pkg.thumbnail_url ? (
              <img src={pkg.thumbnail_url} alt={pkg.name} className="w-full aspect-video rounded-xl object-cover" />
            ) : (
              <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                <PackageIcon className="w-16 h-16 text-primary/60" />
              </div>
            )}
            <h1 className="font-display text-3xl font-bold mt-6 mb-3">{pkg.name}</h1>
            {pkg.description && <p className="text-muted-foreground">{pkg.description}</p>}

            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              <Card><CardContent className="p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Courses ({courses.length})</h3>
                <ul className="space-y-1.5 text-sm">
                  {courses.length === 0 && <li className="text-muted-foreground">None</li>}
                  {courses.map(c => <li key={c.id} className="flex gap-2"><Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> {c.title}</li>)}
                </ul>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2"><Box className="w-4 h-4" /> Software ({software.length})</h3>
                <ul className="space-y-1.5 text-sm">
                  {software.length === 0 && <li className="text-muted-foreground">None</li>}
                  {software.map(s => <li key={s.id} className="flex gap-2"><Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" /> {s.title}</li>)}
                </ul>
              </CardContent></Card>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="sticky top-24"><CardContent className="p-6">
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl font-bold">₹{Number(pkg.price).toLocaleString("en-IN")}</span>
                {save > 0 && (
                  <>
                    <span className="text-muted-foreground line-through">₹{Number(pkg.original_price).toLocaleString("en-IN")}</span>
                    <Badge>Save ₹{save.toLocaleString("en-IN")}</Badge>
                  </>
                )}
              </div>

              {owned ? (
                <div className="space-y-3">
                  <Badge variant="default" className="w-full justify-center py-2 text-sm">You own this package</Badge>
                  <Button asChild className="w-full"><Link to="/dashboard/packages">Go to My Packages</Link></Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Have a package promo code? Enter it below to unlock everything in this bundle instantly.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="PKG-XXXXXX" className="font-mono"
                    />
                    <Button onClick={redeem} disabled={redeeming}>
                      {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Ticket className="w-4 h-4 mr-1" /> Redeem</>}
                    </Button>
                  </div>
                  {!user && (
                    <p className="text-xs text-muted-foreground text-center">
                      <Link to="/login" className="text-primary underline">Sign in</Link> to redeem your code.
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground text-center">
                    Don't have a code? <a href="https://wa.me/" className="text-primary underline">Contact us on WhatsApp</a>.
                  </p>
                </div>
              )}
            </CardContent></Card>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
