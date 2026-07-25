import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { MessageThread } from '@/components/messaging/MessageThread';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Messages() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc('get_or_create_my_conversation');
      if (error) {
        toast.error(`Could not open messages: ${error.message}`);
      } else {
        setConversationId(data as string);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <DashboardLayout
      title="Messages"
      subtitle="Chat directly with the SHREE ADS support team"
    >
      <div className="h-[calc(100vh-14rem)] max-w-3xl mx-auto">
        {loading || !conversationId ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <MessageThread
            conversationId={conversationId}
            viewerRole="student"
            emptyState="Send us a message — our team usually replies within a few hours."
          />
        )}
      </div>
    </DashboardLayout>
  );
}
