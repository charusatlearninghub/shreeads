import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RedeemResult {
  success: boolean;
  message: string;
  enrollment?: {
    id: string;
    course: {
      id: string;
      title: string;
    };
  };
}

export function usePromoCode() {
  const [isRedeeming, setIsRedeeming] = useState(false);
  const { toast } = useToast();

  const redeemPromoCode = async (code: string): Promise<RedeemResult | null> => {
    if (!code.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a promo code',
        variant: 'destructive',
      });
      return null;
    }

    setIsRedeeming(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Error',
          description: 'Please sign in to redeem a promo code',
          variant: 'destructive',
        });
        return null;
      }

      const response = await supabase.functions.invoke('redeem-promo-code', {
        body: { code: code.trim() },
      });

      // Handle edge function errors
      if (response.error) {
        // Try to parse the error message from the response
        const errorMessage = response.error.message || 'Failed to redeem promo code';
        throw new Error(errorMessage);
      }

      const result = response.data;

      // Check if response contains an error field
      if (result?.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
        return null;
      }

      if (result?.success) {
        toast({
          title: 'Success!',
          description: result.message,
        });
        return result as RedeemResult;
      } else {
        toast({
          title: 'Error',
          description: result?.message || 'Failed to redeem promo code',
          variant: 'destructive',
        });
        return null;
      }
    } catch (error: any) {
      const message = error.message || 'Failed to redeem promo code';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsRedeeming(false);
    }
  };

  return {
    redeemPromoCode,
    isRedeeming,
  };
}
