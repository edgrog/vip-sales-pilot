-- Critical Security Fix: Enable RLS on meta_ads_raw table
ALTER TABLE public.meta_ads_raw ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for meta_ads_raw (allowing public read access for now, should be user-specific later)
CREATE POLICY "Allow public read access to meta_ads_raw" 
ON public.meta_ads_raw 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to meta_ads_raw" 
ON public.meta_ads_raw 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to meta_ads_raw" 
ON public.meta_ads_raw 
FOR UPDATE 
USING (true);

-- Enable RLS only on actual tables (not views)
ALTER TABLE public.vip_sales_unpivoted ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vip_sales_unpivoted
CREATE POLICY "Allow public read access to vip_sales_unpivoted" 
ON public.vip_sales_unpivoted 
FOR SELECT 
USING (true);