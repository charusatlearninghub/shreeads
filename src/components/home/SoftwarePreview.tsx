import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Package, Monitor, Smartphone, Apple, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, calculateDiscountPercentage } from "@/lib/price-utils";

interface SoftwareProduct {
  id: string;
  title: string;
  short_description: string | null;
  category: string | null;
  thumbnail_url: string | null;
  price: number | null;
  discount_price: number | null;
  is_free: boolean | null;
  platforms: string[];
}

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  android: Smartphone,
  windows: Monitor,
  mac: Apple,
  linux: Terminal,
};

export const SoftwarePreview = () => {
  const [products, setProducts] = useState<SoftwareProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data: productsData, error } = await supabase
          .from('software_products')
          .select('id, title, short_description, category, thumbnail_url, price, discount_price, is_free')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(4);

        if (error) throw error;

        // Get platforms for each product
        const { data: versions } = await supabase
          .from('software_versions')
          .select('product_id, platform')
          .eq('is_latest', true);

        const productsWithPlatforms = (productsData || []).map(product => {
          const productPlatforms = versions
            ?.filter(v => v.product_id === product.id)
            .map(v => v.platform) || [];
          return {
            ...product,
            platforms: [...new Set(productPlatforms)],
          };
        });

        setProducts(productsWithPlatforms);
      } catch (error) {
        console.error('Error fetching software:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (isLoading) {
    return (
      <section className="py-20 lg:py-32 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null; // Don't show section if no software
  }

  return (
    <section className="py-20 lg:py-32 bg-secondary/30 relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12"
        >
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-500 text-sm font-medium mb-4">
              Software & Apps
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Premium <span className="gradient-text">Software</span>
            </h2>
            <p className="text-muted-foreground max-w-xl">
              Discover our collection of mobile apps and desktop software for Android, Windows, Mac & Linux.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/software">
              Browse All Software
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {products.map((product, index) => {
            const hasDiscount = product.discount_price && product.discount_price < (product.price || 0);
            const discountPercent = hasDiscount 
              ? calculateDiscountPercentage(product.price || 0, product.discount_price!)
              : 0;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link to={`/software/${product.id}`} className="block group">
                  <div className="course-card h-full">
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-secondary overflow-hidden">
                      {product.thumbnail_url ? (
                        <img 
                          src={product.thumbnail_url} 
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-primary/20 flex items-center justify-center">
                          <Package className="w-12 h-12 text-primary/40" />
                        </div>
                      )}
                      {hasDiscount && (
                        <div className="absolute top-3 right-3">
                          <Badge variant="destructive">{discountPercent}% OFF</Badge>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        {product.category && (
                          <Badge variant="secondary" className="text-xs">
                            {product.category}
                          </Badge>
                        )}
                        {/* Platform icons */}
                        <div className="flex gap-1 ml-auto">
                          {product.platforms.map(platform => {
                            const Icon = platformIcons[platform] || Monitor;
                            return (
                              <Icon key={platform} className="w-4 h-4 text-muted-foreground" />
                            );
                          })}
                        </div>
                      </div>
                      <h3 className="font-display text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {product.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {product.short_description}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        {product.is_free ? (
                          <Badge variant="secondary">Free</Badge>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary">
                              {formatPrice(product.discount_price || product.price)}
                            </span>
                            {hasDiscount && (
                              <span className="text-sm text-muted-foreground line-through">
                                {formatPrice(product.price)}
                              </span>
                            )}
                          </div>
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
