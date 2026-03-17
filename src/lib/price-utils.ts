/**
 * Format price in Indian Rupees
 */
export const formatPrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined || price === 0) {
    return 'Free';
  }
  return `₹${price.toLocaleString('en-IN')}`;
};

/**
 * Calculate discount percentage
 */
export const calculateDiscount = (
  originalPrice: number | null | undefined,
  discountPrice: number | null | undefined
): number => {
  if (!originalPrice || !discountPrice || originalPrice <= 0) return 0;
  if (discountPrice >= originalPrice) return 0;
  return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
};

/**
 * Alias for calculateDiscount
 */
export const calculateDiscountPercentage = calculateDiscount;

/**
 * Get the display price (discount price if available, otherwise original)
 */
export const getDisplayPrice = (
  price: number | null | undefined,
  discountPrice: number | null | undefined,
  isFree: boolean | null | undefined
): { current: string; original?: string; discount?: number } => {
  if (isFree) {
    return { current: 'Free' };
  }

  if (!price || price === 0) {
    return { current: 'Free' };
  }

  if (discountPrice && discountPrice < price) {
    return {
      current: formatPrice(discountPrice),
      original: formatPrice(price),
      discount: calculateDiscount(price, discountPrice),
    };
  }

  return { current: formatPrice(price) };
};
