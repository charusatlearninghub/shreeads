import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Package as PackageIcon, BookOpen, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Pkg {
  id: string; name: string; description: string | null;
  price: number; original_price: number; thumbnail_url: string | null;
}
interface ItemRow { package_id: string; item_type: "course" | "software" }

export const PackagesPreview = () => {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("packages")
        .select("id, name, description, price, original_price, thumbnail_url")
        .eq("is_active", true).order("price").limit(3);
      const ids = (data || []).map(p => p.id);
      let it: ItemRow[] = [];
      if (ids.length) {
        const { data: items } = await supabase.from("package_items")
          .select("package_id, item_type").in("package_id", ids);
        it = (items || []) as ItemRow[];
      }
      setPackages((data || []) as Pkg[]);
      setItems(it);
      setLoading(false);
    })();
  }, []);

  if (loading || packages.length === 0) return null;

  return (
    <section className="py-20 lg:py-24 relative">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
              <PackageIcon className="w-4 h-4" /> Bundles
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
              Learning <span className="gradient-text">Packages</span>
            </h2>
            <p className="text-muted-foreground max-w-xl">Bundle courses and software at a discount.</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/packages">View All Packages <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((p, i) => {
            const c = items.filter(x => x.package_id === p.id && x.item_type === "course").length;
            const s = items.filter(x => x.package_id === p.id && x.item_type === "software").length;
            const save = Number(p.original_price) - Number(p.price);
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Link to={`/packages/${p.id}`} className="block group">
                  <div className="course-card h-full">
                    {p.thumbnail_url ? (
                      <div className="aspect-video bg-secondary overflow-hidden">
                        <img src={p.thumbnail_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                        <PackageIcon className="w-12 h-12 text-primary/60" />
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="font-display text-lg font-bold mb-2 group-hover:text-primary transition-colors">{p.name}</h3>
                      {p.description && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{p.description}</p>}
                      <div className="flex gap-3 text-xs text-muted-foreground mb-4">
                        <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {c} courses</span>
                        <span className="flex items-center gap-1"><Box className="w-3.5 h-3.5" /> {s} software</span>
                      </div>
                      <div className="flex items-baseline gap-2 pt-4 border-t border-border/50">
                        <span className="text-xl font-bold">₹{Number(p.price).toLocaleString("en-IN")}</span>
                        {save > 0 && (
                          <>
                            <span className="text-xs text-muted-foreground line-through">₹{Number(p.original_price).toLocaleString("en-IN")}</span>
                            <Badge variant="secondary" className="ml-auto text-xs">Save ₹{save.toLocaleString("en-IN")}</Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
