
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create asset category enum
CREATE TYPE public.asset_category AS ENUM ('cash', 'real_estate', 'jewelry', 'valuables', 'other');

-- Create heir relationship enum
CREATE TYPE public.heir_relationship AS ENUM (
  'son', 'daughter', 'father', 'mother', 'husband', 'wife',
  'full_brother', 'full_sister', 'paternal_brother', 'paternal_sister',
  'maternal_brother', 'maternal_sister', 'grandfather', 'grandmother',
  'grandson', 'granddaughter'
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);

-- User preferences table (language and currency as separate columns)
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  language TEXT NOT NULL DEFAULT 'en',
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Assets table
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category asset_category NOT NULL DEFAULT 'other',
  value NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Heirs table
CREATE TABLE public.heirs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  relationship heir_relationship NOT NULL,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Calculations table
CREATE TABLE public.calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Calculation',
  total_estate NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL,
  awl_applied BOOLEAN NOT NULL DEFAULT false,
  radd_applied BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Calculation heirs (per-heir breakdown)
CREATE TABLE public.calculation_heirs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calculation_id UUID REFERENCES public.calculations(id) ON DELETE CASCADE NOT NULL,
  heir_id UUID REFERENCES public.heirs(id) ON DELETE CASCADE NOT NULL,
  relationship heir_relationship NOT NULL,
  fixed_share TEXT DEFAULT '',
  share_fraction NUMERIC NOT NULL DEFAULT 0,
  share_amount NUMERIC NOT NULL DEFAULT 0,
  share_percentage NUMERIC NOT NULL DEFAULT 0,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  blocked_by TEXT DEFAULT '',
  is_residuary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Auto-create profile and preferences on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_preferences (user_id) VALUES (NEW.id);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_heirs_updated_at BEFORE UPDATE ON public.heirs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_calculations_updated_at BEFORE UPDATE ON public.calculations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.heirs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calculation_heirs ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- USER_ROLES policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- USER_PREFERENCES policies
CREATE POLICY "Users can view own prefs" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own prefs" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ASSETS policies
CREATE POLICY "Users can view own assets" ON public.assets FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own assets" ON public.assets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assets" ON public.assets FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can delete own assets" ON public.assets FOR DELETE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- HEIRS policies
CREATE POLICY "Users can view own heirs" ON public.heirs FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own heirs" ON public.heirs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own heirs" ON public.heirs FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can delete own heirs" ON public.heirs FOR DELETE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- CALCULATIONS policies
CREATE POLICY "Users can view own calculations" ON public.calculations FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own calculations" ON public.calculations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own calculations" ON public.calculations FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can delete own calculations" ON public.calculations FOR DELETE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- CALCULATION_HEIRS policies
CREATE POLICY "Users can view own calc heirs" ON public.calculation_heirs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.calculations WHERE id = calculation_id AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Users can insert own calc heirs" ON public.calculation_heirs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.calculations WHERE id = calculation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own calc heirs" ON public.calculation_heirs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.calculations WHERE id = calculation_id AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Users can delete own calc heirs" ON public.calculation_heirs FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.calculations WHERE id = calculation_id AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
);
