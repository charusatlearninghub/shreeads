-- RLS predicate helpers must be executable by the roles whose policies reference them.
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_enrolled(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_lesson_accessible(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_purchased_software(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_completed_course(uuid, uuid) TO authenticated;

-- Admin-facing RPCs called from the client (each re-checks is_admin() internally).
GRANT EXECUTE ON FUNCTION public.get_affiliate_network_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_sponsors(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_affiliate_sale_paid(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_software_downloads() TO authenticated;