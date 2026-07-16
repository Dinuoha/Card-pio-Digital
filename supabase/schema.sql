-- Cardápio Digital — schema Fase 1
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase (Database > SQL Editor).

create extension if not exists pgcrypto;

-- ============================================================
-- TABELAS
-- ============================================================

create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  slug text not null unique,
  logo_url text,
  primary_color text not null default '#000000',
  whatsapp_number text,
  address text,
  delivery_fee numeric(10, 2),
  opening_hours text,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  name text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants (id) on delete cascade,
  category_id uuid references categories (id) on delete set null,
  name text not null,
  description text,
  price numeric(10, 2) not null default 0,
  image_url text,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists addon_groups (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  title text not null,
  selection_type text not null default 'multiple' check (selection_type in ('single', 'multiple')),
  required boolean not null default false,
  max_selections integer,
  position integer not null default 0
);

create table if not exists addon_options (
  id uuid primary key default gen_random_uuid(),
  addon_group_id uuid not null references addon_groups (id) on delete cascade,
  name text not null,
  price numeric(10, 2) not null default 0,
  position integer not null default 0
);

create index if not exists categories_restaurant_id_idx on categories (restaurant_id);
create index if not exists products_restaurant_id_idx on products (restaurant_id);
create index if not exists products_category_id_idx on products (category_id);
create index if not exists addon_groups_product_id_idx on addon_groups (product_id);
create index if not exists addon_options_addon_group_id_idx on addon_options (addon_group_id);
create index if not exists restaurants_owner_id_idx on restaurants (owner_id);

-- ============================================================
-- RLS
-- ============================================================

alter table restaurants enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table addon_groups enable row level security;
alter table addon_options enable row level security;

-- restaurants: dado público (é a vitrine), só o dono edita
-- (select auth.uid()) em vez de auth.uid() evita reavaliação por linha (perf)
create policy "restaurants_public_select" on restaurants
  for select using (true);

create policy "restaurants_owner_insert" on restaurants
  for insert with check (owner_id = (select auth.uid()));

create policy "restaurants_owner_update" on restaurants
  for update using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy "restaurants_owner_delete" on restaurants
  for delete using (owner_id = (select auth.uid()));

-- categories: público lê, só o dono do restaurante edita
-- insert/update/delete separados (em vez de "for all") evitam duplicar a policy de SELECT
create policy "categories_public_select" on categories
  for select using (true);

create policy "categories_owner_insert" on categories
  for insert with check (
    exists (select 1 from restaurants r where r.id = categories.restaurant_id and r.owner_id = (select auth.uid()))
  );

create policy "categories_owner_update" on categories
  for update using (
    exists (select 1 from restaurants r where r.id = categories.restaurant_id and r.owner_id = (select auth.uid()))
  ) with check (
    exists (select 1 from restaurants r where r.id = categories.restaurant_id and r.owner_id = (select auth.uid()))
  );

create policy "categories_owner_delete" on categories
  for delete using (
    exists (select 1 from restaurants r where r.id = categories.restaurant_id and r.owner_id = (select auth.uid()))
  );

-- products: público só vê ativos; dono vê e edita tudo
create policy "products_public_select" on products
  for select using (
    is_active = true
    or exists (select 1 from restaurants r where r.id = products.restaurant_id and r.owner_id = (select auth.uid()))
  );

create policy "products_owner_insert" on products
  for insert with check (
    exists (select 1 from restaurants r where r.id = products.restaurant_id and r.owner_id = (select auth.uid()))
  );

create policy "products_owner_update" on products
  for update using (
    exists (select 1 from restaurants r where r.id = products.restaurant_id and r.owner_id = (select auth.uid()))
  ) with check (
    exists (select 1 from restaurants r where r.id = products.restaurant_id and r.owner_id = (select auth.uid()))
  );

create policy "products_owner_delete" on products
  for delete using (
    exists (select 1 from restaurants r where r.id = products.restaurant_id and r.owner_id = (select auth.uid()))
  );

