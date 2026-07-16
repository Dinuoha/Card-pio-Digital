import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRestaurant } from "@/lib/get-current-restaurant";
import { toggleProductActive, deleteProduct } from "../../actions";
import { formatMoney } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

export default async function ProdutosPage() {
  const restaurant = await getCurrentRestaurant();
  if (!restaurant) return null;

  const supabase = await createClient();
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .order("position"),
    supabase
      .from("categories")
      .select("*")
      .eq("restaurant_id", restaurant.id),
  ]);

  const categoryById = new Map(
    ((categories ?? []) as Category[]).map((c) => [c.id, c.name])
  );

  return (
    <div>
      <h1>Produtos</h1>

      <div style={{ marginBottom: 16 }}>
        <Link className="admin-btn" href="/admin/produtos/novo">
          Novo produto
        </Link>
      </div>

      <div className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Categoria</th>
              <th>Preço</th>
              <th>Status</th>
              <th style={{ width: 160 }}></th>
            </tr>
          </thead>
          <tbody>
            {((products ?? []) as Product[]).map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>
                  {product.category_id
                    ? categoryById.get(product.category_id) ?? "—"
                    : "—"}
                </td>
                <td>{formatMoney(product.price)}</td>
                <td>
                  <form action={toggleProductActive}>
                    <input type="hidden" name="id" value={product.id} />
                    <input
                      type="hidden"
                      name="is_active"
                      value={String(product.is_active)}
                    />
                    <button
                      type="submit"
                      className={`admin-btn ${
                        product.is_active ? "admin-btn-secondary" : "admin-btn-danger"
                      }`}
                    >
                      {product.is_active ? "Ativo" : "Inativo"}
                    </button>
                  </form>
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <Link
                    className="admin-btn admin-btn-secondary"
                    href={`/admin/produtos/${product.id}`}
                    style={{ marginRight: 8 }}
                  >
                    Editar
                  </Link>
                  <form action={deleteProduct} style={{ display: "inline" }}>
                    <input type="hidden" name="id" value={product.id} />
                    <button className="admin-btn admin-btn-danger" type="submit">
                      Excluir
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {(products ?? []).length === 0 && (
              <tr>
                <td colSpan={5} style={{ color: "#9ca3af" }}>
                  Nenhum produto cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
