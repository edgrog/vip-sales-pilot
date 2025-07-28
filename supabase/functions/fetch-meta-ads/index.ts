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

    // For now, we'll return mock data since we need the actual ad account ID
    // Replace this with actual Meta API call once you provide the ad account ID
    const mockData = {
      data: [
        {
          id: "23892841234567890",
          name: "Summer Sale Campaign - Target Stores",
          insights: {
            data: [
              { spend: "1234.56" }
            ]
          }
        },
        {
          id: "23892841234567891", 
          name: "Back to School Promo - Walmart",
          insights: {
            data: [
              { spend: "2345.67" }
            ]
          }
        },
        {
          id: "23892841234567892",
          name: "Holiday Campaign - Kroger",
          insights: {
            data: [
              { spend: "3456.78" }
            ]
          }
        },
        {
          id: "23892841234567893",
          name: "Brand Awareness - Multi-Chain",
          insights: {
            data: [
              { spend: "987.65" }
            ]
          }
        },
        {
          id: "23892841234567894",
          name: "Product Launch - Target & Walmart",
          insights: {
            data: [
              { spend: "4567.89" }
            ]
          }
        }
      ]
    };

    console.log('Successfully fetched Meta Ads data');

    return new Response(
      JSON.stringify(mockData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

    // Uncomment this section when you want to use real Meta API data:
    /*
    const adAccountId = 'act_YOUR_AD_ACCOUNT_ID'; // Replace with your actual ad account ID
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
    */

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