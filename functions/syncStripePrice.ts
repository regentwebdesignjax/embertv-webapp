import { createClient, createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
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

function getServiceClient() {
  return createClient({
    appId: Deno.env.get("BASE44_APP_ID"),
    serviceRoleKey: Deno.env.get("BASE44_SERVICE_ROLE_KEY")
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { stripe_product_id, film_id } = body;

    // Authenticate Admin User
    const requestClient = createClientFromRequest(req);
    const user = await requestClient.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    if (!stripe_product_id) {
      return Response.json({ error: 'Stripe Product ID is required' }, { status: 400, headers: corsHeaders });
    }

    console.log(`[SyncPrice] Fetching Stripe product: ${stripe_product_id}`);

    // Retrieve Product from Stripe
    let product;
    try {
      product = await stripe.products.retrieve(stripe_product_id);
    } catch (e) {
      console.error(`[SyncPrice] Stripe Error: ${e.message}`);
      return Response.json({ error: 'Product not found in Stripe' }, { status: 404, headers: corsHeaders });
    }

    // Find Price
    let price = null;
    if (product.default_price) {
      const priceId = typeof product.default_price === 'string' 
        ? product.default_price 
        : product.default_price.id;
      price = await stripe.prices.retrieve(priceId);
    } else {
      const prices = await stripe.prices.list({
        product: stripe_product_id,
        active: true,
        type: 'one_time',
        limit: 100,
      });
      price = prices.data.find(p => p.active && p.type === 'one_time');
    }

    if (!price) {
      return Response.json({ 
        error: 'No active one-time Price found for this Stripe Product.' 
      }, { status: 400, headers: corsHeaders });
    }

    // Update Film in DB using Admin Client
    if (film_id) {
      const adminClient = getServiceClient();
      await adminClient.entities.Film.update(film_id, {
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