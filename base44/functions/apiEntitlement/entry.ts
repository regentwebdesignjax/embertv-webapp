import { createClient } from 'npm:@base44/sdk@0.8.4';
import { jwtVerify } from 'npm:jose@5.2.0';

const JWT_SECRET = new TextEncoder().encode(Deno.env.get("API_JWT_SECRET"));

function getServiceClient() {
  return createClient({
    appId: Deno.env.get("BASE44_APP_ID"),
    serviceRoleKey: Deno.env.get("BASE44_SERVICE_ROLE_KEY")
  });
}

async function verifyToken(token) {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload;
}

async function authenticateRequest(req) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  try {
    const payload = await verifyToken(token);
    return payload;
  } catch (error) {
    return null;
  }
}

async function checkEntitlement(base44, userId, filmId) {
  // Find the most recent active rental for this user and film
  const rentals = await base44.entities.FilmRental.filter(
    { user_id: userId, film_id: filmId, status: 'active' },
    '-created_date',
    1
  );

  if (rentals.length === 0) {
    return { hasAccess: false };
  }

  const rental = rentals[0];
  const now = new Date();
  const expiresAt = new Date(rental.expires_at);

  // Check if rental has expired
  if (now >= expiresAt) {
    // Update status to expired
    await base44.entities.FilmRental.update(rental.id, { status: 'expired' });
    return { hasAccess: false };
  }

  return {
    hasAccess: true,
    expiresAt: rental.expires_at,
    rental
  };
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  if (req.method !== 'GET') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Authenticate
  const user = await authenticateRequest(req);
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const params = url.searchParams;
    
    const filmId = params.get('film_id');
    
    if (!filmId) {
      return Response.json({ error: 'film_id is required' }, { status: 400 });
    }

    const base44 = getServiceClient();

    // Check if film exists
    const films = await base44.entities.Film.filter({ id: filmId, is_published: true });
    if (films.length === 0) {
      return Response.json({ error: 'Film not found' }, { status: 404 });
    }

    // Check entitlement
    const entitlement = await checkEntitlement(base44, user.userId, filmId);

    if (entitlement.hasAccess) {
      return Response.json({
        has_access: true,
        expires_at: entitlement.expiresAt
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      });
    } else {
      return Response.json({
        has_access: false
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      });
    }

  } catch (error) {
    console.error('Entitlement API error:', error);
    return Response.json({ error: 'Failed to check entitlement' }, { status: 500 });
  }
});

export { checkEntitlement };