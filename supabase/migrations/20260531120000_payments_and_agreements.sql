-- Add payment columns to haul_requests
ALTER TABLE public.haul_requests
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
  ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(10,2);

-- Add terms acceptance columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT,
  ADD COLUMN IF NOT EXISTS hauler_terms_accepted_at TIMESTAMPTZ;

-- Allow service role to update payment_status via webhook (bypasses RLS by default for service role)
-- Allow users to read payment_status on their own requests (already covered by existing policies)
-- Allow haulers to read payment_status on claimed requests (already covered by existing policies)

-- Enforce valid payment_status values
ALTER TABLE public.haul_requests
  ADD CONSTRAINT payment_status_check
  CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'refunded'));
