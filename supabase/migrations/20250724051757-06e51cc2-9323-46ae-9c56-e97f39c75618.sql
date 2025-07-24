-- Fix security warnings by setting search_path for functions
DROP FUNCTION IF EXISTS normalize_chain_name(TEXT);
DROP FUNCTION IF EXISTS update_normalized_chain();

-- Recreate the function with proper search_path
CREATE OR REPLACE FUNCTION normalize_chain_name(retail_account TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Return null if input is null or empty
  IF retail_account IS NULL OR trim(retail_account) = '' THEN
    RETURN NULL;
  END IF;
  
  -- Convert to uppercase for consistent matching
  retail_account := upper(trim(retail_account));
  
  -- Major chains - order matters (more specific first)
  IF retail_account LIKE 'HEB%' THEN
    RETURN 'HEB';
  ELSIF retail_account LIKE 'WEGMAN%' THEN
    RETURN 'Wegmans';
  ELSIF retail_account LIKE 'KROGER%' THEN
    RETURN 'Kroger';
  ELSIF retail_account LIKE 'WALMART%' THEN
    RETURN 'Walmart';
  ELSIF retail_account LIKE 'TARGET%' THEN
    RETURN 'Target';
  ELSIF retail_account LIKE 'SAFEWAY%' THEN
    RETURN 'Safeway';
  ELSIF retail_account LIKE 'PUBLIX%' THEN
    RETURN 'Publix';
  ELSIF retail_account LIKE '7-ELEVEN%' OR retail_account LIKE '7-11%' THEN
    RETURN '7-Eleven';
  ELSIF retail_account LIKE 'COSTCO%' THEN
    RETURN 'Costco';
  ELSIF retail_account LIKE 'SAM''S CLUB%' OR retail_account LIKE 'SAMS CLUB%' THEN
    RETURN 'Sam''s Club';
  ELSIF retail_account LIKE 'WHOLE FOODS%' THEN
    RETURN 'Whole Foods';
  ELSIF retail_account LIKE 'TRADER JOE%' THEN
    RETURN 'Trader Joe''s';
  ELSIF retail_account LIKE 'CVS%' THEN
    RETURN 'CVS';
  ELSIF retail_account LIKE 'WALGREENS%' THEN
    RETURN 'Walgreens';
  ELSIF retail_account LIKE 'RITE AID%' THEN
    RETURN 'Rite Aid';
  -- For other chains, extract the first word(s) before common suffixes
  ELSIF retail_account LIKE '%FOOD STORE%' OR retail_account LIKE '%SUPERMARKET%' OR retail_account LIKE '%GROCERY%' THEN
    -- Extract chain name before these suffixes
    RETURN split_part(split_part(split_part(retail_account, ' FOOD STORE', 1), ' SUPERMARKET', 1), ' GROCERY', 1);
  ELSIF retail_account LIKE '%LIQUOR%' OR retail_account LIKE '%PACKAGE%' OR retail_account LIKE '%PARTY STORE%' THEN
    -- For liquor stores, extract the first part before store type
    RETURN split_part(split_part(split_part(retail_account, ' LIQUOR', 1), ' PACKAGE', 1), ' PARTY STORE', 1);
  ELSE
    -- For everything else, extract first word or first two words if second word is descriptive
    RETURN CASE 
      WHEN split_part(retail_account, ' ', 2) IN ('MART', 'MARKET', 'STORE', 'SHOP', 'CENTER') 
      THEN split_part(retail_account, ' ', 1)
      ELSE split_part(retail_account, ' ', 1) || COALESCE(' ' || NULLIF(split_part(retail_account, ' ', 2), ''), '')
    END;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public;

-- Recreate the trigger function with proper search_path
CREATE OR REPLACE FUNCTION update_normalized_chain()
RETURNS TRIGGER AS $$
BEGIN
  NEW.normalized_chain = normalize_chain_name(NEW."Retail Accounts");
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger
DROP TRIGGER IF EXISTS tr_update_normalized_chain ON public.vip_sales;
CREATE TRIGGER tr_update_normalized_chain
  BEFORE INSERT OR UPDATE OF "Retail Accounts" ON public.vip_sales
  FOR EACH ROW EXECUTE FUNCTION update_normalized_chain();