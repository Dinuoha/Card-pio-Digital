import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Restaurant } from "@/lib/types";

export const getCurrentRestaurant = cache(async (): Promise<Restaurant | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  return restaurant as Restaurant | null;
});
