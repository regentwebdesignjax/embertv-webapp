import { createClient } from 'npm:@base44/sdk@0.8.4';
import { SignJWT, jwtVerify } from 'npm:jose@5.2.0';

const JWT_SECRET = new TextEncoder().encode(Deno.env.get("API_JWT_SECRET"));
const TOKEN_EXPIRY = '7d';

// Initialize Base44 client with service role
function getServiceClient() {
  return createClient({
    appId: Deno.env.get("BASE44_APP_ID"),
    serviceRoleKey: Deno.env.get("BASE44_SERVICE_ROLE_KEY")
  });
}

// Generate JWT token
async function generateToken(userId, email) {
  const token = await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
  return token;
}

// Verify JWT token
async function verifyToken(token) {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload;
}

// Verify password using Base44's auth API
async function verifyCredentials(email, password) {
  const appId = Deno.env.get("BASE44_APP_ID");
  
  try {
    // Use Base44's password login endpoint to verify credentials
    const response = await fetch(`https://base44.com/api/apps/${appId}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      return { success: false };
    }

    const data = await response.json();
    return { success: true, token: data.token, user: data.user };
  } catch (error) {
    console.error('Credential verification error:', error);
    return { success: false };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return Response.json(
      { error: 'method_not_allowed', message: 'Only POST method is supported' }, 
      { 
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
          'Allow': 'POST, OPTIONS'
        }
      }
    );
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return Response.json(
        { error: 'invalid_request', message: 'Invalid JSON body' }, 
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const { email, password } = body;

    if (!email || !password) {
      return Response.json(
        { error: 'invalid_request', message: 'Email and password are required' }, 
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Verify credentials against Base44's auth system
    const authResult = await verifyCredentials(email.toLowerCase().trim(), password);

    if (!authResult.success) {
      return Response.json(
        { error: 'invalid_credentials' }, 
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Get user details from our database
    const base44 = getServiceClient();
    const users = await base44.entities.User.filter({ email: email.toLowerCase().trim() });
    
    if (users.length === 0) {
      return Response.json(
        { error: 'invalid_credentials' }, 
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const user = users[0];
    
    // Generate our own API token for subsequent requests
    const token = await generateToken(user.id, user.email);

    return Response.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name || null
      }
    }, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Auth error:', error);
    return Response.json(
      { error: 'authentication_failed', message: 'An error occurred during authentication' }, 
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      }
    );
  }
});

// Export helper for other functions
export { verifyToken, getServiceClient };