CREATE POLICY "Users can delete their own settings"
ON public.system_settings
FOR DELETE
USING (auth.uid() = user_id);