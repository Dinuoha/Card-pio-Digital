import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import CardapioClient from "./CardapioClient";
import type { CategoryWithProducts, Restaurant } from "@/lib/types";

async function getRestaurantData(slug: string) {
  const supabase = await createClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!restaurant) return null;

  const { data: categoriesData } = await supabase
    .from("categories")
    .select("*, products(*, addon_groups(*, addon_options(*)))")
    .eq("restaurant_id", restaurant.id);

  const categories = (categoriesData ?? []) as unknown as CategoryWithProducts[];
  categories.sort((a, b) => a.position - b.position);
  for (const category of categories) {
    category.products.sort((a, b) => a.position - b.position);
    for (const product of category.products) {
      product.addon_groups.sort((a, b) => a.position - b.position);
      for (const group of product.addon_groups) {
        group.addon_options.sort((a, b) => a.position - b.position);
      }
    }
  }

  return { restaurant: restaurant as Restaurant, categories };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getRestaurantData(slug);
  if (!data) return { title: "Cardápio não encontrado" };
  return {
    title: `${data.restaurant.name} — Cardápio`,
  };
}

export default async function CardapioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getRestaurantData(slug);

  if (!data) notFound();

  return (
    <CardapioClient restaurant={data.restaurant} categories={data.categories} />
  );
}
