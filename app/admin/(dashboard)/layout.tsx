import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRestaurant } from "@/lib/get-current-restaurant";
import { signOut } from "../actions";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const restaurant = await getCurrentRestaurant();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-title">{restaurant?.name ?? "Painel"}</div>
        <Link href="/admin">Visão geral</Link>
        <Link href="/admin/produtos">Produtos</Link>
        <Link href="/admin/categorias">Categorias</Link>
        <Link href="/admin/configuracoes">Configurações</Link>
        <form action={signOut}>
          <button type="submit">Sair</button>
        </form>
      </aside>
      <main className="admin-main">
        {!restaurant ? (
          <div className="admin-error">
            Nenhum restaurante vinculado a esta conta. Entre em contato com o suporte.
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
