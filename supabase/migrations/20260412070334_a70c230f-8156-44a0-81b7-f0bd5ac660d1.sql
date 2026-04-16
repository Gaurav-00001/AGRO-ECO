
-- Add photo_url column to oil_palm_trees
ALTER TABLE public.oil_palm_trees ADD COLUMN photo_url text;

-- Create storage bucket for palm tree photos
INSERT INTO storage.buckets (id, name, public) VALUES ('palm-tree-photos', 'palm-tree-photos', true);

-- Storage policies
CREATE POLICY "Palm tree photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'palm-tree-photos');

CREATE POLICY "Users can upload palm tree photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'palm-tree-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their palm tree photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'palm-tree-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their palm tree photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'palm-tree-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
