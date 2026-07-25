import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { MessageThread } from '@/components/messaging/MessageThread';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, Inbox } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ConversationRow {
  id: string;
  student_id: string;
  student_name: string | null;
  student_email: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  last_sender_role: string | null;
  admin_last_read_at: string;
  unread_from_student: number;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}

export default function AdminMessages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // Deep-link: /admin/messages?student=<uuid> opens/creates that thread.
  useEffect(() => {
    const studentParam = searchParams.get('student');
    if (!studentParam) return;
    (async () => {
      const { data, error } = await supabase.rpc('admin_get_or_create_conversation', {
        _student_id: studentParam,
      });
      if (!error && data) setSelectedId(data as string);
      searchParams.delete('student');
      setSearchParams(searchParams, { replace: true });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const refresh = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_list_conversations');
    if (!error && data) setConversations(data as ConversationRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel('admin-messages-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refresh]);

  const filtered = useMemo(() => {
    if (!query.trim()) return conversations;
    const q = query.toLowerCase();
    return conversations.filter(
      (c) =>
        (c.student_name ?? '').toLowerCase().includes(q) ||
        (c.student_email ?? '').toLowerCase().includes(q) ||
        (c.last_message_preview ?? '').toLowerCase().includes(q),
    );
  }, [conversations, query]);

  const selected = filtered.find((c) => c.id === selectedId) ?? null;

  return (
    <AdminLayout title="Messages" subtitle="Support conversations with students">
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 h-[calc(100vh-9rem)]">
        {/* List */}
        <div className={cn(
          'flex flex-col rounded-xl border border-border bg-card overflow-hidden',
          selected ? 'hidden lg:flex' : 'flex',
        )}>
          <div className="p-3 border-b border-border shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search students…"
                className="pl-8 h-9"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 p-10 text-center text-sm text-muted-foreground">
                <Inbox className="w-8 h-8 opacity-50" />
                No conversations yet.
              </div>
            ) : (
              filtered.map((c) => {
                const isActive = c.id === selectedId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      'w-full text-left px-3 py-3 border-b border-border/60 hover:bg-muted/60 transition-colors flex gap-3',
                      isActive && 'bg-muted',
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                      {(c.student_name || c.student_email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm truncate">
                          {c.student_name || c.student_email || 'Student'}
                        </p>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {timeAgo(c.last_message_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground truncate flex-1">
                          {c.last_sender_role === 'admin' ? 'You: ' : ''}
                          {c.last_message_preview || 'New conversation'}
                        </p>
                        {c.unread_from_student > 0 && (
                          <Badge className="h-5 min-w-5 px-1.5 text-[10px]">
                            {c.unread_from_student}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Thread */}
        <div className={cn('min-h-0', !selected && 'hidden lg:block')}>
          {selected ? (
            <MessageThread
              conversationId={selected.id}
              viewerRole="admin"
              headerRight={
                <div className="flex items-center justify-between w-full">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {selected.student_name || 'Student'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {selected.student_email}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="lg:hidden text-xs text-muted-foreground hover:text-foreground"
                  >
                    ← Back
                  </button>
                </div>
              }
            />
          ) : (
            <div className="hidden lg:flex h-full items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              Select a conversation to start replying
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
