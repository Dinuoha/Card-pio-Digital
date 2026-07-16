"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "./ImageUploader";
import { saveProduct, type AddonGroupInput } from "@/app/admin/actions";
import type { Category, ProductWithAddons } from "@/lib/types";

type LocalOption = { key: string; id?: string; name: string; price: string };
type LocalGroup = {
  key: string;
  id?: string;
  title: string;
  selection_type: "single" | "multiple";
  required: boolean;
  max_selections: string;
  options: LocalOption[];
};

function newOption(): LocalOption {
  return { key: crypto.randomUUID(), name: "", price: "0" };
}

function newGroup(): LocalGroup {
  return {
    key: crypto.randomUUID(),
    title: "",
    selection_type: "multiple",
    required: false,
    max_selections: "",
    options: [newOption()],
  };
}

function groupsFromProduct(product?: ProductWithAddons): LocalGroup[] {
  if (!product) return [];
  return product.addon_groups.map((g) => ({
    key: g.id,
    id: g.id,
    title: g.title,
    selection_type: g.selection_type,
    required: g.required,
    max_selections: g.max_selections != null ? String(g.max_selections) : "",
    options: g.addon_options.map((o) => ({
      key: o.id,
      id: o.id,
      name: o.name,
      price: String(o.price),
    })),
  }));
}

