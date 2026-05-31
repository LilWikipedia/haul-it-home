ALTER TABLE public.haul_requests
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS platform_fee numeric,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text;

CREATE INDEX IF NOT EXISTS haul_requests_payment_status_idx
  ON public.haul_requests (payment_status);

CREATE INDEX IF NOT EXISTS haul_requests_stripe_session_idx
  ON public.haul_requests (stripe_checkout_session_id);