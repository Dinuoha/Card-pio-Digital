export function formatMoney(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}
