export type Restaurant = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  whatsapp_number: string | null;
  address: string | null;
  delivery_fee: number | null;
  opening_hours: string | null;
  instagram: string | null;
  payment_methods: string[];
  business_hours: import("./business-hours").BusinessHours | null;
  created_at: string;
};

export type Category = {
  id: string;
  restaurant_id: string;
  name: string;
  position: number;
  created_at: string;
};

export type Product = {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  position: number;
  created_at: string;
};

export type AddonSelectionType = "single" | "multiple";

export type AddonGroup = {
  id: string;
  product_id: string;
  title: string;
  selection_type: AddonSelectionType;
  required: boolean;
  max_selections: number | null;
  position: number;
};

export type AddonOption = {
  id: string;
  addon_group_id: string;
  name: string;
  price: number;
  position: number;
};

export type AddonGroupWithOptions = AddonGroup & {
  addon_options: AddonOption[];
};

export type ProductWithAddons = Product & {
  addon_groups: AddonGroupWithOptions[];
};

export type CategoryWithProducts = Category & {
  products: ProductWithAddons[];
};
