"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/slug";

export default function SignupPage() {
  const router = useRouter();
  const [restaurantName, setRestaurantName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    const baseSlug = slugify(restaurantName);
    if (!baseSlug) {
      setError("Informe um nome de restaurante válido.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    if (!signUpData.session) {
      setLoading(false);
      setError(
        "Cadastro criado, mas a confirmação de e-mail está ativada neste projeto Supabase. " +
          "Desative 'Confirm email' em Authentication > Providers para concluir o cadastro do restaurante automaticamente."
      );
      return;
    }

    let slug = baseSlug;
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { error: insertError } = await supabase.from("restaurants").insert({
        owner_id: signUpData.user!.id,
        name: restaurantName,
        slug,
      });

      if (!insertError) break;

      attempt += 1;
      if (insertError.code === "23505" && attempt < 4) {
        slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
        continue;
      }

      setLoading(false);
      setError(`Não foi possível criar o restaurante: ${insertError.message}`);
      return;
    }

    setLoading(false);
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="admin-auth-page">
      <div className="admin-auth-card">
        <h1>Criar restaurante</h1>
        {error && <div className="admin-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="admin-form-row">
            <label>Nome do restaurante</label>
            <input
              type="text"
              required
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
            />
          </div>
          <div className="admin-form-row">
            <label>E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="admin-form-row">
            <label>Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="admin-form-row">
            <label>Confirmar senha</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button className="admin-btn" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Criando..." : "Criar restaurante"}
          </button>
        </form>
        <div className="admin-auth-switch">
          Já tem cadastro? <Link href="/admin/login">Entrar</Link>
        </div>
      </div>
    </div>
  );
}
