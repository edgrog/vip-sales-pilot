-- Drop the existing table and recreate with the correct schema
DROP TABLE IF EXISTS public.vip_sales_raw;

-- Create the vip_sales_raw table with the correct structure
CREATE TABLE public.vip_sales_raw (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_name TEXT NOT NULL,
  sale_month DATE NOT NULL,
  case_equivs NUMERIC NOT NULL DEFAULT 0,
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

-- Create index for better query performance
CREATE INDEX idx_vip_sales_account_month ON public.vip_sales_raw(account_name, sale_month);
CREATE INDEX idx_vip_sales_month ON public.vip_sales_raw(sale_month DESC);

-- Insert some sample data
INSERT INTO public.vip_sales_raw (account_name, sale_month, case_equivs) VALUES
('Walmart Store #1234', '2025-05-01', 1500),
('Walmart Store #1234', '2025-06-01', 1650),
('Walmart Store #1234', '2025-07-01', 1200),
('Target Store #5678', '2025-05-01', 890),
('Target Store #5678', '2025-06-01', 920),
('Target Store #5678', '2025-07-01', 0),
('Kroger Store #9012', '2025-05-01', 2100),
('Kroger Store #9012', '2025-06-01', 2350),
('Kroger Store #9012', '2025-07-01', 2500),
('Safeway Store #3456', '2025-05-01', 750),
('Safeway Store #3456', '2025-06-01', 680),
('Safeway Store #3456', '2025-07-01', 520),
('Publix Store #7890', '2025-05-01', 1100),
('Publix Store #7890', '2025-06-01', 1200),
('Publix Store #7890', '2025-07-01', 1350);