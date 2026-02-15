import { createClient, createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Check environment variables
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY_LIVE");
    const serviceRoleKey = Deno.env.get("BASE44_SERVICE_ROLE_KEY");
    const appId = Deno.env.get("BASE44_APP_ID");

    if (!stripeKey) {
      console.error('[Checkout] Missing STRIPE_SECRET_KEY_LIVE');
      return Response.json({ error: 'Server configuration error: Missing Stripe key' }, { status: 500, headers: corsHeaders });
    }

    if (!serviceRoleKey) {
      console.error('[Checkout] Missing BASE44_SERVICE_ROLE_KEY');
      return Response.json({ error: 'Server configuration error: Missing service role key' }, { status: 500, headers: corsHeaders });
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    const body = await req.json();
    const { film_id } = body;

    console.log(`[Checkout] Processing rental for film_id: ${film_id}`);

    // Authenticate User
    const requestClient = createClientFromRequest(req);
    const user = await requestClient.auth.me();

    if (!user) {
      console.error('[Checkout] User authentication failed. Authorization header missing or invalid.');
      return Response.json({ error: 'Unauthorized - Please log in again' }, { status: 401, headers: corsHeaders });
    }

    console.log(`[Checkout] User authenticated: ${user.id}`);

    if (!film_id) {
      return Response.json({ error: 'Film ID is required' }, { status: 400, headers: corsHeaders });
    }

    // Initialize Service Role Client for database operations
    const adminClient = createClient({
      appId: appId,
      serviceRoleKey: serviceRoleKey
    });
    
    // Fetch film using service role
    console.log(`[Checkout] Fetching film: ${film_id}`);
    const films = await adminClient.asServiceRole.entities.Film.filter({ id: film_id });
    
    if (!films || films.length === 0) {
      console.error(`[Checkout] Film not found in database: ${film_id}`);
      return Response.json({ error: 'Film not found' }, { status: 404, headers: corsHeaders });
    }

    const film = films[0];
    console.log(`[Checkout] Film found: ${film.title}`);

    // Validate Stripe Config
    if (!film.stripe_price_id) {
      console.error(`[Checkout] Film ${film.id} is missing stripe_price_id`);
      return Response.json({ 
        error: 'This film is not currently available for rental. Please try again later.' 
      }, { status: 400, headers: corsHeaders });
    }

    // Check for Existing Active Rentals
    console.log(`[Checkout] Checking for existing rentals`);
    const existingRentals = await adminClient.asServiceRole.entities.FilmRental.filter({
      user_id: user.id,
      film_id: film_id,
      status: 'active'
    });

    if (existingRentals.length > 0) {
      const rental = existingRentals[0];
      const now = new Date();
      const expiresAt = new Date(rental.expires_at);
      
      if (now < expiresAt) {
        console.log(`[Checkout] User already has active rental: ${rental.id}`);
        return Response.json({ 
          error: 'You already have an active rental for this film',
          rental_id: rental.id
        }, { status: 400, headers: corsHeaders });
      }
    }

    // Get or Create Stripe Customer
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      console.log(`[Checkout] Creating new Stripe customer for user ${user.id}`);
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
          app_id: appId
        }
      });
      customerId = customer.id;
      console.log(`[Checkout] Created Stripe customer: ${customerId}`);

      // Save Stripe ID to user record
      await adminClient.asServiceRole.entities.User.update(user.id, {
        stripe_customer_id: customerId
      });
    }

    // Create Pending Rental Record
    console.log(`[Checkout] Creating pending rental record`);
    const rental = await adminClient.asServiceRole.entities.FilmRental.create({
      user_id: user.id,
      film_id: film_id,
      status: 'pending'
    });
    console.log(`[Checkout] Created rental record: ${rental.id}`);

    // Create Stripe Checkout Session
    console.log(`[Checkout] Creating Stripe checkout session`);
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
    console.log(`[Checkout] Created Stripe session: ${session.id}`);

    // Update Rental with Session ID
    await adminClient.asServiceRole.entities.FilmRental.update(rental.id, {
      stripe_checkout_session_id: session.id
    });

    console.log(`[Checkout] Successfully created checkout session`);
    return Response.json({
      checkout_url: session.url,
      session_id: session.id
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('[Checkout] Error creating rental checkout:', error);
    console.error('[Checkout] Error message:', error.message);
    console.error('[Checkout] Error stack:', error.stack);
    return Response.json({ 
      error: error.message || 'Failed to create checkout session' 
    }, { status: 500, headers: corsHeaders });
  }
});