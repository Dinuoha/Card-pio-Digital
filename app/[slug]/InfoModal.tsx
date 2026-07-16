"use client";

import { useState } from "react";
import { DAY_ORDER, DAY_LABELS, getTodayKey } from "@/lib/business-hours";
import { PAYMENT_METHODS } from "@/lib/payment-methods";
import { formatPhoneBR } from "@/lib/format";
import { initials } from "@/lib/color";
import type { Restaurant } from "@/lib/types";

type Tab = "sobre" | "horario" | "pagamento";

export default function InfoModal({
  restaurant,
  onClose,
}: {
  restaurant: Restaurant;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("sobre");
  const todayKey = getTodayKey();
  const logoInitials = initials(restaurant.name);
  const whatsappDigits = restaurant.whatsapp_number?.replace(/\D/g, "") ?? "";

  const selectedPayments = PAYMENT_METHODS.filter((m) =>
    restaurant.payment_methods.includes(m.key)
  );

  return (
    <div
      className="info-modal-overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="info-modal">
        <div className="info-modal-head">
          <div className="info-modal-title">{restaurant.name}</div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            &times;
          </button>
        </div>

        <div className="info-tabs">
          <button
            type="button"
            className={`info-tab${tab === "sobre" ? " active" : ""}`}
            onClick={() => setTab("sobre")}
          >
            SOBRE
          </button>
          <button
            type="button"
            className={`info-tab${tab === "horario" ? " active" : ""}`}
            onClick={() => setTab("horario")}
          >
            HORÁRIO
          </button>
          <button
            type="button"
            className={`info-tab${tab === "pagamento" ? " active" : ""}`}
            onClick={() => setTab("pagamento")}
          >
            PAGAMENTO
          </button>
        </div>

        <div className="info-tab-content">
          {tab === "sobre" && (
            <div>
              <div className="info-sobre-top">
                <div
                  className="info-logo"
                  style={
                    restaurant.logo_url
                      ? { backgroundImage: `url(${restaurant.logo_url})` }
                      : undefined
                  }
                >
                  {!restaurant.logo_url && logoInitials}
                </div>
                {restaurant.instagram && (
                  <a
                    className="info-instagram"
                    href={`https://instagram.com/${restaurant.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📷 @{restaurant.instagram}
                  </a>
                )}
              </div>

              {whatsappDigits && (
                <div className="info-section">
                  <div className="info-section-title">Contato</div>
                  <div className="info-contact-row">
                    <a
                      className="info-contact-btn"
                      href={`https://wa.me/${whatsappDigits}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      💬 {formatPhoneBR(restaurant.whatsapp_number ?? "")}
                    </a>
                    <a className="info-contact-btn" href={`tel:+${whatsappDigits}`}>
                      📞 {formatPhoneBR(restaurant.whatsapp_number ?? "")}
                    </a>
                  </div>
                </div>
              )}

              {restaurant.address && (
                <div className="info-section">
                  <div className="info-section-title">Endereço</div>
                  <div>{restaurant.address}</div>
                </div>
              )}

              {!whatsappDigits && !restaurant.address && !restaurant.instagram && (
                <div className="admin-hint">Nenhuma informação cadastrada ainda.</div>
              )}
            </div>
          )}

          {tab === "horario" && (
            <div className="hours-table">
              {restaurant.business_hours ? (
                DAY_ORDER.map((key) => {
                  const d = restaurant.business_hours![key];
                  return (
                    <div
                      className={`hours-row${key === todayKey ? " today" : ""}`}
                      key={key}
                    >
                      <span>{DAY_LABELS[key]}</span>
                      <span>{d && !d.closed ? `${d.open} às ${d.close}` : "Fechado"}</span>
                    </div>
                  );
                })
              ) : (
                <div className="admin-hint">Horário ainda não cadastrado.</div>
              )}
            </div>
          )}

          {tab === "pagamento" && (
            <div className="payment-list">
              {selectedPayments.length > 0 ? (
                selectedPayments.map((m) => (
                  <div className="payment-badge" key={m.key}>
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                  </div>
                ))
              ) : (
                <div className="admin-hint">
                  Nenhuma forma de pagamento cadastrada ainda.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
