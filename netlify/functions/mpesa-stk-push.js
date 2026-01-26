const { createClient } = require('@supabase/supabase-js');

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
    const { phone, amount, orderId, customerEmail, customerName, items, customerLocation, locationMetadata } = JSON.parse(event.body);

    if (!phone || !amount) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Phone number and amount are required' }) };
    }

    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

    if (!consumerKey || !consumerSecret) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'M-Pesa credentials not configured' }) };
    }

    const authString = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const tokenResponse = await fetch(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      { headers: { Authorization: `Basic ${authString}` } }
    );
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const shortCode = '174379';
    const passKey = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
    const password = Buffer.from(`${shortCode}${passKey}${timestamp}`).toString('base64');

    let formattedPhone = phone.replace(/\s/g, '');
    if (formattedPhone.startsWith('+')) formattedPhone = formattedPhone.slice(1);
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.slice(1);

    const callbackUrl = `${process.env.URL || process.env.DEPLOY_URL}/.netlify/functions/mpesa-callback`;
    
    const stkResponse = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          BusinessShortCode: shortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: 'CustomerPayBillOnline',
          Amount: Math.round(amount),
          PartyA: formattedPhone,
          PartyB: shortCode,
          PhoneNumber: formattedPhone,
          CallBackURL: callbackUrl,
          AccountReference: orderId || 'Moenviron',
          TransactionDesc: 'Moenviron Purchase',
        }),
      }
    );

    const stkData = await stkResponse.json();

    if (stkData.ResponseCode === '0' && customerEmail && items) {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      await supabase.from('orders').insert({
        user_email: customerEmail,
        user_name: customerName,
        total_amount: amount,
        currency: 'KES',
        payment_method: 'mpesa',
        mpesa_transaction_id: stkData.CheckoutRequestID,
        items,
        status: 'pending',
        customer_location: customerLocation,
        location_metadata: locationMetadata,
      });
    }

    return { statusCode: 200, headers, body: JSON.stringify(stkData) };
  } catch (error) {
    console.error('M-Pesa error:', error);
    return { statusCode: 400, headers, body: JSON.stringify({ error: error.message }) };
  }
};
