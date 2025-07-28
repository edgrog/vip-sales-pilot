import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const metaAccessToken = Deno.env.get('META_ACCESS_TOKEN');
    
    if (!metaAccessToken) {
      console.error('META_ACCESS_TOKEN not found in environment variables');
      return new Response(
        JSON.stringify({ error: 'Meta Access Token not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Fetching Meta Ads data...');

    const adAccountId = 'act_602278455259953';    
    const fields = 'id,name,insights{spend}';
    const apiUrl = `https://graph.facebook.com/v18.0/${adAccountId}/ads?fields=${fields}&access_token=${metaAccessToken}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Meta API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('Successfully fetched Meta Ads data:', data);

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error fetching Meta Ads data:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch Meta Ads data',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})