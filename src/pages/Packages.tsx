import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Package as PackageIcon, BookOpen, Box, Check, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SeoHead } from "@/components/common/SeoHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAffiliateRefCapture } from "@/hooks/useAffiliateRef";

interface Pkg {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number;
  thumbnail_url: string | null;
  affiliate_commission_percent: number;
}
interface ItemRow { package_id: string; item_type: "course" | "software"; item_id: string }

export default function Packages() {
  useAffiliateRefCapture();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);

  useEffect(() => { void load(); }, []);

  async function load() {
    const [pkgRes, itemRes] = await Promise.all([
      supabase.from("packages").select("id, name, description, price, original_price, thumbnail_url, affiliate_commission_percent")
        .eq("is_active", true).order("price"),
      supabase.from("package_items").select("package_id, item_type, item_id"),
    ]);
    setPackages((pkgRes.data || []) as Pkg[]);
    setItems((itemRes.data || []) as ItemRow[]);
    setLoading(false);
  }

  function counts(id: string) {
    return {
      courses: items.filter(i => i.package_id === id && i.item_type === "course").length,
      software: items.filter(i => i.package_id === id && i.item_type === "software").length,
    };
  }

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="Learning Packages & Bundles – ShreeAds"
        description="Save more with curated learning bundles combining multiple courses and software tools at a discounted price."
      />
      <Header />
      <main className="pt-32 md:pt-28 pb-20">
        <section className="container mx-auto px-4">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <PackageIcon className="w-4 h-4" /> Bundles
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">
              Learning <span className="gradient-text">Packages</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Get more for less — bundle multiple courses and software tools and unlock everything in one purchase.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : packages.length === 0 ? (
            <Card><CardContent className="py-16 text-center">
              <PackageIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No packages available right now. Check back soon.</p>
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((p, i) => {
                const c = counts(p.id);
                const save = Number(p.original_price) - Number(p.price);
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                    <Card className="overflow-hidden h-full flex flex-col">
                      {p.thumbnail_url ? (
                        <div className="aspect-video bg-secondary overflow-hidden">
                          <img src={p.thumbnail_url} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                          <PackageIcon className="w-12 h-12 text-primary/60" />
                        </div>
                      )}
                      <CardContent className="p-5 flex-1 flex flex-col">
                        <h3 className="font-display text-xl font-bold mb-2">{p.name}</h3>
                        {p.description && <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{p.description}</p>}
                        <ul className="space-y-1.5 mb-4 text-sm">
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /><BookOpen className="w-4 h-4 text-muted-foreground" /> {c.courses} course{c.courses !== 1 ? "s" : ""}</li>
                          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /><Box className="w-4 h-4 text-muted-foreground" /> {c.software} software tool{c.software !== 1 ? "s" : ""}</li>
                        </ul>
                        <div className="flex items-baseline gap-2 mb-4 mt-auto">
                          <span className="text-2xl font-bold">₹{Number(p.price).toLocaleString("en-IN")}</span>
                          {save > 0 && (
                            <>
                              <span className="text-sm text-muted-foreground line-through">₹{Number(p.original_price).toLocaleString("en-IN")}</span>
                              <Badge variant="secondary" className="ml-auto">Save ₹{save.toLocaleString("en-IN")}</Badge>
                            </>
                          )}
                        </div>
                        <Button asChild className="w-full">
                          <Link to={`/packages/${p.id}`}>Buy Package</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Affiliate CTA */}
          <div className="mt-16 rounded-2xl bg-gradient-to-r from-primary/15 to-purple-500/15 border border-border p-8 text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2">Earn by Promoting</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-5">
              Join our affiliate program and earn commission for every package you sell.
            </p>
            <Button asChild size="lg"><Link to="/dashboard/affiliate">Become an Affiliate</Link></Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
