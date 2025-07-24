-- Create policy to allow public read access to vip_sales data
CREATE POLICY "Allow public read access to vip_sales data" 
ON public.vip_sales 
FOR SELECT 
USING (true);