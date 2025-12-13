import { createClient } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY_LIVE"), {
  apiVersion: '2023-10-16',
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET_LIVE");

Deno.serve(async (req) => {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    console.log('Webhook request received');
    console.log('Body length:', body.length);
    console.log('Signature present:', !!signature);
    console.log('Webhook secret configured:', !!webhookSecret);
    console.log('Webhook secret starts with:', webhookSecret?.substring(0, 7));

    if (!signature) {
      console.error('No signature provided');
      return Response.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      console.error('Error type:', err.type);
      console.error('Full error:', err);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Webhook event received:', event.type);

    // Initialize Base44 client with service role for webhook operations
    const base44 = createClient({
      serviceRoleKey: Deno.env.get("BASE44_SERVICE_ROLE_KEY"),
      appId: Deno.env.get("BASE44_APP_ID"),
    });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Processing checkout.session.completed for session:', session.id);
        console.log('Session metadata:', session.metadata);
        console.log('Session amount_total:', session.amount_total);
        console.log('Session payment_intent:', session.payment_intent);
        
        if (session.metadata?.rental_id) {
          const purchasedAt = new Date();
          const expiresAt = new Date(purchasedAt.getTime() + 24 * 60 * 60 * 1000);

          console.log('Updating rental:', session.metadata.rental_id);
          console.log('Update data:', {
            status: 'active',
            stripe_payment_intent_id: session.payment_intent,
            purchased_at: purchasedAt.toISOString(),
            expires_at: expiresAt.toISOString(),
            amount_cents: session.amount_total,
            currency: session.currency
          });

          await base44.entities.FilmRental.update(session.metadata.rental_id, {
            status: 'active',
            stripe_payment_intent_id: session.payment_intent,
            purchased_at: purchasedAt.toISOString(),
            expires_at: expiresAt.toISOString(),
            amount_cents: session.amount_total,
            currency: session.currency
          });
          console.log('Rental updated successfully with amount:', session.amount_total);
        } else {
          console.warn('No rental_id in session metadata');
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        
        const rentals = await base44.entities.FilmRental.filter({
          stripe_payment_intent_id: paymentIntent.id
        });

        for (const rental of rentals) {
          await base44.entities.FilmRental.update(rental.id, {
            status: 'failed'
          });
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        console.log('Processing charge.refunded for payment_intent:', charge.payment_intent);
        
        // Find rentals associated with this payment intent
        const rentals = await base44.entities.FilmRental.filter({
          stripe_payment_intent_id: charge.payment_intent
        });

        console.log(`Found ${rentals.length} rentals to refund`);

        for (const rental of rentals) {
          // Mark rental as expired/refunded so it's no longer active
          await base44.entities.FilmRental.update(rental.id, {
            status: 'expired'
          });
          console.log(`Deactivated rental ${rental.id} due to refund`);
        }
        break;
      }

      case 'price.updated':
      case 'price.created': {
        const price = event.data.object;
        
        // Only process active one-time prices
        if (price.active && price.type === 'one_time') {
          const productId = typeof price.product === 'string' ? price.product : price.product.id;
          
          const films = await base44.entities.Film.filter({
            stripe_product_id: productId
          });

          for (const film of films) {
            await base44.entities.Film.update(film.id, {
              stripe_price_id: price.id,
              rental_price_cents: price.unit_amount,
              rental_currency: price.currency
            });
          }

          console.log(`Updated ${films.length} films with new price from ${price.id}`);
        }
        break;
      }

      case 'price.deleted': {
        const price = event.data.object;
        
        const films = await base44.entities.Film.filter({
          stripe_price_id: price.id
        });

        for (const film of films) {
          await base44.entities.Film.update(film.id, {
            stripe_price_id: null,
            rental_price_cents: null
          });
        }

        console.log(`Cleared price data for ${films.length} films after price deletion: ${price.id}`);
        break;
      }

      case 'product.updated': {
        const product = event.data.object;
        
        if (product.default_price) {
          const priceId = typeof product.default_price === 'string' 
            ? product.default_price 
            : product.default_price.id;
          
          const price = await stripe.prices.retrieve(priceId);
          
          if (price.active && price.type === 'one_time') {
            const films = await base44.entities.Film.filter({
              stripe_product_id: product.id
            });

            for (const film of films) {
              await base44.entities.Film.update(film.id, {
                stripe_price_id: price.id,
                rental_price_cents: price.unit_amount,
                rental_currency: price.currency
              });
            }

            console.log(`Updated ${films.length} films with new default price from product ${product.id}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});