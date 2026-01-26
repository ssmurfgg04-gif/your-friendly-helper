import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CMSContent {
  id: string;
  page_name: string;
  section_key: string;
  content: Record<string, unknown>;
  is_active: boolean;
}

export function useCMSContent(pageName: string, sectionKey: string) {
  return useQuery({
    queryKey: ["cms-content", pageName, sectionKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .eq("page_name", pageName)
        .eq("section_key", sectionKey)
        .eq("is_active", true)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }
      return data as CMSContent;
    },
  });
}

export function useAllCMSContent(pageName?: string) {
  return useQuery({
    queryKey: ["cms-content-all", pageName],
    queryFn: async () => {
      let query = supabase.from("site_content").select("*");
      if (pageName) {
        query = query.eq("page_name", pageName);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as CMSContent[];
    },
  });
}
