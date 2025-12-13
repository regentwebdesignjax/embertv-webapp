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

    const { stripe_product_id, film_id } = await req.json();

    if (!stripe_product_id) {
      return Response.json({ 
        error: 'Stripe Product ID is required' 
      }, { status: 400 });
    }

    // Retrieve the Product from Stripe
    const product = await stripe.products.retrieve(stripe_product_id);

    if (!product) {
      return Response.json({ 
        error: 'Product not found in Stripe' 
      }, { status: 404 });
    }

    let price = null;

    // Check if product has a default_price
    if (product.default_price) {
      const priceId = typeof product.default_price === 'string' 
        ? product.default_price 
        : product.default_price.id;
      price = await stripe.prices.retrieve(priceId);
    } else {
      // List all prices for this product
      const prices = await stripe.prices.list({
        product: stripe_product_id,
        active: true,
        type: 'one_time',
        limit: 100,
      });

      // Find the first active one-time price
      price = prices.data.find(p => p.active && p.type === 'one_time');
    }

    if (!price) {
      return Response.json({ 
        error: 'No active one-time Price found for this Stripe Product. Please configure at least one active one-time Price in Stripe.' 
      }, { status: 400 });
    }

    // Prepare the update data
    const updateData = {
      stripe_product_id: stripe_product_id,
      stripe_price_id: price.id,
      rental_price_cents: price.unit_amount,
      rental_currency: price.currency,
    };

    // Update the film using service role
    if (film_id) {
      await base44.asServiceRole.entities.Film.update(film_id, updateData);
    }

    return Response.json({
      success: true,
      price_data: {
        stripe_price_id: price.id,
        rental_price_cents: price.unit_amount,
        rental_currency: price.currency,
        formatted_price: `${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`,
      }
    });

  } catch (error) {
    console.error('Error syncing Stripe price:', error);
    return Response.json({ 
      error: error.message || 'Failed to sync price from Stripe' 
    }, { status: 500 });
  }
});