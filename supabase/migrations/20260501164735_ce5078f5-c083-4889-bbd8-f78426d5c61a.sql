
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, app_role) FROM public;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO authenticated;
