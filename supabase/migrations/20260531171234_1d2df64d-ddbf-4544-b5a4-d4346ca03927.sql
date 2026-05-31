ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_version text;