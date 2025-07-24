-- Drop the existing table and recreate with the new schema
DROP TABLE IF EXISTS public.vip_sales_raw;

-- Create the vip_sales_raw table with the new structure
CREATE TABLE public.vip_sales_raw (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  retail_accounts TEXT NOT NULL,
  dist_state TEXT NOT NULL,
  state TEXT NOT NULL,
  may_2025_cases_per_week_per_store FLOAT8 NOT NULL DEFAULT 0,
  june_cases_per_week_per_store FLOAT8 NOT NULL DEFAULT 0,
  july_cases_per_week_per_store FLOAT8 NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vip_sales_raw ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access for the sales data
CREATE POLICY "Allow public read access to sales data" 
ON public.vip_sales_raw 
FOR SELECT 
USING (true);

-- Create policy to allow public insert for data loading
CREATE POLICY "Allow public insert to sales data" 
ON public.vip_sales_raw 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX idx_vip_sales_retail_accounts ON public.vip_sales_raw(retail_accounts);
CREATE INDEX idx_vip_sales_state ON public.vip_sales_raw(state);

-- Insert some sample data
INSERT INTO public.vip_sales_raw (retail_accounts, dist_state, state, may_2025_cases_per_week_per_store, june_cases_per_week_per_store, july_cases_per_week_per_store) VALUES
('Walmart Store #1234', 'CA-North', 'CA', 12.5, 13.8, 10.2),
('Walmart Store #5678', 'CA-South', 'CA', 8.9, 9.6, 0.0),
('Target Store #9012', 'TX-Central', 'TX', 15.7, 17.2, 18.5),
('Target Store #3456', 'TX-North', 'TX', 6.3, 5.8, 4.1),
('Kroger Store #7890', 'OH-Metro', 'OH', 11.2, 12.8, 14.6),
('Kroger Store #2468', 'OH-Rural', 'OH', 4.5, 3.9, 0.0),
('Safeway Store #1357', 'WA-Seattle', 'WA', 9.8, 8.7, 6.4),
('Publix Store #8024', 'FL-Tampa', 'FL', 13.4, 14.1, 15.8),
('HEB Store #6801', 'TX-South', 'TX', 16.2, 17.9, 19.3),
('Wegmans Store #4681', 'NY-Upstate', 'NY', 7.6, 6.2, 0.0);