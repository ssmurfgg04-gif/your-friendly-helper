import { supabase } from "@/integrations/supabase/client";

export type ProductInteractionType = 'view' | 'add_to_cart' | 'purchase' | 'checkout_click';

const getVisitorId = () => {
  let visitorId = localStorage.getItem('moenviron-visitor-id');
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem('moenviron-visitor-id', visitorId);
  }
  return visitorId;
};

const getSessionId = () => {
  let sessionId = sessionStorage.getItem('moenviron-session-id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('moenviron-session-id', sessionId);
  }
  return sessionId;
};

export const trackProductInteraction = async (
  productId: string, 
  type: ProductInteractionType, 
  productName?: string
) => {
  try {
    const eventType = type === 'checkout_click' ? 'add_to_cart' : type;
    
    const { error } = await supabase.from('product_events').insert({
      product_id: productId,
      product_name: productName || 'Unknown Product',
      event_type: eventType,
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
    });
    
    if (error) {
      console.error(`Error tracking product ${type}:`, error);
    }
  } catch (err) {
    console.error(`Unexpected error tracking product ${type}:`, err);
  }
};
