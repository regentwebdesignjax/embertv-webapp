import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY_LIVE"), {
  apiVersion: '2023-10-16',
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET_LIVE");

Deno.serve(async (req) => {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return Response.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event;

  try {
    // CRITICAL: Must use constructEventAsync for Deno (SubtleCrypto is async)
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      endpointSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return Response.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Initialize Base44 SDK AFTER webhook validation
  const base44 = createClientFromRequest(req);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const rentalId = session.metadata?.rental_id;
        const filmId = session.metadata?.film_id;

        if (!rentalId || !filmId) {
          console.error('Missing rental_id or film_id in session metadata');
          break;
        }

        // Retrieve balance transaction to get net amount
        const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
        let netAmountCents = null;

        if (paymentIntent.latest_charge) {
          const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
          if (charge.balance_transaction) {
            const balanceTransaction = await stripe.balanceTransactions.retrieve(charge.balance_transaction);
            netAmountCents = balanceTransaction.net;
          }
        }

        // Update rental to active with 48-hour expiration
        const purchasedAt = new Date();
        const expiresAt = new Date(purchasedAt.getTime() + 48 * 60 * 60 * 1000);

        await base44.asServiceRole.entities.FilmRental.update(rentalId, {
          status: 'active',
          stripe_payment_intent_id: session.payment_intent,
          purchased_at: purchasedAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          amount_cents: session.amount_total,
          net_amount_cents: netAmountCents,
          currency: session.currency
        });

        console.log(`Rental ${rentalId} activated for 48 hours`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        
        // Find rental by payment intent ID
        const rentals = await base44.asServiceRole.entities.FilmRental.filter({
          stripe_payment_intent_id: paymentIntent.id
        });

        if (rentals.length > 0) {
          await base44.asServiceRole.entities.FilmRental.update(rentals[0].id, {
            status: 'failed'
          });
          console.log(`Rental ${rentals[0].id} marked as failed`);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        
        // Find rental by payment intent ID
        const rentals = await base44.asServiceRole.entities.FilmRental.filter({
          stripe_payment_intent_id: charge.payment_intent
        });

        if (rentals.length > 0) {
          await base44.asServiceRole.entities.FilmRental.update(rentals[0].id, {
            status: 'expired'
          });
          console.log(`Rental ${rentals[0].id} marked as expired due to refund`);
        }
        break;
      }

      case 'price.created':
      case 'price.updated': {
        const price = event.data.object;
        
        // Find films using this price
        const films = await base44.asServiceRole.entities.Film.filter({
          stripe_price_id: price.id
        });

        for (const film of films) {
          await base44.asServiceRole.entities.Film.update(film.id, {
            rental_price_cents: price.unit_amount,
            rental_currency: price.currency
          });
          console.log(`Updated price for film ${film.id}`);
        }
        break;
      }

      case 'product.updated': {
        const product = event.data.object;
        
        // Find films using this product
        const films = await base44.asServiceRole.entities.Film.filter({
          stripe_product_id: product.id
        });

        // If product has default_price, sync it
        if (product.default_price && films.length > 0) {
          const priceId = typeof product.default_price === 'string' 
            ? product.default_price 
            : product.default_price.id;
          
          const price = await stripe.prices.retrieve(priceId);
          
          for (const film of films) {
            await base44.asServiceRole.entities.Film.update(film.id, {
              stripe_price_id: price.id,
              rental_price_cents: price.unit_amount,
              rental_currency: price.currency
            });
            console.log(`Updated film ${film.id} with new default price from product`);
          }
        }
        break;
      }

      case 'price.deleted': {
        const price = event.data.object;
        
        // Find films using this price and clear it
        const films = await base44.asServiceRole.entities.Film.filter({
          stripe_price_id: price.id
        });

        for (const film of films) {
          await base44.asServiceRole.entities.Film.update(film.id, {
            stripe_price_id: null,
            rental_price_cents: null
          });
          console.log(`Cleared price for film ${film.id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});