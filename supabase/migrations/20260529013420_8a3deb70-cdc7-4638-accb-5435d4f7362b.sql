CREATE POLICY "Haulers can claim open requests"
ON public.haul_requests
FOR UPDATE
TO authenticated
USING (status = 'open'::haul_status AND public.has_role(auth.uid(), 'hauler'::app_role))
WITH CHECK (hauler_id = auth.uid() AND status = 'claimed'::haul_status);