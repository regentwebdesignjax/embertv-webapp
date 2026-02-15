import { createClient, createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY_LIVE"), {
  apiVersion: '2023-10-16',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

// Initialize Admin Client for privileged DB operations
function getServiceClient() {
  return createClient({
    appId: Deno.env.get("BASE44_APP_ID"),
    serviceRoleKey: Deno.env.get("BASE44_SERVICE_ROLE_KEY")
  });
}

Deno.serve(async (req) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { film_id } = body;

    console.log(`[Checkout] Processing rental for film_id: ${film_id}`);

    // 2. Authenticate User (using request headers)
    const requestClient = createClientFromRequest(req);
    const user = await requestClient.auth.me();

    if (!user) {
      console.error('[Checkout] User authentication failed');
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    if (!film_id) {
      return Response.json({ error: 'Film ID is required' }, { status: 400, headers: corsHeaders });
    }

    // 3. Fetch Data using Service Client (Bypasses RLS/permissions issues)
    const adminClient = getServiceClient();
    
    // Fetch film
    const films = await adminClient.entities.Film.filter({ id: film_id });
    
    if (!films || films.length === 0) {
      console.error(`[Checkout] Film not found in database: ${film_id}`);
      return Response.json({ error: 'Film not found' }, { status: 404, headers: corsHeaders });
    }

    const film = films[0];

    // Validate Stripe Config
    if (!film.stripe_price_id) {
      console.error(`[Checkout] Film ${film.id} is missing stripe_price_id`);
      return Response.json({ 
        error: 'This film is not currently available for rental. Please try again later.' 
      }, { status: 400, headers: corsHeaders });
    }

    // 4. Check for Existing Active Rentals
    const existingRentals = await adminClient.entities.FilmRental.filter({
      user_id: user.id,
      film_id: film_id,
      status: 'active'
    });

    if (existingRentals.length > 0) {
      const rental = existingRentals[0];
      const now = new Date();
      const expiresAt = new Date(rental.expires_at);
      
      if (now < expiresAt) {
        return Response.json({ 
          error: 'You already have an active rental for this film',
          rental_id: rental.id
        }, { status: 400, headers: corsHeaders });
      }
    }

    // 5. Get or Create Stripe Customer
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      console.log(`[Checkout] Creating new Stripe customer for user ${user.id}`);
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
          app_id: Deno.env.get("BASE44_APP_ID")
        }
      });
      customerId = customer.id;

      // Save Stripe ID to user record using Admin Client
      await adminClient.entities.User.update(user.id, {
        stripe_customer_id: customerId
      });
    }

    // 6. Create Pending Rental Record
    const rental = await adminClient.entities.FilmRental.create({
      user_id: user.id,
      film_id: film_id,
      status: 'pending'
    });

    // 7. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [
        {
          price: film.stripe_price_id,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get('origin')}/RentalSuccess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/RentalCanceled?film_slug=${film.slug}`,
      metadata: {
        film_id: film_id,
        rental_id: rental.id,
        user_id: user.id
      },
      payment_intent_data: {
        metadata: {
          film_id: film_id,
          film_title: film.title,
          distributor: film.distributor || ''
        }
      }
    });

    // 8. Update Rental with Session ID
    await adminClient.entities.FilmRental.update(rental.id, {
      stripe_checkout_session_id: session.id
    });

    return Response.json({
      checkout_url: session.url,
      session_id: session.id
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error creating rental checkout:', error);
    return Response.json({ 
      error: error.message || 'Failed to create checkout session' 
    }, { status: 500, headers: corsHeaders });
  }
});