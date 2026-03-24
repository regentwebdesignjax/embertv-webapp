import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { stripe_product_id, film_id } = body;

    // Create Base44 client from request
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    if (!stripe_product_id) {
      return Response.json({ error: 'Stripe Product ID is required' }, { status: 400, headers: corsHeaders });
    }

    console.log(`[SyncPrice] Fetching Stripe product: ${stripe_product_id}`);

    // Retrieve Product from Stripe with expanded default_price
    let product;
    try {
      product = await stripe.products.retrieve(stripe_product_id, {
        expand: ['default_price']
      });
    } catch (e) {
      console.error(`[SyncPrice] Stripe Error: ${e.message}`);
      return Response.json({ error: 'Product not found in Stripe' }, { status: 404, headers: corsHeaders });
    }

    // Find the most recent active one-time price
    const prices = await stripe.prices.list({
      product: stripe_product_id,
      active: true,
      type: 'one_time',
      limit: 100,
    });

    // Sort by created date (newest first) and get the first active one-time price
    const sortedPrices = prices.data.sort((a, b) => b.created - a.created);
    let price = sortedPrices[0];

    // If product has a default_price that's active, prefer that
    if (product.default_price && typeof product.default_price === 'object' && product.default_price.active) {
      price = product.default_price;
    } else if (product.default_price && typeof product.default_price === 'string') {
      // If default_price is just an ID, check if it's in our sorted list
      const defaultPrice = sortedPrices.find(p => p.id === product.default_price);
      if (defaultPrice && defaultPrice.active) {
        price = defaultPrice;
      }
    }

    if (!price) {
      return Response.json({ 
        error: 'No active one-time Price found for this Stripe Product.' 
      }, { status: 400, headers: corsHeaders });
    }

    // Update Film in DB using service role
    if (film_id) {
      await base44.asServiceRole.entities.Film.update(film_id, {
        stripe_product_id: stripe_product_id,
        stripe_price_id: price.id,
        rental_price_cents: price.unit_amount,
        rental_currency: price.currency,
      });
    }

    return Response.json({
      success: true,
      price_data: {
        stripe_price_id: price.id,
        rental_price_cents: price.unit_amount,
        rental_currency: price.currency,
        formatted_price: `${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`,
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error syncing Stripe price:', error);
    return Response.json({ 
      error: error.message || 'Failed to sync price from Stripe' 
    }, { status: 500, headers: corsHeaders });
  }
});