import Link from "next/link";
import { getCurrentRestaurant } from "@/lib/get-current-restaurant";

export default async function AdminOverviewPage() {
  const restaurant = await getCurrentRestaurant();
  if (!restaurant) return null;

  const menuPath = `/${restaurant.slug}`;

  return (
    <div>
      <h1>Visão geral</h1>

      <div className="admin-card">
        <div className="admin-form-row" style={{ marginBottom: 0 }}>
          <label>Link do seu cardápio</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <code>{menuPath}</code>
            <Link className="admin-btn admin-btn-secondary" href={menuPath} target="_blank">
              Abrir cardápio
            </Link>
          </div>
          <div className="admin-hint">
            Compartilhe este link com seus clientes. Em breve: QR Code automático (Fase 2).
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-form-row" style={{ marginBottom: 0 }}>
          <label>Próximos passos</label>
          <div className="admin-hint">
            1. Cadastre categorias em <Link href="/admin/categorias">Categorias</Link>.<br />
            2. Cadastre produtos em <Link href="/admin/produtos">Produtos</Link>.<br />
            3. Configure WhatsApp, endereço e cor da marca em{" "}
            <Link href="/admin/configuracoes">Configurações</Link>.
          </div>
        </div>
      </div>
    </div>
  );
}
