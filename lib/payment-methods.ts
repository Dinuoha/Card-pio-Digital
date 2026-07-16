export type PaymentMethodKey =
  | "dinheiro"
  | "pix_automatico"
  | "credito"
  | "debito"
  | "vale_refeicao";

export const PAYMENT_METHODS: { key: PaymentMethodKey; label: string; emoji: string }[] = [
  { key: "dinheiro", label: "Dinheiro", emoji: "💵" },
  { key: "pix_automatico", label: "Pix automático", emoji: "⚡" },
  { key: "credito", label: "Cartão de crédito", emoji: "💳" },
  { key: "debito", label: "Cartão de débito", emoji: "💳" },
  { key: "vale_refeicao", label: "Vale refeição", emoji: "🍽️" },
];
