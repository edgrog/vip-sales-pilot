-- Update the normalize_chain_name function to handle more chain variations
CREATE OR REPLACE FUNCTION public.normalize_chain_name(retail_account text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Return null if input is null or empty
  IF retail_account IS NULL OR trim(retail_account) = '' THEN
    RETURN NULL;
  END IF;
  
  -- Convert to uppercase for consistent matching and remove extra spaces/punctuation
  retail_account := upper(trim(retail_account));
  retail_account := regexp_replace(retail_account, '[^\w\s]', ' ', 'g'); -- Replace punctuation with spaces
  retail_account := regexp_replace(retail_account, '\s+', ' ', 'g'); -- Normalize multiple spaces
  
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
  ELSIF retail_account LIKE '7 ELEVEN%' OR retail_account LIKE '7ELEVEN%' OR retail_account LIKE '7 11%' THEN
    RETURN '7-Eleven';
  ELSIF retail_account LIKE 'COSTCO%' THEN
    RETURN 'Costco';
  ELSIF retail_account LIKE 'SAM''S CLUB%' OR retail_account LIKE 'SAMS CLUB%' OR retail_account LIKE 'SAMSCLUB%' THEN
    RETURN 'Sam''s Club';
  ELSIF retail_account LIKE 'WHOLE FOODS%' OR retail_account LIKE 'WHOLEFOODS%' THEN
    RETURN 'Whole Foods';
  ELSIF retail_account LIKE 'TRADER JOE%' THEN
    RETURN 'Trader Joe''s';
  ELSIF retail_account LIKE 'CVS%' THEN
    RETURN 'CVS';
  ELSIF retail_account LIKE 'WALGREENS%' THEN
    RETURN 'Walgreens';
  ELSIF retail_account LIKE 'RITE AID%' OR retail_account LIKE 'RITEAID%' THEN
    RETURN 'Rite Aid';
  -- Handle GoPuff variations
  ELSIF retail_account LIKE 'GOPUFF%' OR retail_account LIKE 'GO PUFF%' THEN
    RETURN 'GoPuff';
  -- Handle other delivery services
  ELSIF retail_account LIKE 'DOOR DASH%' OR retail_account LIKE 'DOORDASH%' THEN
    RETURN 'DoorDash';
  ELSIF retail_account LIKE 'UBER EATS%' OR retail_account LIKE 'UBEREATS%' THEN
    RETURN 'Uber Eats';
  -- Handle gas stations
  ELSIF retail_account LIKE 'SHELL%' THEN
    RETURN 'Shell';
  ELSIF retail_account LIKE 'EXXON%' OR retail_account LIKE 'MOBIL%' THEN
    RETURN 'ExxonMobil';
  ELSIF retail_account LIKE 'BP %' OR retail_account LIKE 'BP%' THEN
    RETURN 'BP';
  ELSIF retail_account LIKE 'CHEVRON%' THEN
    RETURN 'Chevron';
  ELSIF retail_account LIKE 'SPEEDWAY%' THEN
    RETURN 'Speedway';
  -- Handle common chain patterns
  ELSIF retail_account LIKE 'YANKEE SPIRITS%' THEN
    RETURN 'YANKEE SPIRITS';
  ELSIF retail_account LIKE 'STAR MARKET%' THEN
    RETURN 'STAR';
  ELSIF retail_account LIKE 'RAPID%' THEN
    RETURN 'RAPID';
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
      WHEN split_part(retail_account, ' ', 2) IN ('MART', 'MARKET', 'STORE', 'SHOP', 'CENTER', 'STATION') 
      THEN split_part(retail_account, ' ', 1)
      ELSE split_part(retail_account, ' ', 1) || COALESCE(' ' || NULLIF(split_part(retail_account, ' ', 2), ''), '')
    END;
  END IF;
END;
$function$;

-- Update all existing records to use the improved normalization
UPDATE vip_sales 
SET normalized_chain = normalize_chain_name("Retail Accounts")
WHERE "Retail Accounts" IS NOT NULL 
AND "Retail Accounts" != 'Total';