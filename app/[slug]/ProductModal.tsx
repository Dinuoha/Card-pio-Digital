"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";
import type { CartAddonSelection, CartItem } from "@/lib/cart-context";
import type { ProductWithAddons } from "@/lib/types";

type SingleSelections = Record<string, string | null>;
type MultiSelections = Record<string, Record<string, number>>;

function isGroupSatisfied(
  group: ProductWithAddons["addon_groups"][number],
  singleSel: SingleSelections,
  multiSel: MultiSelections
) {
  if (!group.required) return true;
  if (group.selection_type === "single") return !!singleSel[group.id];
  const sel = multiSel[group.id] ?? {};
  return Object.values(sel).some((qty) => qty > 0);
}

function buildAddons(
  product: ProductWithAddons,
  singleSel: SingleSelections,
  multiSel: MultiSelections
): CartAddonSelection[] {
  const result: CartAddonSelection[] = [];
  for (const group of product.addon_groups) {
    if (group.selection_type === "single") {
      const optionId = singleSel[group.id];
      if (!optionId) continue;
      const option = group.addon_options.find((o) => o.id === optionId);
      if (option) {
        result.push({
          optionId: option.id,
          groupTitle: group.title,
          name: option.name,
          price: option.price,
          qty: 1,
        });
      }
    } else {
      const sel = multiSel[group.id] ?? {};
      for (const [optionId, qty] of Object.entries(sel)) {
        if (qty <= 0) continue;
        const option = group.addon_options.find((o) => o.id === optionId);
        if (option) {
          result.push({
            optionId: option.id,
            groupTitle: group.title,
            name: option.name,
            price: option.price,
            qty,
          });
        }
      }
    }
  }
  return result;
}

export default function ProductModal({
  product,
  onClose,
  onAdd,
}: {
  product: ProductWithAddons;
  onClose: () => void;
  onAdd: (item: Omit<CartItem, "id">) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [singleSel, setSingleSel] = useState<SingleSelections>({});
  const [multiSel, setMultiSel] = useState<MultiSelections>({});
  const [observation, setObservation] = useState("");

  const addons = useMemo(
    () => buildAddons(product, singleSel, multiSel),
    [product, singleSel, multiSel]
  );

  const unitPrice =
    product.price + addons.reduce((sum, a) => sum + a.price * a.qty, 0);
  const total = unitPrice * quantity;

  const allSatisfied = product.addon_groups.every((group) =>
    isGroupSatisfied(group, singleSel, multiSel)
  );
  const canAdd = product.is_active && allSatisfied;

  function selectSingle(groupId: string, optionId: string) {
    setSingleSel((prev) => ({ ...prev, [groupId]: optionId }));
  }

  function changeMultiQty(groupId: string, optionId: string, delta: number) {
    setMultiSel((prev) => {
      const groupSel = { ...(prev[groupId] ?? {}) };
      const current = groupSel[optionId] ?? 0;
      const next = Math.max(0, current + delta);
      if (next === 0) delete groupSel[optionId];
      else groupSel[optionId] = next;
      return { ...prev, [groupId]: groupSel };
    });
  }

  function handleAdd() {
    if (!canAdd) return;
    onAdd({
      productId: product.id,
      name: product.name,
      basePrice: product.price,
      quantity,
      addons,
      observation,
      imageUrl: product.image_url,
    });
    onClose();
  }

  return (
    <div className="modal-overlay open" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modal">
        <div
          className="modal-img"
          style={
            product.image_url
              ? { backgroundImage: `url(${product.image_url})` }
              : undefined
          }
        >
          {!product.image_url && "foto do produto"}
          <button className="modal-close-mobile" onClick={onClose} aria-label="Fechar">
            &times;
          </button>
        </div>
        <div className="modal-right">
          <div className="modal-head">
            <div className="modal-head-title">{product.name}</div>
            <button className="modal-close" onClick={onClose} aria-label="Fechar">
              &times;
            </button>
          </div>
          <div className="modal-scroll">
            <div className="modal-intro">
              <div className="modal-name">{product.name}</div>
              {product.description && (
                <div className="modal-desc">{product.description}</div>
              )}
              <div className="modal-price">{formatMoney(product.price)}</div>
              {!product.is_active && (
                <div className="unavailable-tag">Indisponível no momento</div>
              )}
            </div>

            {product.addon_groups.map((group) => (
              <div className="opt-group" key={group.id}>
                <div className="opt-group-header">
                  <div className="opt-group-title">{group.title}</div>
                  <div className="opt-group-sub">
                    <span className="opt-group-rule">
                      {group.selection_type === "single"
                        ? "Escolha 1 opção"
                        : group.max_selections
                        ? `Escolha até ${group.max_selections} opções`
                        : "Escolha quantas quiser"}
                    </span>
                    {group.required && (
                      <span className="opt-group-req">OBRIGATÓRIO</span>
                    )}
                  </div>
                </div>

                {group.selection_type === "single"
                  ? group.addon_options.map((option) => {
                      const checked = singleSel[group.id] === option.id;
                      return (
                        <button
                          type="button"
                          key={option.id}
                          className="opt-row"
                          onClick={() => selectSingle(group.id, option.id)}
                        >
                          <div className="opt-body">
                            <div className="opt-name">{option.name}</div>
                            {option.price > 0 && (
                              <div className="opt-price">
                                + {formatMoney(option.price)}
                              </div>
                            )}
                          </div>
                          <div className={`radio${checked ? " checked" : ""}`} />
                        </button>
                      );
                    })
                  : group.addon_options.map((option) => {
                      const qty = multiSel[group.id]?.[option.id] ?? 0;
                      const distinctSelected = Object.values(
                        multiSel[group.id] ?? {}
                      ).filter((q) => q > 0).length;
                      const atCap =
                        !!group.max_selections &&
                        distinctSelected >= group.max_selections &&
                        qty === 0;
                      return (
                        <div className="opt-row" key={option.id}>
                          <div className="opt-body">
                            <div className="opt-name">{option.name}</div>
                            <div className="opt-price">
                              + {formatMoney(option.price)}
                            </div>
                          </div>
                          {qty === 0 ? (
                            <button
                              type="button"
                              className="add-plus"
                              disabled={atCap}
                              onClick={() =>
                                changeMultiQty(group.id, option.id, 1)
                              }
                            >
                              +
                            </button>
                          ) : (
                            <div className="add-stepper">
                              <button
                                type="button"
                                onClick={() =>
                                  changeMultiQty(group.id, option.id, -1)
                                }
                              >
                                −
                              </button>
                              <span>{qty}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  changeMultiQty(group.id, option.id, 1)
                                }
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
              </div>
            ))}

            <div className="obs-wrap">
              <div className="opt-group-title" style={{ marginBottom: 8 }}>
                Alguma observação?
              </div>
              <textarea
                className="obs-textarea"
                maxLength={140}
                placeholder="Ex: sem cebola, ponto da carne, etc."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
              />
              <div className="obs-counter">{observation.length}/140</div>
            </div>
          </div>

          <div className="modal-footer">
            <div className="qty-stepper">
              <button
                type="button"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <div className="qty-val">{quantity}</div>
              <button type="button" onClick={() => setQuantity((q) => q + 1)}>
                +
              </button>
            </div>
            <button
              className="modal-add-btn"
              disabled={!canAdd}
              onClick={handleAdd}
            >
              <span>Adicionar</span>
              <span>{formatMoney(total)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
