import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY_LIVE"), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { film_id } = await req.json();

    if (!film_id) {
      return Response.json({ error: 'Film ID is required' }, { status: 400 });
    }

    // Get film details using service role to ensure we can read it
    const films = await base44.asServiceRole.entities.Film.filter({ id: film_id });
    
    if (!films || films.length === 0) {
      return Response.json({ error: 'Film not found' }, { status: 404 });
    }

    const film = films[0];

    // Check if film has Stripe Price ID
    if (!film.stripe_price_id) {
      return Response.json({ 
        error: 'This film is not currently available for rental. Please try again later.' 
      }, { status: 400 });
    }

    // Check if user already has an active rental for this film
    const existingRentals = await base44.entities.FilmRental.filter({
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
        }, { status: 400 });
      }
    }

    // Create or retrieve Stripe customer
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
          app_id: Deno.env.get("BASE44_APP_ID")
        }
      });
      customerId = customer.id;

      // Update user with Stripe customer ID using service role
      await base44.asServiceRole.entities.User.update(user.id, {
        stripe_customer_id: customerId
      });
    }

    // Create a pending FilmRental record
    const rental = await base44.entities.FilmRental.create({
      user_id: user.id,
      film_id: film_id,
      status: 'pending'
    });

    // Create Stripe Checkout Session using Price ID
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
      }
    });

    // Update rental with session ID
    await base44.entities.FilmRental.update(rental.id, {
      stripe_checkout_session_id: session.id
    });

    return Response.json({
      checkout_url: session.url,
      session_id: session.id
    });

  } catch (error) {
    console.error('Error creating rental checkout:', error);
    return Response.json({ 
      error: error.message || 'Failed to create checkout session' 
    }, { status: 500 });
  }
});