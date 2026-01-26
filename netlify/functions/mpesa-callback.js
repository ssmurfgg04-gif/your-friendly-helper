const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { Body } = JSON.parse(event.body || '{}');

    if (!Body?.stkCallback) {
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    const { ResultCode, CheckoutRequestID, CallbackMetadata } = Body.stkCallback;

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (ResultCode === 0) {
      let mpesaReceiptNumber = '';
      if (CallbackMetadata?.Item) {
        const receipt = CallbackMetadata.Item.find(item => item.Name === 'MpesaReceiptNumber');
        if (receipt) mpesaReceiptNumber = receipt.Value;
      }

      const { data: order } = await supabase
        .from('orders')
        .update({ status: 'confirmed', mpesa_transaction_id: mpesaReceiptNumber || CheckoutRequestID })
        .eq('mpesa_transaction_id', CheckoutRequestID)
        .select()
        .single();

      if (order && process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const currencySymbol = 'KSh';
        const shortOrderId = order.id.slice(0, 8).toUpperCase();
        const orderDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        const itemsHtml = (order.items || []).map(item => `
          <tr>
            <td style="padding: 16px 12px; border-bottom: 1px solid #e5e7eb;">
              <div><p style="margin: 0; font-weight: 500;">${item.name}</p><p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">Qty: ${item.quantity}</p></div>
            </td>
            <td style="padding: 16px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${currencySymbol}${(item.price * item.quantity).toFixed(2)}</td>
          </tr>
        `).join('');

        await resend.emails.send({
          from: 'Moenviron <orders@moenviron.com>',
          to: [order.user_email],
          subject: `Order Confirmed! #${shortOrderId}`,
          html: `
            <!DOCTYPE html><html><body style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #059669, #0d9488); padding: 40px 24px; text-align: center;">
                <h1 style="color: white; margin: 0;">Thank You for Your Order!</h1>
              </div>
              <div style="padding: 32px 24px;">
                <p>Hi <strong>${order.user_name || 'there'}</strong>,</p>
                <p>Your order has been confirmed. Order ID: <strong>#${shortOrderId}</strong></p>
                <p>Date: ${orderDate} | Payment: M-Pesa</p>
                <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
                  ${itemsHtml}
                  <tr style="background-color: #f3f4f6;">
                    <td style="padding: 16px 12px; font-weight: 600;">Total</td>
                    <td style="padding: 16px 12px; text-align: right; font-weight: 700; font-size: 20px; color: #059669;">${currencySymbol}${order.total_amount.toFixed(2)}</td>
                  </tr>
                </table>
              </div>
              <div style="padding: 24px; text-align: center; background: #f3f4f6;"><p>Thank you for choosing sustainable fashion!</p></div>
            </body></html>
          `,
        });
      }
    } else {
      await supabase.from('orders').update({ status: 'failed' }).eq('mpesa_transaction_id', CheckoutRequestID);
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    return { statusCode: 400, headers, body: JSON.stringify({ error: error.message }) };
  }
};
