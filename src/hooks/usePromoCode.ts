import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getStoredAffiliateRef, clearStoredAffiliateRef } from '@/hooks/useAffiliateRef';

interface RedeemResult {
  success: boolean;
  message: string;
  enrollment?: {
    id: string;
    course?: {
      id: string;
      title: string;
    } | null;
    final_price_paid?: number;
    promo_price?: number;
    original_price?: number;
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
      // Use a fresh access token — a stale/expired one is the most common cause
      // of the generic "Edge Function returned a non-2xx status code" error.
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const refreshed = await supabase.auth.refreshSession();
        session = refreshed.data.session;
      }

      if (!session?.access_token) {
        toast({
          title: 'Please login again',
          description: 'Your session has expired. Sign in and retry your promo code.',
          variant: 'destructive',
        });
        return null;
      }

      const ref = getStoredAffiliateRef();

      // Direct fetch (instead of functions.invoke) so we can read the JSON body
      // of non-2xx responses and show the real backend message.
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/redeem-promo-code`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ code: code.trim(), referral_code: ref ?? null }),
        },
      );

      let result: any = null;
      try {
        result = await res.json();
      } catch {
        result = null;
      }

      if (!res.ok || !result?.success) {
        const message =
          result?.error ||
          result?.message ||
          'Unable to redeem promo code. Please try again.';

        if (res.status === 401) {
          await supabase.auth.refreshSession();
        }

        toast({
          title:
            res.status === 401
              ? 'Please login again'
              : res.status === 409
                ? 'Cannot redeem'
                : 'Error',
          description: message,
          variant: 'destructive',
        });
        return null;
      }

      if (import.meta.env.DEV && result.enrollment) {
        console.debug('[redeem-promo-code] enrollment snapshot', {
          final_price_paid: result.enrollment.final_price_paid,
          promo_price: result.enrollment.promo_price,
          original_price: result.enrollment.original_price,
        });
      }
      if (result.affiliate_credited) clearStoredAffiliateRef();
      toast({
        title: 'Success!',
        description: result.message,
      });
      return result as RedeemResult;

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
