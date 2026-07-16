import Link from "next/link";

export default function Home() {
  return (
    <div className="admin-auth-page">
      <div className="admin-auth-card" style={{ textAlign: "center" }}>
        <h1>Cardápio Digital</h1>
        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>
          Cardápio digital com pedido via WhatsApp para hamburguerias e pizzarias.
        </p>
        <Link className="admin-btn" style={{ display: "block" }} href="/admin/login">
          Acessar painel do restaurante
        </Link>
      </div>
    </div>
  );
}
