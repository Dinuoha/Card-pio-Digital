# Cardápio Digital

Cardápio digital multi-tenant com pedido via WhatsApp, para hamburguerias e pizzarias.
Fase 1 (MVP vendável): cardápio dinâmico por restaurante, carrinho multi-produto,
checkout via WhatsApp e painel admin básico.

## Stack

- Next.js 16 (App Router, TypeScript)
- Supabase (Postgres + Auth + Storage)
- Deploy: Vercel (produção em `cardapio-digital-estudio-davson.vercel.app`, deploy
  automático a cada push na branch `main`)

## Configuração do Supabase

Este projeto já está conectado a um projeto Supabase real (`cardapio-digital`, org "Cardápio
Digital"), com o schema em [`supabase/schema.sql`](supabase/schema.sql) aplicado
(tabelas, RLS e bucket de storage `public-assets`). As credenciais estão em `.env.local`
(não versionado).

Para rodar em outro projeto Supabase do zero:

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Rode o conteúdo de `supabase/schema.sql` inteiro no SQL Editor do projeto.
3. Copie `.env.local.example` para `.env.local` e preencha com a URL e a anon key do
   projeto (Settings > API).
4. **Importante:** em Authentication > Providers > Email, desative "Confirm email".
   O cadastro em `/admin/signup` cria o usuário e o restaurante na mesma operação — se a
   confirmação por e-mail estiver ativa, o restaurante só é criado depois que o usuário
   confirmar o e-mail e fizer login manualmente (o fluxo mostra um aviso nesse caso).

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

- `/admin/signup` — cria uma conta de dono de restaurante (nome do restaurante + login).
- `/admin` — painel: produtos, categorias, configurações (WhatsApp, endereço, cor, logo).
- `/<slug>` — cardápio público do restaurante, com carrinho e finalização via WhatsApp.

## Estrutura

- `app/[slug]/` — cardápio público (Server Component + componentes de carrinho/modal).
- `app/admin/(auth)/` — login e cadastro (sem sidebar).
- `app/admin/(dashboard)/` — painel autenticado (produtos, categorias, configurações).
- `app/admin/actions.ts` — Server Actions usadas pelo painel (CRUD, RLS garante que cada
  dono só edita o próprio restaurante).
- `lib/supabase/` — clientes Supabase (browser, server, proxy/sessão).
- `lib/cart-context.tsx` — carrinho persistido em `localStorage` por restaurante.
- `lib/whatsapp.ts` — geração da mensagem de pedido e link `wa.me`.
- `supabase/schema.sql` — schema completo (tabelas, RLS, storage).

## Fora de escopo na Fase 1

Login/cadastro de cliente final, fidelidade/pontos, "meus pedidos", pagamento online,
QR Code automático, relatório de pedidos, múltiplos usuários por restaurante, busca
funcional no cardápio — previstos para as próximas fases (ver briefing do produto).
