import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@14.11.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY_LIVE'), {
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
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    // Find or create Stripe customer
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });

    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          base44_user_id: user.id
        }
      });
      customerId = customer.id;
    }

    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.headers.get('origin')}/Profile`,
    });

    return Response.json({ url: session.url }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error creating customer portal:', error);
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});