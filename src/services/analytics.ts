import { supabase } from "@/integrations/supabase/client";

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
    // Get geo data but don't wait too long
    const geoPromise = getGeoData();
    const timeoutPromise = new Promise<GeoData>((resolve) => setTimeout(() => resolve({}), 2000));
    const geo = await Promise.race([geoPromise, timeoutPromise]);
    
    await supabase.from('page_views').insert({
      page_path: pagePath,
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
      country: geo.country || null,
      city: geo.city || null,
      region: geo.region || null,
      latitude: geo.latitude || null,
      longitude: geo.longitude || null,
    });
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

export async function getAnalytics(days: number = 30): Promise<AnalyticsData> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString();

  const [viewsResult, uniqueResult, topPagesResult, topCountriesResult, recentResult, dailyResult] = await Promise.all([
    supabase
      .from('page_views')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startDateStr),
    
    supabase
      .from('page_views')
      .select('visitor_id')
      .gte('created_at', startDateStr),
    
    supabase
      .from('page_views')
      .select('page_path')
      .gte('created_at', startDateStr),
    
    supabase
      .from('page_views')
      .select('country')
      .gte('created_at', startDateStr)
      .not('country', 'is', null),
    
    supabase
      .from('page_views')
      .select('created_at, page_path, country, city')
      .gte('created_at', startDateStr)
      .order('created_at', { ascending: false })
      .limit(20),
    
    supabase
      .from('page_views')
      .select('created_at')
      .gte('created_at', startDateStr)
      .order('created_at', { ascending: true })
  ]);

  const uniqueVisitors = new Set(uniqueResult.data?.map(v => v.visitor_id)).size;

  const pageCount: Record<string, number> = {};
  topPagesResult.data?.forEach(v => {
    pageCount[v.page_path] = (pageCount[v.page_path] || 0) + 1;
  });
  const topPages = Object.entries(pageCount)
    .map(([page_path, count]) => ({ page_path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const countryCount: Record<string, number> = {};
  topCountriesResult.data?.forEach(v => {
    if (v.country) {
      countryCount[v.country] = (countryCount[v.country] || 0) + 1;
    }
  });
  const topCountries = Object.entries(countryCount)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const dayCount: Record<string, number> = {};
  dailyResult.data?.forEach(v => {
    const date = new Date(v.created_at).toISOString().split('T')[0];
    dayCount[date] = (dayCount[date] || 0) + 1;
  });
  const viewsByDay = Object.entries(dayCount)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalViews: viewsResult.count || 0,
    uniqueVisitors,
    topPages,
    topCountries,
    recentViews: recentResult.data?.map(v => ({
      created_at: v.created_at,
      page_path: v.page_path,
      country: v.country || 'Unknown',
      city: v.city || 'Unknown'
    })) || [],
    viewsByDay
  };
}
