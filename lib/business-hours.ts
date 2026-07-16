export type DayKey = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";

export type DayHours = {
  open: string; // "HH:MM"
  close: string; // "HH:MM"
  closed: boolean;
};

export type BusinessHours = Record<DayKey, DayHours>;

export const DAY_ORDER: DayKey[] = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];

export const DAY_LABELS: Record<DayKey, string> = {
  seg: "Segunda",
  ter: "Terça",
  qua: "Quarta",
  qui: "Quinta",
  sex: "Sexta",
  sab: "Sábado",
  dom: "Domingo",
};

const WEEKDAY_TO_DAY_KEY: Record<string, DayKey> = {
  Mon: "seg",
  Tue: "ter",
  Wed: "qua",
  Thu: "qui",
  Fri: "sex",
  Sat: "sab",
  Sun: "dom",
};

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

function nowInSaoPaulo(): { day: DayKey; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;

  const day = WEEKDAY_TO_DAY_KEY[map.weekday] ?? "seg";
  let hour = parseInt(map.hour, 10);
  if (hour === 24) hour = 0;
  const minute = parseInt(map.minute, 10) || 0;

  return { day, minutes: hour * 60 + minute };
}

export function getTodayKey(): DayKey {
  return nowInSaoPaulo().day;
}

export function getOpenStatus(
  hours: BusinessHours | null | undefined
): { open: boolean; label: string } | null {
  if (!hours) return null;

  const { day, minutes } = nowInSaoPaulo();
  const todayIndex = DAY_ORDER.indexOf(day);
  const today = hours[day];

  if (today && !today.closed && today.open && today.close) {
    const openMin = toMinutes(today.open);
    const closeMin = toMinutes(today.close);
    if (minutes >= openMin && minutes < closeMin) {
      return { open: true, label: `Aberto até às ${today.close}` };
    }
    if (minutes < openMin) {
      return { open: false, label: `Fechado • Abrimos às ${today.open}` };
    }
  }

  for (let i = 1; i <= 7; i++) {
    const dayKey = DAY_ORDER[(todayIndex + i) % 7];
    const d = hours[dayKey];
    if (!d || d.closed || !d.open) continue;
    const when = i === 1 ? "amanhã" : DAY_LABELS[dayKey].toLowerCase();
    return { open: false, label: `Fechado • Abrimos ${when} às ${d.open}` };
  }

  return { open: false, label: "Fechado" };
}
