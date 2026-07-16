import { getCurrentRestaurant } from "@/lib/get-current-restaurant";
import { updateRestaurantSettings } from "../../actions";
import ImageUploader from "@/components/admin/ImageUploader";
import { DAY_ORDER, DAY_LABELS } from "@/lib/business-hours";
import { PAYMENT_METHODS } from "@/lib/payment-methods";

export default async function ConfiguracoesPage() {
  const restaurant = await getCurrentRestaurant();
  if (!restaurant) return null;

  return (
    <div>
      <h1>Configurações</h1>

      <form action={updateRestaurantSettings}>
        <div className="admin-card">
          <div className="admin-form-row">
            <label>Nome do restaurante</label>
            <input type="text" name="name" defaultValue={restaurant.name} required />
          </div>
          <div className="admin-form-row">
            <label>Slug (URL do cardápio)</label>
            <input type="text" name="slug" defaultValue={restaurant.slug} required />
            <div className="admin-hint">
              Cardápio público em: dominio.com/{restaurant.slug}
            </div>
          </div>
          <div className="admin-form-row">
            <label>Logo</label>
            <ImageUploader
              restaurantId={restaurant.id}
              folder="logos"
              inputName="logo_url"
              initialUrl={restaurant.logo_url}
            />
          </div>
          <div className="admin-form-row">
            <label>Cor da marca</label>
            <input
              type="color"
              name="primary_color"
              defaultValue={restaurant.primary_color}
              style={{ height: 44, padding: 4 }}
            />
          </div>
          <div className="admin-form-row" style={{ marginBottom: 0 }}>
            <label>Instagram</label>
            <input
              type="text"
              name="instagram"
              defaultValue={restaurant.instagram ?? ""}
              placeholder="seu_usuario (sem @)"
            />
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-form-row">
            <label>Número de WhatsApp para pedidos</label>
            <input
              type="tel"
              name="whatsapp_number"
              defaultValue={restaurant.whatsapp_number ?? ""}
              placeholder="Ex: 5581999999999"
            />
            <div className="admin-hint">
              Use o número completo com código do país e DDD, só números. Esse número também
              aparece como telefone de contato no cardápio.
            </div>
          </div>
          <div className="admin-form-row" style={{ marginBottom: 0 }}>
            <label>Endereço</label>
            <input type="text" name="address" defaultValue={restaurant.address ?? ""} />
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-form-row" style={{ marginBottom: 12 }}>
            <label>Horário de funcionamento</label>
          </div>
          {DAY_ORDER.map((day) => {
            const d = restaurant.business_hours?.[day];
            return (
              <div
                key={day}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 10,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ width: 84, fontSize: 13.5, color: "#374151", fontWeight: 500 }}>
                  {DAY_LABELS[day]}
                </div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12.5,
                    color: "#6b7280",
                    width: 80,
                  }}
                >
                  <input
                    type="checkbox"
                    name={`hours_${day}_closed`}
                    defaultChecked={d?.closed ?? false}
                  />
                  Fechado
                </label>
                <input
                  type="time"
                  name={`hours_${day}_open`}
                  defaultValue={d?.open ?? "18:00"}
                  style={{
                    border: "1px solid var(--divider)",
                    borderRadius: 8,
                    padding: "6px 8px",
                  }}
                />
                <span style={{ color: "#9ca3af", fontSize: 13 }}>às</span>
                <input
                  type="time"
                  name={`hours_${day}_close`}
                  defaultValue={d?.close ?? "23:00"}
                  style={{
                    border: "1px solid var(--divider)",
                    borderRadius: 8,
                    padding: "6px 8px",
                  }}
                />
              </div>
            );
          })}
          <div className="admin-hint">
            Marque &quot;Fechado&quot; nos dias que o restaurante não funciona. Esse horário
            é usado para mostrar &quot;Aberto&quot;/&quot;Fechado&quot; automaticamente no
            cardápio.
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-form-row" style={{ marginBottom: 12 }}>
            <label>Formas de pagamento aceitas</label>
          </div>
          {PAYMENT_METHODS.map((m) => (
            <label
              key={m.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
                fontSize: 14,
                color: "#374151",
              }}
            >
              <input
                type="checkbox"
                name="payment_methods"
                value={m.key}
                defaultChecked={restaurant.payment_methods.includes(m.key)}
              />
              {m.emoji} {m.label}
            </label>
          ))}
        </div>

        <div className="admin-card">
          <div className="admin-form-row" style={{ marginBottom: 0 }}>
            <label>Taxa de entrega (R$, opcional)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="delivery_fee"
              defaultValue={restaurant.delivery_fee ?? ""}
            />
          </div>
        </div>

        <button className="admin-btn" type="submit">
          Salvar configurações
        </button>
      </form>
    </div>
  );
}
