import { Badge } from '@/components/ui/badge';
import { Clock, Percent } from 'lucide-react';
import { useActivePromotionForCourse } from '@/hooks/usePromotions';
import { formatPrice, calculateDiscountPercentage } from '@/lib/price-utils';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface CoursePriceDisplayProps {
  courseId: string;
  price: number | null;
  discountPrice: number | null;
  isFree: boolean | null;
  showPromotion?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const CoursePriceDisplay = ({
  courseId,
  price,
  discountPrice,
  isFree,
  showPromotion = true,
  size = 'md',
}: CoursePriceDisplayProps) => {
  const { data: activePromotion } = useActivePromotionForCourse(courseId);
  
  // If course is free
  if (isFree) {
    return (
      <Badge variant="secondary" className={size === 'lg' ? 'text-lg px-4 py-1' : ''}>
        Free
      </Badge>
    );
  }
  
  const basePrice = price || 0;
  let finalPrice = discountPrice || basePrice;
  let appliedDiscount = discountPrice ? calculateDiscountPercentage(basePrice, discountPrice) : 0;
  let promotionApplied = false;
  
  // Apply promotion discount if available and better than existing discount
  if (showPromotion && activePromotion) {
    const promotionPrice = basePrice * (1 - activePromotion.discount_percentage / 100);
    if (promotionPrice < finalPrice) {
      finalPrice = promotionPrice;
      appliedDiscount = activePromotion.discount_percentage;
      promotionApplied = true;
    }
  }
  
  const sizeClasses = {
    sm: {
      price: 'text-base font-semibold',
      original: 'text-xs',
      badge: 'text-xs',
    },
    md: {
      price: 'text-lg font-bold',
      original: 'text-sm',
      badge: 'text-xs',
    },
    lg: {
      price: 'text-2xl font-bold',
      original: 'text-base',
      badge: 'text-sm px-3',
    },
  };
  
  const classes = sizeClasses[size];
  
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`${classes.price} text-primary`}>
          {formatPrice(finalPrice)}
        </span>
        
        {appliedDiscount > 0 && (
          <>
            <span className={`${classes.original} text-muted-foreground line-through`}>
              {formatPrice(basePrice)}
            </span>
            <Badge variant="destructive" className={classes.badge}>
              <Percent className="w-3 h-3 mr-1" />
              {appliedDiscount}% OFF
            </Badge>
          </>
        )}
      </div>
      
      {/* Promotion timer */}
      {showPromotion && activePromotion && promotionApplied && (
        <div className="flex items-center gap-1.5 text-xs text-orange-500">
          <Clock className="w-3 h-3" />
          <span>
            {activePromotion.promotion_name} - Ends{' '}
            {formatDistanceToNow(parseISO(activePromotion.end_date), { addSuffix: true })}
          </span>
        </div>
      )}
    </div>
  );
};
