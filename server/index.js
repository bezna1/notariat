import express from "express";
import { randomUUID } from "node:crypto";

const app = express();
const port = Number(process.env.PORT ?? 8787);

app.use(express.json());

const templates = [
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

const projects = [];

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, mode: "local-test-backend", timestamp: new Date().toISOString() });
});

app.get("/api/templates", (_request, response) => {
  response.json({ templates });
});

app.get("/api/projects", (_request, response) => {
  response.json({ projects });
});

app.post("/api/projects", (request, response) => {
  const project = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...request.body,
  };
  projects.unshift(project);
  response.status(201).json({ project });
});

app.listen(port, () => {
  console.log(`API ready: http://localhost:${port}`);
});
