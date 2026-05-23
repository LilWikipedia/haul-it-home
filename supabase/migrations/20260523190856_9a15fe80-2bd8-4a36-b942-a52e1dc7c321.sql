
-- 1. Tighten user_roles: only allow self-insert of 'user' role; haulers must be promoted via admin/edge function later
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
CREATE POLICY "Users can self-assign user role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND role = 'user'::app_role);

-- Allow hauler self-assignment too but only if they have no existing role (one-time onboarding)
CREATE POLICY "Users can self-assign hauler role during onboarding"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role = 'hauler'::app_role
  AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid())
);

-- 2. Restrict hauler_locations: only the customer of an active request involving the hauler, or the hauler themselves
DROP POLICY IF EXISTS "Authenticated can read locations" ON public.hauler_locations;
CREATE POLICY "Participants can read hauler locations"
ON public.hauler_locations
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.haul_requests hr
    WHERE hr.hauler_id = hauler_locations.user_id
      AND hr.user_id = auth.uid()
      AND hr.status IN ('claimed','en_route_pickup','at_pickup','in_transit')
  )
);

-- 3. Realtime: restrict subscriptions on postgres_changes for messages/haul_requests/hauler_locations
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can receive realtime" ON realtime.messages;
CREATE POLICY "Authenticated can receive realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);

-- 4. Revoke EXECUTE on has_role from public/anon/authenticated (RLS still works since it's SECURITY DEFINER invoked internally is not the case — policies do require execute. Keep authenticated execute, just revoke from anon/public)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
