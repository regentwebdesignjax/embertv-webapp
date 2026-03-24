import { createClient } from 'npm:@base44/sdk@0.8.4';

function getServiceClient() {
  const appId = Deno.env.get("BASE44_APP_ID");
  const apiKey = Deno.env.get("BASE44_SERVICE_ROLE_KEY");  // this is your workspace API key
  const serverUrl = Deno.env.get("BASE44_SERVER_URL");

  if (!appId || !apiKey || !serverUrl) {
    console.error("Missing Base44 config", {
      hasAppId: !!appId,
      hasApiKey: !!apiKey,
      hasServerUrl: !!serverUrl,
    });
    throw new Error("Missing Base44 configuration");
  }

  return createClient({
    appId,
    apiKey,      // 👈 use apiKey instead of serviceRoleKey
    serverUrl,
  });
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

// 🚧 TEMP: accept any method so the Test Runner can hit the logic
// (We'll tighten this back to GET later)

  if (req.method !== 'GET') {
    return Response.json(
      { error: 'Method not allowed' },
      { 
        status: 405,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    );
  }

  try {
    const base44 = getServiceClient();
    
    // Query all FilmRental records
    const rentals = await base44.entities.FilmRental.filter({});

    return Response.json({
      success: true,
      count: rentals.length,
      rentals
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Query error:', error);
    return Response.json(
      { error: 'Failed to query rentals', message: error.message },
      { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    );
  }
});