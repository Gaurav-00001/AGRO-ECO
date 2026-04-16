
-- Create plots table for wheat management
CREATE TABLE public.plots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  length_m NUMERIC NOT NULL DEFAULT 0,
  breadth_m NUMERIC NOT NULL DEFAULT 0,
  area_sqm NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own plots" ON public.plots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own plots" ON public.plots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own plots" ON public.plots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own plots" ON public.plots FOR DELETE USING (auth.uid() = user_id);

-- Create livestock table
CREATE TABLE public.livestock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL,
  photo_url TEXT,
  health_score NUMERIC DEFAULT 0,
  species TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.livestock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own livestock" ON public.livestock FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own livestock" ON public.livestock FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own livestock" ON public.livestock FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own livestock" ON public.livestock FOR DELETE USING (auth.uid() = user_id);

-- Create oil_palm_trees table
CREATE TABLE public.oil_palm_trees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tree_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending Scan' CHECK (status IN ('Healthy', 'Infected', 'Pending Scan')),
  last_scan_date TIMESTAMP WITH TIME ZONE,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.oil_palm_trees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own palm trees" ON public.oil_palm_trees FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own palm trees" ON public.oil_palm_trees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own palm trees" ON public.oil_palm_trees FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own palm trees" ON public.oil_palm_trees FOR DELETE USING (auth.uid() = user_id);

-- Create system_settings table for language preferences
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings" ON public.system_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own settings" ON public.system_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.system_settings FOR UPDATE USING (auth.uid() = user_id);

-- Create livestock photos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('livestock-photos', 'livestock-photos', true);

CREATE POLICY "Users can upload livestock photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'livestock-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Livestock photos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'livestock-photos');
CREATE POLICY "Users can update their livestock photos" ON storage.objects FOR UPDATE USING (bucket_id = 'livestock-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_plots_updated_at BEFORE UPDATE ON public.plots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_livestock_updated_at BEFORE UPDATE ON public.livestock FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_oil_palm_trees_updated_at BEFORE UPDATE ON public.oil_palm_trees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
