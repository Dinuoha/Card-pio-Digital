"use client";

import { useMemo, useState } from "react";
import { CartProvider, useCart } from "@/lib/cart-context";
import { formatMoney } from "@/lib/format";
import { getContrastColor, initials } from "@/lib/color";
import type { CategoryWithProducts, ProductWithAddons, Restaurant } from "@/lib/types";
import ProductModal from "./ProductModal";
import CartOverlay from "./CartOverlay";

export default function CardapioClient({
  restaurant,
  categories,
}: {
  restaurant: Restaurant;
  categories: CategoryWithProducts[];
}) {
  return (
    <CartProvider slug={restaurant.slug}>
      <CardapioInner restaurant={restaurant} categories={categories} />
    </CartProvider>
  );
}

function ProductCardDestaque({
  product,
  onSelect,
}: {
  product: ProductWithAddons;
  onSelect: () => void;
}) {
  return (
    <button className="v-card" disabled={!product.is_active} onClick={onSelect}>
      <div
        className="v-card-img"
        style={
          product.image_url
            ? { backgroundImage: `url(${product.image_url})` }
            : undefined
        }
      >
        {!product.image_url && "foto do produto"}
      </div>
      <div className="v-card-body">
        <div className="badge badge-rec">DESTAQUE</div>
        <div className="v-name">{product.name}</div>
        {product.description && <div className="v-desc">{product.description}</div>}
        <div className="price-row">
          <span className="price">{formatMoney(product.price)}</span>
        </div>
        {!product.is_active && <div className="unavailable-tag">Indisponível</div>}
      </div>
    </button>
  );
}

function ProductCardHorizontal({
  product,
  onSelect,
}: {
  product: ProductWithAddons;
  onSelect: () => void;
}) {
  return (
    <button className="h-card" disabled={!product.is_active} onClick={onSelect}>
      <div className="h-card-body">
        <div>
          <div className="h-name">{product.name}</div>
          {product.description && <div className="h-desc">{product.description}</div>}
        </div>
        <div>
          <div className="h-price">{formatMoney(product.price)}</div>
          {!product.is_active && <div className="unavailable-tag">Indisponível</div>}
        </div>
      </div>
      <div
        className="h-thumb"
        style={
          product.image_url
            ? { backgroundImage: `url(${product.image_url})` }
            : undefined
        }
      />
    </button>
  );
}

function CardapioInner({
  restaurant,
  categories,
}: {
  restaurant: Restaurant;
  categories: CategoryWithProducts[];
}) {
  const { totalItems, totalPrice, addItem } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<ProductWithAddons | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const featured = useMemo(
    () => categories.flatMap((c) => c.products).filter((p) => p.is_featured),
    [categories]
  );

  const contrastColor = getContrastColor(restaurant.primary_color);
  const themeStyle = {
    "--primary": restaurant.primary_color,
    "--primary-contrast": contrastColor,
    "--header": restaurant.primary_color,
  } as React.CSSProperties;

  const logoInitials = initials(restaurant.name);

  return (
    <div className="app" style={themeStyle}>
      <div className="desktop-nav">
        <div className="desktop-nav-inner">
          <div className="dnav-item active">
            <svg viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            Início
          </div>
        </div>
      </div>

      <div className="hero" />

      <div className="store-card-mobile">
        <div
          className="store-logo-round"
          style={
            restaurant.logo_url
              ? { backgroundImage: `url(${restaurant.logo_url})` }
              : undefined
          }
        >
          {!restaurant.logo_url && logoInitials}
        </div>
        <div className="store-name">{restaurant.name}</div>
        <div className="store-meta">
          {restaurant.address && <span>{restaurant.address}</span>}
        </div>
        {restaurant.opening_hours && (
          <div className="status-open">{restaurant.opening_hours}</div>
        )}
      </div>

      <div className="page-layout">
        <div className="main-col">
          <div className="store-header-desktop">
            <div
              className="store-logo-square"
              style={
                restaurant.logo_url
                  ? { backgroundImage: `url(${restaurant.logo_url})` }
                  : undefined
              }
            >
              {!restaurant.logo_url && logoInitials}
            </div>
            <div className="store-info">
              <h1>{restaurant.name}</h1>
              <div className="store-meta">
                {restaurant.opening_hours && (
                  <span className="status-open">{restaurant.opening_hours}</span>
                )}
                {restaurant.address && (
                  <>
                    <span className="dot" />
                    <span>{restaurant.address}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {featured.length > 0 && (
            <div className="section">
              <div className="section-title">Destaques</div>
              <div className="destaques-grid">
                {featured.map((product) => (
                  <ProductCardDestaque
                    key={product.id}
                    product={product}
                    onSelect={() => setSelectedProduct(product)}
                  />
                ))}
              </div>
            </div>
          )}

          {categories
            .filter((c) => c.products.length > 0)
            .map((category) => (
              <div className="section" key={category.id}>
                <div className="section-title">{category.name}</div>
                <div className="h-grid">
                  {category.products.map((product) => (
                    <ProductCardHorizontal
                      key={product.id}
                      product={product}
                      onSelect={() => setSelectedProduct(product)}
                    />
                  ))}
                </div>
              </div>
            ))}

          {categories.every((c) => c.products.length === 0) && (
            <div className="section">
              <div className="empty-cart">
                <div className="empty-cart-title">Cardápio em preparação</div>
                <div>Este restaurante ainda não cadastrou produtos.</div>
              </div>
            </div>
          )}
        </div>

        <div className="sidebar-col">
          <div className="cart-section" onClick={() => setCartOpen(true)}>
            <div className="cart-section-head">
              <div className="cart-section-title">Sua sacola</div>
            </div>
            <div className="cart-summary-row">
              <span>{totalItems} {totalItems === 1 ? "item" : "itens"}</span>
              <span>{formatMoney(totalPrice)}</span>
            </div>
          </div>
        </div>
      </div>

      {totalItems > 0 && (
        <button className="cart-bar" onClick={() => setCartOpen(true)}>
          <div className="cart-bar-left">
            <div className="bag-icon">
              <svg viewBox="0 0 24 24">
                <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM12 3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3z" />
              </svg>
              <div className="cart-badge">{totalItems}</div>
            </div>
            <div className="cart-bar-mid">Ver sacola</div>
          </div>
          <div className="cart-bar-total">{formatMoney(totalPrice)}</div>
        </button>
      )}

      <div className="bottom-nav">
        <div className="nav-item active">
          <svg viewBox="0 0 24 24">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
          <div className="nav-label">Início</div>
        </div>
      </div>

      {selectedProduct && (
        <ProductModal
          key={selectedProduct.id}
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAdd={addItem}
        />
      )}

      {cartOpen && (
        <CartOverlay restaurant={restaurant} onClose={() => setCartOpen(false)} />
      )}
    </div>
  );
}
