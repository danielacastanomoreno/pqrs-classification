import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Pqrs } from "@/lib/pqrs";

export function usePqrs() {
  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase
      .channel("pqrs-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "pqrs" }, () => qc.invalidateQueries({ queryKey: ["pqrs"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);
  return useQuery({
    queryKey: ["pqrs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pqrs").select("*").order("fecha_creacion", { ascending: false });
      if (error) throw error;
      return data as Pqrs[];
    },
  });
}

export function useAreas() {
  return useQuery({
    queryKey: ["areas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("areas").select("*");
      if (error) throw error;
      return data as { nombre: string; encargado: string; correo: string | null }[];
    },
  });
}
