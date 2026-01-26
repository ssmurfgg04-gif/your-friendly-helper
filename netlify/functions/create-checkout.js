const Stripe = require('stripe');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
    const { items, customerEmail, customerName, customerLocation, locationMetadata, mode } = JSON.parse(event.body);

    if (!items || items.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'No items provided' }) };
    }

    if (!customerEmail) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Customer email is required' }) };
    }

    const baseUrl = process.env.URL || process.env.DEPLOY_URL || 'https://moenviron.com';

    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'gbp',
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: mode === 'checkout_session' ? 'payment' : 'payment',
      customer_email: customerEmail,
      success_url: `${baseUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart`,
      metadata: {
        customer_name: customerName || '',
        customer_location: customerLocation || '',
        location_metadata: locationMetadata ? JSON.stringify(locationMetadata) : '',
        items: JSON.stringify(items.map(i => ({ id: i.id, name: i.name, qty: i.quantity, price: i.price }))),
      },
    };

    if (mode !== 'payment') {
      sessionConfig.shipping_address_collection = {
        allowed_countries: ['GB', 'KE', 'UG', 'TZ', 'RW', 'US', 'NG', 'ZA', 'GH', 'ET'],
      };
      sessionConfig.shipping_options = [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 500, currency: 'gbp' },
            display_name: 'Standard Shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 5 },
              maximum: { unit: 'business_day', value: 10 },
            },
          },
        },
      ];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url, sessionId: session.id }),
    };
  } catch (error) {
    console.error('Checkout error:', error);
    return { statusCode: 400, headers, body: JSON.stringify({ error: error.message || 'Checkout failed' }) };
  }
};
