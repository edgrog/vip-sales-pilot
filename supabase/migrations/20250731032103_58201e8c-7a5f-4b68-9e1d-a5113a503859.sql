-- Enable public read access to VIP_RAW_12MO for wholesale dashboard
CREATE POLICY "Allow public read access to VIP_RAW_12MO data" 
ON public."VIP_RAW_12MO" 
FOR SELECT 
USING (true);