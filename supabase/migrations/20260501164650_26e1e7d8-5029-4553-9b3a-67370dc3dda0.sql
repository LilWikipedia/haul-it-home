
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('user', 'hauler');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- RLS for user_roles
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Vehicles table (for haulers)
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('truck', 'truck_and_trailer')),
  description TEXT DEFAULT '',
  capacity TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own vehicles" ON public.vehicles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vehicles" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vehicles" ON public.vehicles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Anyone can read hauler vehicles" ON public.vehicles FOR SELECT TO authenticated USING (true);

-- Haul request status enum
CREATE TYPE public.haul_status AS ENUM ('open', 'claimed', 'en_route_pickup', 'at_pickup', 'in_transit', 'delivered', 'cancelled');

-- Size category enum
CREATE TYPE public.size_category AS ENUM ('small', 'medium', 'large', 'extra_large');

-- Haul requests table
CREATE TABLE public.haul_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pickup_address TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  dropoff_address TEXT NOT NULL,
  dropoff_lat DOUBLE PRECISION,
  dropoff_lng DOUBLE PRECISION,
  item_description TEXT NOT NULL,
  size_category size_category NOT NULL DEFAULT 'medium',
  photo_url TEXT DEFAULT '',
  estimated_price NUMERIC(10,2),
  status haul_status NOT NULL DEFAULT 'open',
  hauler_id UUID REFERENCES auth.users(id),
  timeframe TEXT NOT NULL DEFAULT 'asap',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.haul_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own requests" ON public.haul_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Haulers can read open requests" ON public.haul_requests FOR SELECT TO authenticated USING (status = 'open' AND public.has_role(auth.uid(), 'hauler'));
CREATE POLICY "Haulers can read claimed requests" ON public.haul_requests FOR SELECT TO authenticated USING (hauler_id = auth.uid());
CREATE POLICY "Users can create requests" ON public.haul_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own requests" ON public.haul_requests FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Haulers can update claimed requests" ON public.haul_requests FOR UPDATE TO authenticated USING (hauler_id = auth.uid());

-- Hauler locations (for live tracking)
CREATE TABLE public.hauler_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hauler_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Haulers can upsert own location" ON public.hauler_locations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Haulers can update own location" ON public.hauler_locations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated can read locations" ON public.hauler_locations FOR SELECT TO authenticated USING (true);

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.haul_requests(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can read messages" ON public.messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.haul_requests hr WHERE hr.id = request_id AND (hr.user_id = auth.uid() OR hr.hauler_id = auth.uid()))
);
CREATE POLICY "Participants can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM public.haul_requests hr WHERE hr.id = request_id AND (hr.user_id = auth.uid() OR hr.hauler_id = auth.uid()))
);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.haul_requests(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (request_id, reviewer_id)
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read reviews" ON public.reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Participants can create reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = reviewer_id AND
  EXISTS (SELECT 1 FROM public.haul_requests hr WHERE hr.id = request_id AND hr.status = 'delivered' AND (hr.user_id = auth.uid() OR hr.hauler_id = auth.uid()))
);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.haul_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hauler_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
