"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRestaurant } from "@/lib/get-current-restaurant";
import { slugify } from "@/lib/slug";
import { DAY_ORDER, type BusinessHours } from "@/lib/business-hours";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ---------- Categorias ----------

export async function createCategory(formData: FormData) {
  const restaurant = await getCurrentRestaurant();
  if (!restaurant) throw new Error("Restaurante não encontrado.");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Nome da categoria é obrigatório.");

  const supabase = await createClient();
  await supabase.from("categories").insert({
    restaurant_id: restaurant.id,
    name,
    position: Number(formData.get("position") ?? 0),
  });

  revalidatePath("/admin/categorias");
  revalidatePath(`/${restaurant.slug}`);
}

export async function updateCategory(formData: FormData) {
  const restaurant = await getCurrentRestaurant();
  if (!restaurant) throw new Error("Restaurante não encontrado.");
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Nome da categoria é obrigatório.");

  const supabase = await createClient();
  await supabase
    .from("categories")
    .update({ name, position: Number(formData.get("position") ?? 0) })
    .eq("id", id);

  revalidatePath("/admin/categorias");
  revalidatePath(`/${restaurant.slug}`);
}

export async function deleteCategory(formData: FormData) {
  const restaurant = await getCurrentRestaurant();
  if (!restaurant) throw new Error("Restaurante não encontrado.");
  const id = String(formData.get("id"));

  const supabase = await createClient();
  await supabase.from("categories").delete().eq("id", id);

  revalidatePath("/admin/categorias");
  revalidatePath(`/${restaurant.slug}`);
}

// ---------- Produtos ----------

export type AddonGroupInput = {
  id?: string;
  title: string;
  selection_type: "single" | "multiple";
  required: boolean;
  max_selections: number | null;
  options: { id?: string; name: string; price: number }[];
};

async function syncAddonGroups(productId: string, groups: AddonGroupInput[]) {
  const supabase = await createClient();

  const { data: existingGroups } = await supabase
    .from("addon_groups")
    .select("id")
    .eq("product_id", productId);

  const keepGroupIds = groups.filter((g) => g.id).map((g) => g.id as string);
  const groupIdsToDelete = (existingGroups ?? [])
    .map((g) => g.id)
    .filter((id) => !keepGroupIds.includes(id));

  if (groupIdsToDelete.length > 0) {
    await supabase.from("addon_groups").delete().in("id", groupIdsToDelete);
  }

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    let groupId = group.id;

    if (groupId) {
      await supabase
        .from("addon_groups")
        .update({
          title: group.title,
          selection_type: group.selection_type,
          required: group.required,
          max_selections: group.max_selections,
          position: i,
        })
        .eq("id", groupId);
    } else {
      const { data: inserted } = await supabase
        .from("addon_groups")
        .insert({
          product_id: productId,
          title: group.title,
          selection_type: group.selection_type,
          required: group.required,
          max_selections: group.max_selections,
          position: i,
        })
        .select("id")
        .single();
      groupId = inserted?.id;
    }

    if (!groupId) continue;

    const { data: existingOptions } = await supabase
      .from("addon_options")
      .select("id")
      .eq("addon_group_id", groupId);

    const keepOptionIds = group.options.filter((o) => o.id).map((o) => o.id as string);
    const optionIdsToDelete = (existingOptions ?? [])
      .map((o) => o.id)
      .filter((id) => !keepOptionIds.includes(id));

    if (optionIdsToDelete.length > 0) {
      await supabase.from("addon_options").delete().in("id", optionIdsToDelete);
    }

    for (let j = 0; j < group.options.length; j++) {
      const option = group.options[j];
      if (option.id) {
        await supabase
          .from("addon_options")
          .update({ name: option.name, price: option.price, position: j })
          .eq("id", option.id);
      } else {
        await supabase.from("addon_options").insert({
          addon_group_id: groupId,
          name: option.name,
          price: option.price,
          position: j,
        });
      }
    }
  }
}

