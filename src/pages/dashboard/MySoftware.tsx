import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Package, Download, Monitor, Smartphone, Apple, Terminal, 
  ExternalLink, Clock, RefreshCw 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';

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

const MySoftware = () => {
  const { user } = useAuth();

  // Fetch user's purchased software
  const { data: purchases, isLoading } = useQuery({
    queryKey: ['my-software-purchases', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('software_purchases')
        .select(`
          *,
          product:software_products(*)
        `)
        .eq('user_id', user!.id)
        .order('purchased_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch latest versions for each product
  const { data: versions } = useQuery({
    queryKey: ['my-software-versions', purchases?.map(p => p.product_id)],
    queryFn: async () => {
      if (!purchases?.length) return [];
      const productIds = purchases.map(p => p.product_id);
      
      const { data, error } = await supabase
        .from('software_versions')
        .select('*')
        .in('product_id', productIds)
        .eq('is_latest', true);
      
      if (error) throw error;
      return data;
    },
    enabled: !!purchases?.length,
  });

  const handleDownload = async (versionId: string, productId: string, purchaseId: string) => {
    try {
      // Log download
      await supabase.from('software_downloads').insert({
        user_id: user!.id,
        purchase_id: purchaseId,
        version_id: versionId,
      });

      // Get signed URL
      const { data, error } = await supabase.functions.invoke('get-software-download', {
        body: { versionId, productId },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      window.open(data.url, '_blank');
      toast.success('Download started!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to start download');
    }
  };

  return (
    <DashboardLayout 
      title="My Software" 
      subtitle="Manage and download your purchased software"
    >
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : purchases?.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No software yet</h3>
            <p className="text-muted-foreground mb-6">
              Browse our marketplace to find apps and software
            </p>
            <Button asChild>
              <Link to="/software">Browse Software</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2" data-sensitive="true">
          {purchases?.map(purchase => {
            const product = purchase.product as any;
            const productVersions = versions?.filter(v => v.product_id === purchase.product_id) || [];
            
            return (
              <Card key={purchase.id} className="overflow-hidden">
                <div className="flex">
                  {/* Thumbnail */}
                  <div className="w-32 h-32 bg-muted flex-shrink-0">
                    {product?.thumbnail_url ? (
                      <img
                        src={product.thumbnail_url}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20">
                        <Package className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold line-clamp-1">{product?.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          Purchased {format(new Date(purchase.purchased_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/software/${purchase.product_id}`}>
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>

                    {/* Available platforms */}
                    <div className="flex gap-2 mb-3">
                      {productVersions.map(version => {
                        const Icon = platformIcons[version.platform] || Monitor;
                        return (
                          <Badge key={version.id} variant="outline" className="text-xs">
                            <Icon className="w-3 h-3 mr-1" />
                            {platformLabels[version.platform]}
                          </Badge>
                        );
                      })}
                    </div>

                    {/* Download buttons */}
                    <div className="flex flex-wrap gap-2">
                      {productVersions.map(version => {
                        const Icon = platformIcons[version.platform] || Monitor;
                        return (
                          <Button
                            key={version.id}
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDownload(version.id, purchase.product_id, purchase.id)}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            {platformLabels[version.platform]}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Update notification (example) */}
                {productVersions.some(v => v.is_latest) && (
                  <div className="bg-primary/5 border-t border-border px-4 py-2 flex items-center gap-2 text-sm">
                    <RefreshCw className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">
                      Latest version: <span className="font-medium text-foreground">
                        v{productVersions.find(v => v.is_latest)?.version_number}
                      </span>
                    </span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default MySoftware;
