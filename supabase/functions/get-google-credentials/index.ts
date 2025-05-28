
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log(`${req.method} request received`);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Creating Supabase client...');
    
    // Create a Supabase client with the Auth context of the logged in user.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    console.log('Getting user from auth header...');
    
    // Get the session or user object
    const authHeader = req.headers.get('Authorization')!
    if (!authHeader) {
      throw new Error('No authorization header provided')
    }
    
    const token = authHeader.replace('Bearer ', '')
    const { data, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError) {
      console.error('Error getting user:', userError);
      throw new Error(`Authentication failed: ${userError.message}`)
    }
    
    const user = data.user

    if (!user) {
      throw new Error('User not authenticated')
    }

    console.log('User authenticated:', user.id);

    // Get Google credentials from environment/secrets
    console.log('Retrieving Google credentials from environment...');
    const clientId = Deno.env.get('GOOGLE_DRIVE_CLIENT_ID')
    const apiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY')

    console.log('Client ID available:', !!clientId);
    console.log('API Key available:', !!apiKey);

    if (!clientId) {
      throw new Error('Google Drive Client ID not configured')
    }

    console.log('Successfully retrieved Google credentials for user:', user.id)

    return new Response(
      JSON.stringify({
        clientId,
        apiKey: apiKey || null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in get-google-credentials function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
