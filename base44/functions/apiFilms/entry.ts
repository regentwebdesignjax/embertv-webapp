import { createClient } from 'npm:@base44/sdk@0.8.4';

function getServiceClient() {
  return createClient({
    appId: Deno.env.get("BASE44_APP_ID"),
    serviceRoleKey: Deno.env.get("BASE44_SERVICE_ROLE_KEY")
  });
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

  try {
    const url = new URL(req.url);
    const params = url.searchParams;
    
    // Parse query parameters
    const genre = params.get('genre') || params.get('category');
    const featured = params.get('featured') === 'true';
    const filmId = params.get('id');
    const filmSlug = params.get('slug');
    const page = parseInt(params.get('page') || '1', 10);
    const perPage = Math.min(parseInt(params.get('per_page') || '20', 10), 50);

    const base44 = getServiceClient();

    // Single film lookup by ID or slug
    if (filmId || filmSlug) {
      let films;
      if (filmId) {
        films = await base44.entities.Film.filter({ id: filmId, is_published: true });
      } else {
        films = await base44.entities.Film.filter({ slug: filmSlug, is_published: true });
      }

      if (films.length === 0) {
        return Response.json({ error: 'Film not found' }, { status: 404 });
      }

      const film = films[0];
      
      // Return detailed film info (excluding sensitive fields)
      return Response.json({
        data: {
          id: film.id,
          slug: film.slug,
          title: film.title,
          description: film.short_description,
          long_description: film.long_description,
          genre: film.genre,
          runtime_minutes: film.duration_minutes,
          release_year: film.release_year,
          rating: film.rating,
          poster_url: film.thumbnail_url,
          banner_url: film.banner_image_url,
          is_featured: film.is_featured || false,
          trailer_available: !!film.trailer_embed_code
        }
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      });
    }

    // List films with filters
    let filter = { is_published: true };
    
    if (genre) {
      filter.genre = genre;
    }
    
    if (featured) {
      filter.is_featured = true;
    }

    // Fetch all matching films
    const allFilms = await base44.entities.Film.filter(filter, '-created_date');
    
    // Calculate pagination
    const total = allFilms.length;
    const startIndex = (page - 1) * perPage;
    const paginatedFilms = allFilms.slice(startIndex, startIndex + perPage);

    // Transform films for response (exclude sensitive fields)
    const filmData = paginatedFilms.map(film => ({
      id: film.id,
      slug: film.slug,
      title: film.title,
      description: film.short_description,
      genre: film.genre,
      runtime_minutes: film.duration_minutes,
      release_year: film.release_year,
      rating: film.rating,
      poster_url: film.thumbnail_url,
      is_featured: film.is_featured || false
    }));

    return Response.json({
      data: filmData,
      meta: {
        page,
        per_page: perPage,
        total
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Films API error:', error);
    return Response.json({ error: 'Failed to fetch films' }, { status: 500 });
  }
});