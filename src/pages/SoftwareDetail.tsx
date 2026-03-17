import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Monitor, Smartphone, Apple, Terminal, Download, Check, 
  Shield, RefreshCw, Clock, Package, ArrowLeft, Loader2,
  MessageCircle
} from 'lucide-react';
import { formatPrice, calculateDiscountPercentage } from '@/lib/price-utils';
import { toast } from 'sonner';
import { format } from 'date-fns';

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  android: Smartphone,
  windows: Monitor,
  mac: Apple,
  linux: Terminal,
};

const platformLabels: Record<string, string> = {
  android: 'Android',
  windows: 'Windows',
  mac: 'macOS',
  linux: 'Linux',
};

const SoftwareDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [promoCode, setPromoCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Fetch product details
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['software-product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('software_products')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  // Fetch versions
  const { data: versions } = useQuery({
    queryKey: ['software-versions', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('software_versions')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });

  // Check if user has purchased
  const { data: purchase } = useQuery({
    queryKey: ['software-purchase', productId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('software_purchases')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!productId && !!user,
  });

  const isFree = product?.is_free || (product?.price != null && product.price === 0);
  const hasPurchased = !!purchase || !!isFree;

  // Group versions by platform
  const versionsByPlatform = versions?.reduce((acc, version) => {
    if (!acc[version.platform]) acc[version.platform] = [];
    acc[version.platform].push(version);
    return acc;
  }, {} as Record<string, typeof versions>);

  const latestVersions = versions?.filter(v => v.is_latest) || [];

  // Redeem promo code
  const handleRedeemPromo = async () => {
    if (!user) {
      toast.error('Please login to redeem a promo code');
      navigate('/login');
      return;
    }

    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    setIsRedeeming(true);
    try {
      const { data, error } = await supabase.functions.invoke('redeem-software-promo', {
        body: { code: promoCode.trim().toUpperCase(), productId },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success('Promo code redeemed successfully!');
      setPromoCode('');
      queryClient.invalidateQueries({ queryKey: ['software-purchase', productId] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to redeem promo code');
    } finally {
      setIsRedeeming(false);
    }
  };

  // Download handler — allow access if purchased or product is free (price === 0 or is_free)
  const handleDownload = async (versionId: string, fileUrl: string) => {
    if (!user) {
      toast.error('Please log in to download');
      return;
    }
    if (!hasPurchased) {
      toast.error('You need to purchase this software first');
      return;
    }

    try {
      // Free software: skip edge function and open direct file URL
      if (isFree) {
        window.open(fileUrl, '_blank');
        toast.success('Download started!');
        return;
      }

      // Log download only when there is a purchase record (paid software)
      if (purchase) {
        await supabase.from('software_downloads').insert({
          user_id: user.id,
          purchase_id: purchase.id,
          version_id: versionId,
        });
      }

      // Get signed URL
      const { data, error } = await supabase.functions.invoke('get-software-download', {
        body: { versionId, productId },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Open download link
      window.open(data.url, '_blank');
      toast.success('Download started!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to start download');
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  if (productLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Software not found</h1>
          <Button onClick={() => navigate('/software')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Software
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const hasDiscount = product.discount_price && product.discount_price < (product.price || 0);
  const discountPercentage = hasDiscount 
    ? calculateDiscountPercentage(product.price || 0, product.discount_price!)
    : 0;

  const whatsappMessage = `Hi, I am interested in the software: "${product.title}". Please share more details about purchasing.`;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 pt-24 lg:pt-28 pb-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate('/software')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Software
        </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8" data-sensitive="true">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
              {product.thumbnail_url ? (
                <img
                  src={product.thumbnail_url}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20">
                  <Package className="w-24 h-24 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Title & Description */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                {product.category && (
                  <Badge variant="secondary">{product.category}</Badge>
                )}
                {latestVersions.map(v => {
                  const Icon = platformIcons[v.platform] || Monitor;
                  return (
                    <Badge key={v.id} variant="outline" className="flex items-center gap-1">
                      <Icon className="w-3 h-3" />
                      {platformLabels[v.platform]}
                    </Badge>
                  );
                })}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-4">{product.title}</h1>
              <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
            </div>

            {/* Downloads Section (if purchased) */}
            {hasPurchased && versions && versions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5" /> Downloads
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue={latestVersions[0]?.platform || 'windows'}>
                    <TabsList className="mb-4">
                      {Object.keys(versionsByPlatform || {}).map(platform => {
                        const Icon = platformIcons[platform] || Monitor;
                        return (
                          <TabsTrigger key={platform} value={platform} className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {platformLabels[platform]}
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>

                    {Object.entries(versionsByPlatform || {}).map(([platform, platformVersions]) => (
                      <TabsContent key={platform} value={platform} className="space-y-3">
                        {platformVersions?.map(version => (
                          <div
                            key={version.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-secondary/50 rounded-lg"
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">v{version.version_number}</span>
                                {version.is_latest && (
                                  <Badge variant="default" className="text-xs">Latest</Badge>
                                )}
                                <Badge variant="outline" className="text-xs uppercase">
                                  {version.file_type}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{formatFileSize(version.file_size_bytes)}</span>
                                <span>{format(new Date(version.created_at), 'MMM d, yyyy')}</span>
                              </div>
                              {version.release_notes && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  {version.release_notes}
                                </p>
                              )}
                            </div>
                            <Button onClick={() => handleDownload(version.id, version.file_url)}>
                              <Download className="w-4 h-4 mr-2" /> Download
                            </Button>
                          </div>
                        ))}
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Purchase Card */}
            <Card className="sticky top-24">
              <CardContent className="p-6">
                {/* Price */}
                <div className="mb-6">
                  {product.is_free ? (
                    <Badge variant="secondary" className="text-lg px-4 py-1">Free</Badge>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold text-primary">
                        {formatPrice(product.discount_price || product.price)}
                      </span>
                      {hasDiscount && (
                        <>
                          <span className="text-lg text-muted-foreground line-through">
                            {formatPrice(product.price)}
                          </span>
                          <Badge variant="destructive">{discountPercentage}% OFF</Badge>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {hasPurchased ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-500">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">You own this software</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Scroll down to download the latest version for your platform.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Promo Code Input */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Have a promo code?</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter code"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          className="uppercase"
                        />
                        <Button 
                          onClick={handleRedeemPromo} 
                          disabled={isRedeeming || !promoCode.trim()}
                        >
                          {isRedeeming ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Redeem'
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="relative flex items-center justify-center my-4">
                      <div className="border-t border-border flex-1"></div>
                      <span className="px-3 text-xs text-muted-foreground bg-card">or</span>
                      <div className="border-t border-border flex-1"></div>
                    </div>

                    {/* WhatsApp Button */}
                    <Button 
                      className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white"
                      size="lg"
                      asChild
                    >
                      <a 
                        href={`https://wa.me/919265106657?text=${encodeURIComponent(whatsappMessage)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        WhatsApp to Purchase
                      </a>
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Contact admin for promo codes or direct purchase
                    </p>

                    {product.is_free && (
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={handleRedeemPromo}
                        disabled={!user}
                      >
                        {user ? 'Get Free Software' : 'Login to Download'}
                      </Button>
                    )}
                  </div>
                )}

                {/* Features */}
                <div className="mt-6 pt-6 border-t border-border space-y-3">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4 text-green-500" />
                    Secure & verified download
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <RefreshCw className="w-4 h-4 text-blue-500" />
                    Free lifetime updates
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 text-orange-500" />
                    Instant access after purchase
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SoftwareDetail;
