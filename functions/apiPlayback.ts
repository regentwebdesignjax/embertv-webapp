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

// Extract playback URL from embed code
function extractPlaybackUrl(embedCode) {
  if (!embedCode) return null;
  
  // Try to extract src from iframe
  const srcMatch = embedCode.match(/src=["']([^"']+)["']/);
  if (srcMatch) {
    let url = srcMatch[1];
    // Clean up the URL for direct player use
    // Handle Vimeo
    if (url.includes('vimeo.com')) {
      // Extract video ID and construct player URL
      const vimeoMatch = url.match(/player\.vimeo\.com\/video\/(\d+)/);
      if (vimeoMatch) {
        return {
          type: 'vimeo',
          url: url,
          video_id: vimeoMatch[1]
        };
      }
    }
    // Handle YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const ytMatch = url.match(/(?:embed\/|v=)([a-zA-Z0-9_-]+)/);
      if (ytMatch) {
        return {
          type: 'youtube',
          url: url,
          video_id: ytMatch[1]
        };
      }
    }
    // Handle Bunny.net or other direct URLs
    if (url.includes('bunny') || url.includes('.m3u8') || url.includes('.mp4')) {
      return {
        type: 'direct',
        url: url
      };
    }
    // Generic embed URL
    return {
      type: 'embed',
      url: url
    };
  }
  
  return null;
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

    // Fetch the film
    const films = await base44.entities.Film.filter({ id: filmId, is_published: true });
    if (films.length === 0) {
      return Response.json({ error: 'Film not found' }, { status: 404 });
    }

    const film = films[0];

    // Check entitlement
    const entitlement = await checkEntitlement(base44, user.userId, filmId);

    if (!entitlement.hasAccess) {
      return Response.json({
        has_access: false,
        error: 'no_active_rental'
      }, {
        status: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      });
    }

    // Use HLS playback URL if available, otherwise fall back to extracting from embed code
    let playbackInfo = null;
    
    if (film.hls_playback_url) {
      playbackInfo = {
        type: 'hls',
        url: film.hls_playback_url
      };
    } else {
      // Fall back to extracting from embed code
      playbackInfo = extractPlaybackUrl(film.full_movie_embed_code);
    }

    if (!playbackInfo) {
      return Response.json({
        has_access: true,
        error: 'playback_not_available',
        message: 'No playback source configured for this film'
      }, {
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      });
    }

    return Response.json({
      has_access: true,
      playback_type: playbackInfo.type,
      playback_url: playbackInfo.url,
      hls_url: film.hls_playback_url || null,
      video_id: playbackInfo.video_id || null,
      expires_at: entitlement.expiresAt,
      film: {
        id: film.id,
        title: film.title,
        runtime_minutes: film.duration_minutes
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Playback API error:', error);
    return Response.json({ error: 'Failed to get playback info' }, { status: 500 });
  }
});