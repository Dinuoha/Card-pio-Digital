import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRestaurant } from "@/lib/get-current-restaurant";
import ProductForm from "@/components/admin/ProductForm";
import type { Category, ProductWithAddons } from "@/lib/types";

export default async function EditarProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const restaurant = await getCurrentRestaurant();
  if (!restaurant) return null;

  const supabase = await createClient();
  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*, addon_groups(*, addon_options(*))")
      .eq("id", id)
      .eq("restaurant_id", restaurant.id)
      .maybeSingle(),
    supabase
      .from("categories")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .order("position"),
  ]);

  if (!product) notFound();

  const typedProduct = product as unknown as ProductWithAddons;
  typedProduct.addon_groups.sort((a, b) => a.position - b.position);
  for (const group of typedProduct.addon_groups) {
    group.addon_options.sort((a, b) => a.position - b.position);
  }

  return (
    <div>
      <h1>Editar produto</h1>
      <ProductForm
        restaurantId={restaurant.id}
        categories={(categories ?? []) as Category[]}
        product={typedProduct}
      />
    </div>
  );
}
