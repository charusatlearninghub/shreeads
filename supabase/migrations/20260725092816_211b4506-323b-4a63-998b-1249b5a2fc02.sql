
-- =========================================================
-- CONVERSATIONS
-- =========================================================
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_message_preview text,
  last_sender_role text,
  student_last_read_at timestamptz NOT NULL DEFAULT now(),
  admin_last_read_at timestamptz NOT NULL DEFAULT 'epoch',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students see their own conversation"
  ON public.conversations FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "Students create their own conversation"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "Owner or admin can update conversation"
  ON public.conversations FOR UPDATE TO authenticated
  USING (student_id = auth.uid() OR public.is_admin())
  WITH CHECK (student_id = auth.uid() OR public.is_admin());

CREATE INDEX conversations_last_message_at_idx
  ON public.conversations (last_message_at DESC);

-- =========================================================
-- MESSAGES
-- =========================================================
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('student','admin')),
  body text,
  attachment_path text,
  attachment_name text,
  attachment_size integer,
  attachment_mime text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (body IS NOT NULL AND length(trim(body)) > 0)
    OR attachment_path IS NOT NULL
  )
);

GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read messages in own conversation or as admin"
  ON public.messages FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id AND c.student_id = auth.uid()
    )
  );

CREATE POLICY "Send messages in own conversation or as admin"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      (sender_role = 'admin' AND public.is_admin())
      OR (
        sender_role = 'student'
        AND EXISTS (
          SELECT 1 FROM public.conversations c
          WHERE c.id = messages.conversation_id AND c.student_id = auth.uid()
        )
      )
    )
  );

CREATE INDEX messages_conversation_created_idx
  ON public.messages (conversation_id, created_at);

-- =========================================================
-- REALTIME
-- =========================================================
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- =========================================================
-- TRIGGER: update conversation on new message
-- =========================================================
CREATE OR REPLACE FUNCTION public.messages_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
     SET last_message_at = NEW.created_at,
         last_message_preview = COALESCE(
           NULLIF(left(NEW.body, 140), ''),
           '📎 ' || COALESCE(NEW.attachment_name, 'Attachment')
         ),
         last_sender_role = NEW.sender_role,
         updated_at = now(),
         -- bump the sender's own read pointer
         student_last_read_at = CASE
           WHEN NEW.sender_role = 'student' THEN NEW.created_at
           ELSE student_last_read_at
         END,
         admin_last_read_at = CASE
           WHEN NEW.sender_role = 'admin' THEN NEW.created_at
           ELSE admin_last_read_at
         END
   WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER messages_after_insert_trg
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.messages_after_insert();

REVOKE EXECUTE ON FUNCTION public.messages_after_insert() FROM PUBLIC, anon, authenticated;

-- =========================================================
-- RPCs
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_or_create_my_conversation()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sign in required';
  END IF;

  SELECT id INTO v_id FROM public.conversations WHERE student_id = v_uid;
  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  INSERT INTO public.conversations (student_id) VALUES (v_uid)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_or_create_my_conversation() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_my_conversation() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_get_or_create_conversation(_student_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admins only';
  END IF;
  IF _student_id IS NULL THEN
    RAISE EXCEPTION 'student_id required';
  END IF;

  SELECT id INTO v_id FROM public.conversations WHERE student_id = _student_id;
  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  INSERT INTO public.conversations (student_id) VALUES (_student_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_get_or_create_conversation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_or_create_conversation(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_conversation_read(_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_admin boolean := public.is_admin();
  v_student uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sign in required';
  END IF;

  SELECT student_id INTO v_student FROM public.conversations WHERE id = _conversation_id;
  IF v_student IS NULL THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;

  IF v_is_admin THEN
    UPDATE public.conversations SET admin_last_read_at = now() WHERE id = _conversation_id;
  ELSIF v_student = v_uid THEN
    UPDATE public.conversations SET student_last_read_at = now() WHERE id = _conversation_id;
  ELSE
    RAISE EXCEPTION 'Access denied';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_conversation_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_unread_message_count()
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_count integer := 0;
BEGIN
  IF v_uid IS NULL THEN RETURN 0; END IF;

  IF public.is_admin() THEN
    SELECT COALESCE(SUM(
      (SELECT count(*) FROM public.messages m
        WHERE m.conversation_id = c.id
          AND m.sender_role = 'student'
          AND m.created_at > c.admin_last_read_at)
    ), 0)::int INTO v_count
    FROM public.conversations c;
  ELSE
    SELECT COALESCE((
      SELECT count(*) FROM public.messages m
       JOIN public.conversations c ON c.id = m.conversation_id
      WHERE c.student_id = v_uid
        AND m.sender_role = 'admin'
        AND m.created_at > c.student_last_read_at
    ), 0)::int INTO v_count;
  END IF;

  RETURN v_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_unread_message_count() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_unread_message_count() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_conversations()
RETURNS TABLE(
  id uuid,
  student_id uuid,
  student_name text,
  student_email text,
  last_message_at timestamptz,
  last_message_preview text,
  last_sender_role text,
  admin_last_read_at timestamptz,
  unread_from_student integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admins only';
  END IF;

  RETURN QUERY
  SELECT c.id, c.student_id,
         COALESCE(p.full_name, p.email) AS student_name,
         p.email AS student_email,
         c.last_message_at, c.last_message_preview, c.last_sender_role,
         c.admin_last_read_at,
         (SELECT count(*)::int FROM public.messages m
           WHERE m.conversation_id = c.id
             AND m.sender_role = 'student'
             AND m.created_at > c.admin_last_read_at) AS unread_from_student
    FROM public.conversations c
    LEFT JOIN public.profiles p ON p.id = c.student_id
   ORDER BY c.last_message_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_conversations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_conversations() TO authenticated;

-- =========================================================
-- STORAGE POLICIES: message-attachments (private)
-- Path convention: {conversation_id}/{filename}
-- =========================================================
CREATE POLICY "Read message attachments (owner or admin)"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'message-attachments'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id::text = split_part(name, '/', 1)
          AND c.student_id = auth.uid()
      )
    )
  );

CREATE POLICY "Upload message attachments (owner or admin)"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'message-attachments'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id::text = split_part(name, '/', 1)
          AND c.student_id = auth.uid()
      )
    )
  );
