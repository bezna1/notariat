export const templates = [
  {
    id: "tpl-sale",
    name: "Umowa sprzedaży lokalu",
    category: "Nieruchomości",
    version: "1.4",
    updatedAt: "2026-05-18",
    requiredFields: ["Dane sprzedającego", "Dane kupującego", "Cena", "Księga wieczysta"],
    body: "Akt notarialny sprzedaży lokalu mieszkalnego wraz z oświadczeniami stron.",
  },
  {
    id: "tpl-donation-real-estate",
    name: "Umowa darowizny nieruchomości",
    category: "Nieruchomości",
    version: "1.0",
    updatedAt: "2026-05-23",
    requiredFields: ["Darczyńca", "Obdarowany", "Wartość darowizny", "Księga wieczysta", "Podstawa nabycia"],
    body: "Akt notarialny darowizny nieruchomości z oświadczeniem darczyńcy o nieodpłatnym przeniesieniu własności i oświadczeniem obdarowanego o przyjęciu darowizny.",
  },
  {
    id: "tpl-power",
    name: "Pełnomocnictwo ogólne",
    category: "Pełnomocnictwa",
    version: "2.1",
    updatedAt: "2026-05-10",
    requiredFields: ["Mocodawca", "Pełnomocnik", "Zakres umocowania"],
    body: "Akt notarialny obejmujący udzielenie pełnomocnictwa do czynności zwykłego zarządu.",
  },
  {
    id: "tpl-inherit",
    name: "Poświadczenie dziedziczenia",
    category: "Spadki",
    version: "1.2",
    updatedAt: "2026-04-30",
    requiredFields: ["Spadkodawca", "Spadkobiercy", "Podstawa dziedziczenia"],
    body: "Protokół dziedziczenia i akt poświadczenia dziedziczenia.",
  },
];

export const projects = [];
