import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, Apple, Terminal, ArrowRight } from 'lucide-react';
import { formatPrice, calculateDiscountPercentage } from '@/lib/price-utils';

interface SoftwareCardProps {
  product: {
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
  platforms: string[];
}

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  android: Smartphone,
  windows: Monitor,
  mac: Apple,
  linux: Terminal,
};

const platformLabels: Record<string, string> = {
  android: 'Android',
  windows: 'Windows',
  mac: 'Mac',
  linux: 'Linux',
};

export const SoftwareCard = ({ product, platforms }: SoftwareCardProps) => {
  const hasDiscount = product.discount_price && product.discount_price < (product.price || 0);
  const discountPercentage = hasDiscount 
    ? calculateDiscountPercentage(product.price || 0, product.discount_price!)
    : 0;

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/30">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        {product.thumbnail_url ? (
          <img
            src={product.thumbnail_url}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20">
            <Monitor className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Category Badge */}
        {product.category && (
          <Badge className="absolute top-3 left-3" variant="secondary">
            {product.category}
          </Badge>
        )}
        
        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <Badge className="absolute top-3 right-3" variant="destructive">
            {discountPercentage}% OFF
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
          {product.title}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {product.short_description || product.description || 'No description available'}
        </p>

        {/* Platforms */}
        <div className="flex items-center gap-2 mb-3">
          {platforms.map(platform => {
            const Icon = platformIcons[platform] || Monitor;
            return (
              <div
                key={platform}
                className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded"
                title={platformLabels[platform]}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden sm:inline">{platformLabels[platform]}</span>
              </div>
            );
          })}
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          {product.is_free ? (
            <Badge variant="secondary" className="text-sm">Free</Badge>
          ) : (
            <>
              <span className="font-bold text-lg text-primary">
                {formatPrice(product.discount_price || product.price)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full group/btn">
          <Link to={`/software/${product.id}`}>
            View Details
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
