import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePlatformSetting(key: string, defaultValue: string = '') {
  return useQuery({
    queryKey: ['platform-setting', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings' as any)
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (error || !data) return defaultValue;
      // value is stored as jsonb string like '"0.06"'
      const raw = (data as any).value;
      return typeof raw === 'string' ? raw : String(raw);
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function useWatermarkOpacity() {
  const { data: bgOpacity } = usePlatformSetting('watermark_opacity', '0.06');
  const { data: centerOpacity } = usePlatformSetting('watermark_center_opacity', '0.18');

  return {
    bgOpacity: parseFloat(bgOpacity || '0.06'),
    centerOpacity: parseFloat(centerOpacity || '0.18'),
  };
}