export default function ProductForm({
  restaurantId,
  categories,
  product,
}: {
  restaurantId: string;
  categories: Category[];
  product?: ProductWithAddons;
}) {
  const router = useRouter();

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(product?.image_url ?? null);
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false);
  const [groups, setGroups] = useState<LocalGroup[]>(groupsFromProduct(product));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateGroup(key: string, patch: Partial<LocalGroup>) {
    setGroups((gs) => gs.map((g) => (g.key === key ? { ...g, ...patch } : g)));
  }

  function updateOption(groupKey: string, optionKey: string, patch: Partial<LocalOption>) {
    setGroups((gs) =>
      gs.map((g) =>
        g.key !== groupKey
          ? g
          : {
              ...g,
              options: g.options.map((o) =>
                o.key === optionKey ? { ...o, ...patch } : o
              ),
            }
      )
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const priceNumber = Number(price.replace(",", "."));
    if (!name.trim()) {
      setError("Informe o nome do produto.");
      return;
    }
    if (Number.isNaN(priceNumber) || priceNumber < 0) {
      setError("Informe um preço válido.");
      return;
    }

    const addon_groups: AddonGroupInput[] = groups
      .filter((g) => g.title.trim())
      .map((g) => ({
        id: g.id,
        title: g.title.trim(),
        selection_type: g.selection_type,
        required: g.required,
        max_selections: g.max_selections ? Number(g.max_selections) : null,
        options: g.options
          .filter((o) => o.name.trim())
          .map((o) => ({
            id: o.id,
            name: o.name.trim(),
            price: Number(o.price.replace(",", ".")) || 0,
          })),
      }));

    setSaving(true);
    try {
      await saveProduct({
        id: product?.id,
        name: name.trim(),
        description,
        price: priceNumber,
        category_id: categoryId || null,
        image_url: imageUrl,
        is_active: isActive,
        is_featured: isFeatured,
        addon_groups,
      });
      router.push("/admin/produtos");
      router.refresh();
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : "Erro ao salvar produto.");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="admin-error">{error}</div>}

      <div className="admin-card">
        <div className="admin-form-row">
          <label>Nome</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="admin-form-row">
          <label>Descrição</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="admin-form-row">
          <label>Preço (R$)</label>
          <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
        <div className="admin-form-row">
          <label>Categoria</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-form-row">
          <label>Foto do produto</label>
          <ImageUploader
            restaurantId={restaurantId}
            folder="products"
            initialUrl={imageUrl}
            onUploaded={setImageUrl}
          />
        </div>
        <div className="admin-form-row admin-toggle-row">
          <input
            type="checkbox"
            id="is_active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <label htmlFor="is_active" style={{ marginBottom: 0 }}>
            Ativo (aparece no cardápio)
          </label>
        </div>
        <div className="admin-form-row admin-toggle-row">
          <input
            type="checkbox"
            id="is_featured"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
          />
          <label htmlFor="is_featured" style={{ marginBottom: 0 }}>
            Destaque (aparece na seção Destaques)
          </label>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-form-row" style={{ marginBottom: 12 }}>
          <label>Adicionais</label>
          <div className="admin-hint">
            Grupos de opções, como &quot;Turbine seu burger&quot; ou &quot;Ponto da carne&quot;.
          </div>
        </div>

        {groups.map((group) => (
          <div
            key={group.key}
            style={{
              border: "1px solid var(--divider)",
              borderRadius: 8,
              padding: 14,
              marginBottom: 14,
            }}
          >
            <div className="admin-form-row">
              <label>Título do grupo</label>
              <input
                type="text"
                value={group.title}
                onChange={(e) => updateGroup(group.key, { title: e.target.value })}
                placeholder="Ex: Turbine seu burger"
              />
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <div className="admin-form-row" style={{ marginBottom: 0, flex: 1 }}>
                <label>Tipo de seleção</label>
                <select
                  value={group.selection_type}
                  onChange={(e) =>
                    updateGroup(group.key, {
                      selection_type: e.target.value as "single" | "multiple",
                    })
                  }
                >
                  <option value="single">Única escolha (radio)</option>
                  <option value="multiple">Múltipla escolha</option>
                </select>
              </div>
              {group.selection_type === "multiple" && (
                <div className="admin-form-row" style={{ marginBottom: 0, flex: 1 }}>
                  <label>Máx. de opções (opcional)</label>
                  <input
                    type="number"
                    min={0}
                    value={group.max_selections}
                    onChange={(e) =>
                      updateGroup(group.key, { max_selections: e.target.value })
                    }
                  />
                </div>
              )}
              <div className="admin-form-row admin-toggle-row" style={{ marginBottom: 0 }}>
                <input
                  type="checkbox"
                  id={`req-${group.key}`}
                  checked={group.required}
                  onChange={(e) =>
                    updateGroup(group.key, { required: e.target.checked })
                  }
                />
                <label htmlFor={`req-${group.key}`} style={{ marginBottom: 0 }}>
                  Obrigatório
                </label>
              </div>
            </div>

            {group.options.map((option) => (
              <div
                key={option.key}
                style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}
              >
                <input
                  type="text"
                  placeholder="Nome da opção"
                  value={option.name}
                  onChange={(e) =>
                    updateOption(group.key, option.key, { name: e.target.value })
                  }
                  style={{
                    flex: 1,
                    border: "1px solid var(--divider)",
                    borderRadius: 8,
                    padding: "8px 10px",
                  }}
                />
                <input
                  type="text"
                  placeholder="Preço adicional"
                  value={option.price}
                  onChange={(e) =>
                    updateOption(group.key, option.key, { price: e.target.value })
                  }
                  style={{
                    width: 120,
                    border: "1px solid var(--divider)",
                    borderRadius: 8,
                    padding: "8px 10px",
                  }}
                />
                <button
                  type="button"
                  className="admin-btn admin-btn-danger"
                  onClick={() =>
                    updateGroup(group.key, {
                      options: group.options.filter((o) => o.key !== option.key),
                    })
                  }
                >
                  Remover
                </button>
              </div>
            ))}

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() =>
                  updateGroup(group.key, { options: [...group.options, newOption()] })
                }
              >
                + opção
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={() => setGroups((gs) => gs.filter((g) => g.key !== group.key))}
              >
                Remover grupo
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          onClick={() => setGroups((gs) => [...gs, newGroup()])}
        >
          + grupo de adicionais
        </button>
      </div>

      <button className="admin-btn" type="submit" disabled={saving}>
        {saving ? "Salvando..." : "Salvar produto"}
      </button>
    </form>
  );
}