-- addon_groups: segue a visibilidade do produto
create policy "addon_groups_public_select" on addon_groups
  for select using (
    exists (
      select 1 from products p
      where p.id = addon_groups.product_id
        and (
          p.is_active = true
          or exists (select 1 from restaurants r where r.id = p.restaurant_id and r.owner_id = (select auth.uid()))
        )
    )
  );

create policy "addon_groups_owner_insert" on addon_groups
  for insert with check (
    exists (
      select 1 from products p
      join restaurants r on r.id = p.restaurant_id
      where p.id = addon_groups.product_id and r.owner_id = (select auth.uid())
    )
  );

create policy "addon_groups_owner_update" on addon_groups
  for update using (
    exists (
      select 1 from products p
      join restaurants r on r.id = p.restaurant_id
      where p.id = addon_groups.product_id and r.owner_id = (select auth.uid())
    )
  ) with check (
    exists (
      select 1 from products p
      join restaurants r on r.id = p.restaurant_id
      where p.id = addon_groups.product_id and r.owner_id = (select auth.uid())
    )
  );

create policy "addon_groups_owner_delete" on addon_groups
  for delete using (
    exists (
      select 1 from products p
      join restaurants r on r.id = p.restaurant_id
      where p.id = addon_groups.product_id and r.owner_id = (select auth.uid())
    )
  );

-- addon_options: segue a visibilidade do grupo/produto
create policy "addon_options_public_select" on addon_options
  for select using (
    exists (
      select 1 from addon_groups g
      join products p on p.id = g.product_id
      where g.id = addon_options.addon_group_id
        and (
          p.is_active = true
          or exists (select 1 from restaurants r where r.id = p.restaurant_id and r.owner_id = (select auth.uid()))
        )
    )
  );

create policy "addon_options_owner_insert" on addon_options
  for insert with check (
    exists (
      select 1 from addon_groups g
      join products p on p.id = g.product_id
      join restaurants r on r.id = p.restaurant_id
      where g.id = addon_options.addon_group_id and r.owner_id = (select auth.uid())
    )
  );

create policy "addon_options_owner_update" on addon_options
  for update using (
    exists (
      select 1 from addon_groups g
      join products p on p.id = g.product_id
      join restaurants r on r.id = p.restaurant_id
      where g.id = addon_options.addon_group_id and r.owner_id = (select auth.uid())
    )
  ) with check (
    exists (
      select 1 from addon_groups g
      join products p on p.id = g.product_id
      join restaurants r on r.id = p.restaurant_id
      where g.id = addon_options.addon_group_id and r.owner_id = (select auth.uid())
    )
  );

create policy "addon_options_owner_delete" on addon_options
  for delete using (
    exists (
      select 1 from addon_groups g
      join products p on p.id = g.product_id
      join restaurants r on r.id = p.restaurant_id
      where g.id = addon_options.addon_group_id and r.owner_id = (select auth.uid())
    )
  );

-- ============================================================
-- STORAGE (imagens de produto e logo)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true)
on conflict (id) do nothing;

create policy "public_assets_public_read" on storage.objects
  for select using (bucket_id = 'public-assets');

-- upload/edição só dentro da pasta "<restaurant_id>/..." do próprio dono
-- Nota: "objects.name" precisa ser qualificado explicitamente aqui — sem o qualificador,
-- "name" dentro do EXISTS resolve para restaurants.name (o nome do restaurante) em vez do
-- path do arquivo em storage.objects, porque restaurants também tem uma coluna "name".
create policy "public_assets_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'public-assets'
    and exists (
      select 1 from restaurants r
      where r.owner_id = (select auth.uid())
        and r.id::text = (storage.foldername(objects.name))[1]
    )
  );

create policy "public_assets_owner_update" on storage.objects
  for update using (
    bucket_id = 'public-assets'
    and exists (
      select 1 from restaurants r
      where r.owner_id = (select auth.uid())
        and r.id::text = (storage.foldername(objects.name))[1]
    )
  );

create policy "public_assets_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'public-assets'
    and exists (
      select 1 from restaurants r
      where r.owner_id = (select auth.uid())
        and r.id::text = (storage.foldername(objects.name))[1]
    )
  );
