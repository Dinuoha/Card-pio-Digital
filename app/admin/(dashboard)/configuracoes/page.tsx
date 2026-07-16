import { getCurrentRestaurant } from "@/lib/get-current-restaurant";
import { updateRestaurantSettings } from "../../actions";
import ImageUploader from "@/components/admin/ImageUploader";

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
              Use o número completo com código do país e DDD, só números.
            </div>
          </div>
          <div className="admin-form-row">
            <label>Endereço</label>
            <input type="text" name="address" defaultValue={restaurant.address ?? ""} />
          </div>
          <div className="admin-form-row">
            <label>Horário de funcionamento</label>
            <input
              type="text"
              name="opening_hours"
              defaultValue={restaurant.opening_hours ?? ""}
              placeholder="Ex: Seg a Sáb, 18h às 23h"
            />
          </div>
          <div className="admin-form-row">
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
