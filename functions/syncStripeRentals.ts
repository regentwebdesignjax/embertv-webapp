import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY_LIVE"), {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting Stripe rental sync...');

    // Get all films to map product IDs
    const films = await base44.asServiceRole.entities.Film.list();
    const filmsByProductId = {};
    films.forEach(film => {
      if (film.stripe_product_id) {
        filmsByProductId[film.stripe_product_id] = film;
      }
    });

    // Get completed checkout sessions from Stripe (last 30 days)
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
    const sessions = await stripe.checkout.sessions.list({
      created: { gte: thirtyDaysAgo },
      status: 'complete',
      limit: 100,
    });

    console.log(`Found ${sessions.data.length} completed sessions in Stripe`);

    let synced = 0;
    let skipped = 0;

    for (const session of sessions.data) {
      if (!session.metadata?.rental_id) {
        skipped++;
        continue;
      }

      // Check if rental exists
      const existingRentals = await base44.asServiceRole.entities.FilmRental.filter({
        id: session.metadata.rental_id
      });

      if (existingRentals.length === 0) {
        skipped++;
        continue;
      }

      const rental = existingRentals[0];

      // Update if still pending or missing payment data
      if (rental.status === 'pending' || !rental.amount_cents || !rental.net_amount_cents) {
        const purchasedAt = new Date(session.created * 1000);
        const expiresAt = new Date(purchasedAt.getTime() + 48 * 60 * 60 * 1000);

        // Fetch payment intent to get balance transaction for net revenue
        let netAmountCents = null;
        if (session.payment_intent) {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent, {
              expand: ['latest_charge.balance_transaction']
            });
            
            const balanceTransaction = paymentIntent.latest_charge?.balance_transaction;
            if (balanceTransaction && typeof balanceTransaction === 'object') {
              netAmountCents = balanceTransaction.net;
            }
          } catch (error) {
            console.error(`Failed to fetch balance transaction for rental ${rental.id}:`, error);
          }
        }

        const updateData = {
          status: 'active',
          stripe_payment_intent_id: session.payment_intent,
          purchased_at: purchasedAt.toISOString(),
          expires_at: expiresAt.toISOString(),
          amount_cents: session.amount_total,
          currency: session.currency
        };

        if (netAmountCents !== null) {
          updateData.net_amount_cents = netAmountCents;
        }

        await base44.asServiceRole.entities.FilmRental.update(rental.id, updateData);

        synced++;
        console.log(`Synced rental ${rental.id} with net revenue: ${netAmountCents}`);
      } else {
        skipped++;
      }
    }

    console.log(`Sync complete: ${synced} updated, ${skipped} skipped`);

    return Response.json({
      success: true,
      synced,
      skipped,
      total: sessions.data.length
    });

  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});