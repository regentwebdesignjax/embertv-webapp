import { SignJWT, jwtVerify } from 'npm:jose@5.2.0';

const JWT_SECRET = new TextEncoder().encode(Deno.env.get("API_JWT_SECRET"));
const TOKEN_EXPIRY = '7d';

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

// Verify password and get user using Base44's auth API
async function verifyCredentialsAndGetUser(email, password) {
  const appId = Deno.env.get("BASE44_APP_ID");
  
  // Try multiple endpoint variations
  const endpoints = [
    `https://app.base44.com/api/apps/${appId}/auth/password/login`,
    `https://app.base44.com/api/apps/${appId}/auth/login`,
    `https://base44.com/api/apps/${appId}/auth/password/login`,
    `https://base44.com/api/apps/${appId}/auth/login`
  ];

  for (const endpoint of endpoints) {
    try {
      console.log('Trying endpoint:', endpoint);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Login successful via:', endpoint);
        console.log('User data received:', JSON.stringify(data.user));
        return { success: true, token: data.token, user: data.user };
      }
      
      // Log error for debugging
      const errorText = await response.text();
      console.log('Endpoint failed:', endpoint, response.status, errorText);
    } catch (error) {
      console.log('Endpoint error:', endpoint, error.message);
    }
  }

  return { success: false, user: null };
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

    const normalizedEmail = email.toLowerCase().trim();

    // Verify credentials and get user from Base44's auth system
    const authResult = await verifyCredentialsAndGetUser(normalizedEmail, password);

    if (!authResult.success || !authResult.user) {
      return Response.json(
        { error: 'invalid_credentials', message: 'Authentication failed. Check function logs for details.' }, 
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const user = authResult.user;

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
      { error: 'authentication_failed', message: error.message }, 
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
export { verifyToken };