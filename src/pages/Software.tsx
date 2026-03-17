import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SeoHead } from '@/components/common/SeoHead';
import { SoftwareCard } from '@/components/software/SoftwareCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Monitor, Smartphone, Apple, Terminal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type SoftwarePlatform = 'android' | 'windows' | 'mac' | 'linux';

type SoftwareProduct = {
  id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  thumbnail_url: string | null;
  category: string | null;
  price: number | null;
  discount_price: number | null;
  is_free: boolean | null;
};

const Software = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data: products, isLoading } = useQuery({
    queryKey: ['software-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('software_products')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SoftwareProduct[];
    },
  });

  const { data: versions } = useQuery({
    queryKey: ['software-versions-platforms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('software_versions')
        .select('product_id, platform')
        .eq('is_latest', true);
      
      if (error) throw error;
      return data;
    },
  });

  // Get unique categories
  const categories = [...new Set(products?.map(p => p.category).filter(Boolean) || [])];

  // Filter products
  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    const productPlatforms = versions?.filter(v => v.product_id === product.id).map(v => v.platform as SoftwarePlatform) || [];
    const matchesPlatform = platformFilter === 'all' || productPlatforms.includes(platformFilter as SoftwarePlatform);
    
    return matchesSearch && matchesCategory && matchesPlatform;
  });

  const platformIcons = {
    android: Smartphone,
    windows: Monitor,
    mac: Apple,
    linux: Terminal,
  };

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="Digital Marketing Tools & Software | ShreeAds"
        description="Discover digital marketing tools and software for Android, Windows, Mac and Linux. Get apps and desktop software to grow your marketing skills at ShreeAds."
      />
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-24 lg:pt-32 pb-12 lg:pb-16 bg-gradient-to-br from-primary/10 via-background to-purple-500/10">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Software <span className="text-primary">Marketplace</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Premium mobile apps and desktop software for Android, Windows, Mac & Linux
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search software..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Products */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-8">
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="android">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" /> Android
                  </div>
                </SelectItem>
                <SelectItem value="windows">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" /> Windows
                  </div>
                </SelectItem>
                <SelectItem value="mac">
                  <div className="flex items-center gap-2">
                    <Apple className="w-4 h-4" /> Mac
                  </div>
                </SelectItem>
                <SelectItem value="linux">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4" /> Linux
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))}
            </div>
          ) : filteredProducts?.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground">No software found</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts?.map(product => (
                <SoftwareCard 
                  key={product.id} 
                  product={product}
                  platforms={versions?.filter(v => v.product_id === product.id).map(v => v.platform) || []}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Software;
