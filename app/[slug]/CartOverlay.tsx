"use client";

import { useState } from "react";
import { cartItemTotal, cartItemUnitPrice, useCart } from "@/lib/cart-context";
import { formatMoney } from "@/lib/format";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import type { Restaurant } from "@/lib/types";

export default function CartOverlay({
  restaurant,
  onClose,
}: {
  restaurant: Restaurant;
  onClose: () => void;
}) {
  const { items, updateQuantity, removeItem, clear, totalPrice } = useCart();
  const [mode, setMode] = useState<"entrega" | "retirada">("entrega");
  const [address, setAddress] = useState("");

  const hasWhatsApp = !!restaurant.whatsapp_number?.trim();
  const canFinish =
    items.length > 0 &&
    hasWhatsApp &&
    (mode === "retirada" || address.trim().length > 0);

  function handleFinish() {
    if (!canFinish) return;
    const message = buildWhatsAppMessage(restaurant.name, items, {
      mode,
      address,
    });
    const url = buildWhatsAppUrl(restaurant.whatsapp_number ?? "", message);
    window.open(url, "_blank");
    clear();
    onClose();
  }

  return (
    <div className="cart-overlay open">
      <div className="cart-scroll">
        <div className="cart-topbar">
          <button className="cart-back" onClick={onClose} aria-label="Voltar">
            &#8592;
          </button>
          <div className="cart-topbar-title">Sua sacola</div>
        </div>

        {items.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-title">Sua sacola está vazia</div>
            <div>Adicione itens do cardápio para continuar.</div>
          </div>
        ) : (
          <>
            <div className="cart-section">
              <div className="cart-section-head">
                <div className="cart-section-title">Sua sacola</div>
                <button className="cart-clear" onClick={clear}>
                  LIMPAR
                </button>
              </div>
              {items.map((item) => (
                <div className="cart-item" key={item.id}>
                  <div className="cart-item-body">
                    <div className="cart-item-name">{item.name}</div>
                    {item.addons.length > 0 && (
                      <div className="cart-item-desc">
                        {item.addons
                          .map(
                            (a) =>
                              `${a.qty > 1 ? a.qty + "x " : ""}${a.name}`
                          )
                          .join(", ")}
                      </div>
                    )}
                    {item.observation.trim() && (
                      <div className="cart-item-desc">
                        Obs: {item.observation.trim()}
                      </div>
                    )}
                    <div className="cart-item-actions">
                      <div className="qty-stepper" style={{ padding: "4px 10px" }}>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          −
                        </button>
                        <div className="qty-val">{item.quantity}</div>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                      <span
                        className="remove-link"
                        onClick={() => removeItem(item.id)}
                      >
                        Remover
                      </span>
                    </div>
                  </div>
                  <div className="cart-item-price">
                    {formatMoney(cartItemTotal(item))}
                    {item.quantity > 1 && (
                      <div style={{ fontWeight: 400, fontSize: 12, color: "#9ca3af" }}>
                        {formatMoney(cartItemUnitPrice(item))} un.
                      </div>
                    )}
                  </div>
                  <div
                    className="cart-item-thumb"
                    style={
                      item.imageUrl
                        ? { backgroundImage: `url(${item.imageUrl})` }
                        : undefined
                    }
                  />
                </div>
              ))}
            </div>

            <div className="cart-section">
              <div className="checkout-field">
                <label>Como deseja receber?</label>
                <div className="checkout-mode-row">
                  <button
                    type="button"
                    className={`checkout-mode-btn${mode === "entrega" ? " active" : ""}`}
                    onClick={() => setMode("entrega")}
                  >
                    Entrega
                  </button>
                  <button
                    type="button"
                    className={`checkout-mode-btn${mode === "retirada" ? " active" : ""}`}
                    onClick={() => setMode("retirada")}
                  >
                    Retirar no local
                  </button>
                </div>
                {mode === "entrega" && (
                  <textarea
                    className="checkout-textarea"
                    placeholder="Endereço completo para entrega"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                )}
              </div>
            </div>

            <div className="cart-section">
              <div className="cart-summary-row">
                <span>Subtotal</span>
                <span>{formatMoney(totalPrice)}</span>
              </div>
              <div className="cart-summary-row">
                <span>Taxa de entrega</span>
                <span>
                  {restaurant.delivery_fee != null
                    ? formatMoney(restaurant.delivery_fee)
                    : "A combinar"}
                </span>
              </div>
              <div className="cart-summary-row total">
                <span>Total</span>
                <span>{formatMoney(totalPrice)}</span>
              </div>
              {!hasWhatsApp && (
                <div className="admin-hint">
                  Este restaurante ainda não configurou o WhatsApp para pedidos.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {items.length > 0 && (
        <div className="cart-footer">
          <button
            className="cart-continue-btn"
            disabled={!canFinish}
            onClick={handleFinish}
          >
            Finalizar pedido no WhatsApp
          </button>
        </div>
      )}
    </div>
  );
}
