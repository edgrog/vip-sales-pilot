-- Enable RLS on ad_tags table (if not already enabled)
ALTER TABLE public.ad_tags ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access to ad_tags
-- Since this is a simple tagging system without user authentication, we'll allow public access

-- Allow anyone to select ad tags
CREATE POLICY "Allow public read access to ad_tags" 
ON public.ad_tags 
FOR SELECT 
USING (true);

-- Allow anyone to insert ad tags
CREATE POLICY "Allow public insert access to ad_tags" 
ON public.ad_tags 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to update ad tags
CREATE POLICY "Allow public update access to ad_tags" 
ON public.ad_tags 
FOR UPDATE 
USING (true);

-- Allow anyone to delete ad tags
CREATE POLICY "Allow public delete access to ad_tags" 
ON public.ad_tags 
FOR DELETE 
USING (true);