export async function saveProduct(input: {
  id?: string;
  name: string;
  description: string;
  price: number;
  category_id: string | null;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  addon_groups: AddonGroupInput[];
}) {
  const restaurant = await getCurrentRestaurant();
  if (!restaurant) throw new Error("Restaurante não encontrado.");
  if (!input.name.trim()) throw new Error("Nome do produto é obrigatório.");

  const supabase = await createClient();

  let productId = input.id;

  if (productId) {
    await supabase
      .from("products")
      .update({
        name: input.name,
        description: input.description || null,
        price: input.price,
        category_id: input.category_id,
        image_url: input.image_url,
        is_active: input.is_active,
        is_featured: input.is_featured,
      })
      .eq("id", productId);
  } else {
    const { data: inserted, error } = await supabase
      .from("products")
      .insert({
        restaurant_id: restaurant.id,
        name: input.name,
        description: input.description || null,
        price: input.price,
        category_id: input.category_id,
        image_url: input.image_url,
        is_active: input.is_active,
        is_featured: input.is_featured,
      })
      .select("id")
      .single();
    if (error || !inserted) throw new Error(error?.message ?? "Erro ao criar produto.");
    productId = inserted.id;
  }

  await syncAddonGroups(productId!, input.addon_groups);

  revalidatePath("/admin/produtos");
  revalidatePath(`/${restaurant.slug}`);
  return { id: productId! };
}

export async function toggleProductActive(formData: FormData) {
  const restaurant = await getCurrentRestaurant();
  if (!restaurant) throw new Error("Restaurante não encontrado.");
  const id = String(formData.get("id"));
  const isActive = formData.get("is_active") === "true";

  const supabase = await createClient();
  await supabase.from("products").update({ is_active: !isActive }).eq("id", id);

  revalidatePath("/admin/produtos");
  revalidatePath(`/${restaurant.slug}`);
}

export async function deleteProduct(formData: FormData) {
  const restaurant = await getCurrentRestaurant();
  if (!restaurant) throw new Error("Restaurante não encontrado.");
  const id = String(formData.get("id"));

  const supabase = await createClient();
  await supabase.from("products").delete().eq("id", id);

  revalidatePath("/admin/produtos");
  revalidatePath(`/${restaurant.slug}`);
}

// ---------- Configurações ----------

export async function updateRestaurantSettings(formData: FormData) {
  const restaurant = await getCurrentRestaurant();
  if (!restaurant) throw new Error("Restaurante não encontrado.");

  const name = String(formData.get("name") ?? "").trim();
  const slugRaw = String(formData.get("slug") ?? "").trim();
  const slug = slugify(slugRaw || name);
  const whatsapp_number = String(formData.get("whatsapp_number") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const primary_color = String(formData.get("primary_color") ?? "#000000");
  const deliveryFeeRaw = String(formData.get("delivery_fee") ?? "").trim();
  const delivery_fee = deliveryFeeRaw ? Number(deliveryFeeRaw) : null;
  const logo_url = String(formData.get("logo_url") ?? "").trim() || null;
  const instagram =
    String(formData.get("instagram") ?? "").trim().replace(/^@/, "") || null;
  const payment_methods = formData.getAll("payment_methods").map((v) => String(v));

  const business_hours = DAY_ORDER.reduce((acc, day) => {
    acc[day] = {
      open: String(formData.get(`hours_${day}_open`) ?? "18:00"),
      close: String(formData.get(`hours_${day}_close`) ?? "23:00"),
      closed: formData.get(`hours_${day}_closed`) === "on",
    };
    return acc;
  }, {} as BusinessHours);

  if (!name) throw new Error("Nome do restaurante é obrigatório.");
  if (!slug) throw new Error("Slug inválido.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurants")
    .update({
      name,
      slug,
      whatsapp_number,
      address,
      primary_color,
      delivery_fee,
      logo_url,
      instagram,
      payment_methods,
      business_hours,
    })
    .eq("id", restaurant.id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/configuracoes");
  revalidatePath(`/${restaurant.slug}`);
  if (slug !== restaurant.slug) revalidatePath(`/${slug}`);
}
