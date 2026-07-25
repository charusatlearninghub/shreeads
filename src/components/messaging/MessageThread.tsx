import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Paperclip, Send, X, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ViewerRole = 'student' | 'admin';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: 'student' | 'admin';
  body: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
  attachment_mime: string | null;
  created_at: string;
}

interface MessageThreadProps {
  conversationId: string;
  viewerRole: ViewerRole;
  headerRight?: React.ReactNode;
  emptyState?: React.ReactNode;
}

const MAX_FILE_MB = 20;

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function humanSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function AttachmentBubble({ path, name, size, mime }: { path: string; name: string | null; size: number | null; mime: string | null }) {
  const [url, setUrl] = useState<string | null>(null);
  const isImage = mime?.startsWith('image/');

  useEffect(() => {
    let cancelled = false;
    supabase.storage.from('message-attachments').createSignedUrl(path, 60 * 60).then(({ data }) => {
      if (!cancelled && data?.signedUrl) setUrl(data.signedUrl);
    });
    return () => { cancelled = true; };
  }, [path]);

  if (isImage && url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-2">
        <img src={url} alt={name ?? 'attachment'} className="rounded-lg max-h-64 object-cover border border-border" />
      </a>
    );
  }

  return (
    <a
      href={url ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm hover:bg-background transition-colors"
    >
      <FileText className="w-4 h-4 shrink-0 opacity-70" />
      <span className="flex-1 truncate">{name ?? 'Attachment'}</span>
      {size ? <span className="text-xs opacity-70">{humanSize(size)}</span> : null}
      <Download className="w-4 h-4 opacity-70" />
    </a>
  );
}

export function MessageThread({ conversationId, viewerRole, headerRight, emptyState }: MessageThreadProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const markRead = useCallback(async () => {
    if (!conversationId) return;
    await supabase.rpc('mark_conversation_read', { _conversation_id: conversationId });
  }, [conversationId]);

  // Load + realtime
  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (!cancelled) {
        if (error) toast.error('Failed to load messages');
        setMessages((data as Message[]) ?? []);
        setLoading(false);
        markRead();
      }
    })();

    const channel = supabase
      .channel(`thread-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => {
            const next = payload.new as Message;
            if (prev.some((m) => m.id === next.id)) return prev;
            return [...prev, next];
          });
          markRead();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [conversationId, markRead]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const canSend = useMemo(() => (body.trim().length > 0 || !!file) && !sending, [body, file, sending]);

  const handleSend = async () => {
    if (!user || !canSend) return;
    setSending(true);
    try {
      let attachment_path: string | null = null;
      let attachment_name: string | null = null;
      let attachment_size: number | null = null;
      let attachment_mime: string | null = null;

      if (file) {
        if (file.size > MAX_FILE_MB * 1024 * 1024) {
          toast.error(`File too large (max ${MAX_FILE_MB}MB)`);
          setSending(false);
          return;
        }
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const key = `${conversationId}/${Date.now()}_${safeName}`;
        const { error: upErr } = await supabase.storage
          .from('message-attachments')
          .upload(key, file, { contentType: file.type, upsert: false });
        if (upErr) {
          toast.error(`Upload failed: ${upErr.message}`);
          setSending(false);
          return;
        }
        attachment_path = key;
        attachment_name = file.name;
        attachment_size = file.size;
        attachment_mime = file.type || null;
      }

      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_role: viewerRole,
        body: body.trim() || null,
        attachment_path,
        attachment_name,
        attachment_size,
        attachment_mime,
      });

      if (error) {
        toast.error(`Send failed: ${error.message}`);
        return;
      }
      setBody('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 rounded-xl border border-border bg-card overflow-hidden">
      {headerRight ? (
        <div className="flex items-center justify-end gap-2 border-b border-border/70 px-4 py-2 shrink-0">
          {headerRight}
        </div>
      ) : null}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-sm text-muted-foreground">
            {emptyState ?? 'No messages yet. Say hello 👋'}
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_role === viewerRole;
            return (
              <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-3.5 py-2 shadow-sm',
                    mine
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md',
                  )}
                >
                  {!mine && (
                    <div className="text-[10px] uppercase tracking-wide opacity-70 mb-0.5">
                      {m.sender_role === 'admin' ? 'Support' : 'Student'}
                    </div>
                  )}
                  {m.body && <div className="whitespace-pre-wrap break-words text-sm">{m.body}</div>}
                  {m.attachment_path && (
                    <AttachmentBubble
                      path={m.attachment_path}
                      name={m.attachment_name}
                      size={m.attachment_size}
                      mime={m.attachment_mime}
                    />
                  )}
                  <div className={cn('mt-1 text-[10px]', mine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                    {formatTime(m.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border p-3 shrink-0 bg-card">
        {file && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-sm">
            <Paperclip className="w-4 h-4 opacity-70" />
            <span className="flex-1 truncate">{file.name}</span>
            <span className="text-xs opacity-70">{humanSize(file.size)}</span>
            <button
              onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              className="p-1 rounded hover:bg-background"
              aria-label="Remove attachment"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            aria-label="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Write a message…"
            rows={1}
            className="min-h-[44px] max-h-40 resize-none"
          />
          <Button type="button" onClick={handleSend} disabled={!canSend} aria-label="Send">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Enter to send · Shift+Enter for new line · Attachments up to {MAX_FILE_MB}MB
        </p>
      </div>
    </div>
  );
}
