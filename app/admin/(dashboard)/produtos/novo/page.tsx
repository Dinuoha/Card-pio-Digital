import { createClient } from "@/lib/supabase/server";
import { getCurrentRestaurant } from "@/lib/get-current-restaurant";
import ProductForm from "@/components/admin/ProductForm";
import type { Category } from "@/lib/types";

export default async function NovoProdutoPage() {
  const restaurant = await getCurrentRestaurant();
  if (!restaurant) return null;

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .order("position");

  return (
    <div>
      <h1>Novo produto</h1>
      <ProductForm restaurantId={restaurant.id} categories={(categories ?? []) as Category[]} />
    </div>
  );
}
