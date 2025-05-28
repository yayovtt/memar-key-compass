
-- Enable RLS on client_files table
ALTER TABLE public.client_files ENABLE ROW LEVEL SECURITY;

-- Allow users to insert files for clients they own
CREATE POLICY "Users can insert files for their clients" 
  ON public.client_files 
  FOR INSERT 
  WITH CHECK (
    user_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM public.clients 
      WHERE id = client_id 
      AND created_by_user_id = auth.uid()
    )
  );

-- Allow users to view files for clients they own
CREATE POLICY "Users can view files for their clients" 
  ON public.client_files 
  FOR SELECT 
  USING (
    user_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM public.clients 
      WHERE id = client_id 
      AND created_by_user_id = auth.uid()
    )
  );

-- Allow users to update files for clients they own
CREATE POLICY "Users can update files for their clients" 
  ON public.client_files 
  FOR UPDATE 
  USING (
    user_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM public.clients 
      WHERE id = client_id 
      AND created_by_user_id = auth.uid()
    )
  );

-- Allow users to delete files for clients they own  
CREATE POLICY "Users can delete files for their clients" 
  ON public.client_files 
  FOR DELETE 
  USING (
    user_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM public.clients 
      WHERE id = client_id 
      AND created_by_user_id = auth.uid()
    )
  );
