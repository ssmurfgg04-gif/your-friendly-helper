// Analytics service - placeholder for page view tracking
// Note: page_views table needs to be created in Cloud to enable full analytics

interface GeoData {
  country?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
}

const GEO_CACHE_KEY = 'moenv_geo_data';
const GEO_CACHE_TTL = 24 * 60 * 60 * 1000;

let visitorId: string | null = null;
let sessionId: string | null = null;
let cachedGeoData: GeoData | null = null;

function getVisitorId(): string {
  if (visitorId) return visitorId;
  
  try {
    const stored = localStorage.getItem('moenv_visitor_id');
    if (stored) {
      visitorId = stored;
      return stored;
    }
    
    visitorId = crypto.randomUUID();
    localStorage.setItem('moenv_visitor_id', visitorId);
  } catch {
    visitorId = crypto.randomUUID();
  }
  return visitorId;
}

function getSessionId(): string {
  if (sessionId) return sessionId;
  
  try {
    const stored = sessionStorage.getItem('moenv_session_id');
    if (stored) {
      sessionId = stored;
      return stored;
    }
    
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('moenv_session_id', sessionId);
  } catch {
    sessionId = crypto.randomUUID();
  }
  return sessionId;
}

async function getGeoData(): Promise<GeoData> {
  if (cachedGeoData) return cachedGeoData;

  try {
    const cached = sessionStorage.getItem(GEO_CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < GEO_CACHE_TTL) {
        cachedGeoData = data;
        return data;
      }
    }
  } catch {
    // Ignore cache errors
  }

  // Try to get geo data but don't block if it fails
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch('https://ipapi.co/json/', { 
      signal: controller.signal,
      mode: 'cors'
    });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      if (!data.error && data.country_name) {
        const geo: GeoData = {
          country: data.country_name,
          city: data.city,
          region: data.region,
          latitude: data.latitude,
          longitude: data.longitude
        };
        cachedGeoData = geo;
        try {
          sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify({ data: geo, timestamp: Date.now() }));
        } catch {
          // Ignore storage errors
        }
        return geo;
      }
    }
  } catch {
    // Silently fail - geo data is optional
  }
  
  return {};
}

export async function trackPageView(pagePath: string) {
  try {
    // Get visitor and session IDs for potential future use
    const _visitorId = getVisitorId();
    const _sessionId = getSessionId();
    
    // Get geo data but don't wait too long
    const geoPromise = getGeoData();
    const timeoutPromise = new Promise<GeoData>((resolve) => setTimeout(() => resolve({}), 2000));
    const _geo = await Promise.race([geoPromise, timeoutPromise]);
    
    // Note: page_views table needs to be created in Cloud to enable tracking
    // For now, just log to console in development
    console.debug('Page view tracked:', pagePath);
  } catch (error) {
    // Silently fail - analytics shouldn't break the app
    console.debug('Analytics tracking skipped:', error);
  }
}

export interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  topPages: { page_path: string; count: number }[];
  topCountries: { country: string; count: number }[];
  recentViews: { created_at: string; page_path: string; country: string; city: string }[];
  viewsByDay: { date: string; count: number }[];
}

export async function getAnalytics(_days: number = 30): Promise<AnalyticsData> {
  // Return placeholder data - page_views table needs to be created in Cloud
  return {
    totalViews: 0,
    uniqueVisitors: 0,
    topPages: [],
    topCountries: [],
    recentViews: [],
    viewsByDay: []
  };
}
