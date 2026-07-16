import { formatMoney } from "@/lib/format";
import { cartItemTotal, type CartItem } from "@/lib/cart-context";

export type DeliveryInfo = {
  mode: "entrega" | "retirada";
  address: string;
};

export function buildWhatsAppMessage(
  restaurantName: string,
  items: CartItem[],
  delivery: DeliveryInfo
) {
  const lines: string[] = [`Pedido - ${restaurantName}`];

  for (const item of items) {
    const obs = item.observation.trim()
      ? ` (${item.observation.trim()})`
      : "";
    const itemBaseTotal = item.basePrice * item.quantity;
    lines.push(
      `${item.quantity}x ${item.name}${obs} - ${formatMoney(itemBaseTotal)}`
    );

    for (const addon of item.addons) {
      const addonTotal = addon.price * addon.qty * item.quantity;
      const prefix = addon.qty > 1 ? `${addon.qty}x ` : "";
      lines.push(`  + ${prefix}${addon.name} - ${formatMoney(addonTotal)}`);
    }
  }

  const total = items.reduce((sum, item) => sum + cartItemTotal(item), 0);

  lines.push("--------------------------");
  lines.push(`Total: ${formatMoney(total)}`);
  lines.push(
    `Endereço: ${
      delivery.mode === "retirada"
        ? "Retirada no local"
        : delivery.address.trim() || "(a combinar)"
    }`
  );

  return lines.join("\n");
}

export function buildWhatsAppUrl(whatsappNumber: string, message: string) {
  const digits = whatsappNumber.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
