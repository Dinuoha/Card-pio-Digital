import { createClient } from "@/lib/supabase/server";
import { getCurrentRestaurant } from "@/lib/get-current-restaurant";
import { createCategory, updateCategory, deleteCategory } from "../../actions";
import type { Category } from "@/lib/types";

export default async function CategoriasPage() {
  const restaurant = await getCurrentRestaurant();
  if (!restaurant) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .order("position");

  const categories = (data ?? []) as Category[];

  return (
    <div>
      <h1>Categorias</h1>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nome / ordem</th>
              <th style={{ width: 100 }}></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => {
              const formId = `cat-form-${category.id}`;
              return (
                <tr key={category.id}>
                  <td>
                    <form
                      id={formId}
                      action={updateCategory}
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <input type="hidden" name="id" value={category.id} />
                      <input
                        type="text"
                        name="name"
                        defaultValue={category.name}
                        style={{
                          flex: 1,
                          border: "1px solid var(--divider)",
                          borderRadius: 8,
                          padding: "8px 10px",
                        }}
                      />
                      <input
                        type="number"
                        name="position"
                        defaultValue={category.position}
                        style={{
                          width: 70,
                          border: "1px solid var(--divider)",
                          borderRadius: 8,
                          padding: "8px 10px",
                        }}
                      />
                    </form>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button
                      className="admin-btn admin-btn-secondary"
                      type="submit"
                      form={formId}
                      style={{ marginRight: 8 }}
                    >
                      Salvar
                    </button>
                    <form action={deleteCategory} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={category.id} />
                      <button className="admin-btn admin-btn-danger" type="submit">
                        Excluir
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {categories.length === 0 && (
              <tr>
                <td colSpan={2} style={{ color: "#9ca3af" }}>
                  Nenhuma categoria cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="admin-card">
        <div className="admin-form-row" style={{ marginBottom: 12 }}>
          <label>Nova categoria</label>
        </div>
        <form action={createCategory} style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            name="name"
            placeholder="Ex: Lanches, Bebidas..."
            required
            style={{
              flex: 1,
              border: "1px solid var(--divider)",
              borderRadius: 8,
              padding: "10px 12px",
            }}
          />
          <input type="hidden" name="position" value={categories.length} />
          <button className="admin-btn" type="submit">
            Adicionar
          </button>
        </form>
      </div>
    </div>
  );
}
