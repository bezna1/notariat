import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  FolderKanban,
  History,
  LayoutDashboard,
  Lock,
  LogOut,
  Plus,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type Role = "Administrator" | "Notariusz" | "Sekretariat";
type View = "wizard" | "history" | "templates" | "settings";
type PartyType = "Osoba fizyczna" | "Spółka";

type User = {
  login: string;
  password: string;
  role: Role;
};

type Template = {
  id: string;
  name: string;
  category: string;
  version: string;
  updatedAt: string;
  requiredFields: string[];
  body: string;
};

type Party = {
  type: PartyType;
  name: string;
  pesel: string;
  idNumber: string;
  address: string;
  companyNumber: string;
};

type Project = {
  id: string;
  title: string;
  category: string;
  templateName: string;
  status: "Roboczy" | "Zatwierdzony";
  createdAt: string;
  warnings: number;
};

type ApiStatus = "sprawdzanie" | "online" | "offline";

const users: User[] = [
  { login: "admin", password: "admin123", role: "Administrator" },
  { login: "notariusz", password: "notariusz123", role: "Notariusz" },
  { login: "sekretariat", password: "sekretariat123", role: "Sekretariat" },
];

const seedTemplates: Template[] = [
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

const emptyParty: Party = {
  type: "Osoba fizyczna",
  name: "",
  pesel: "",
  idNumber: "",
  address: "",
  companyNumber: "",
};

const steps = ["Kategoria", "Szablon", "Quiz", "Strony", "Walidacja", "Podgląd", "Zatwierdzenie"];

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function App() {
  const [user, setUser] = useState<User | null>(() => readStorage<User | null>("aktomat-user", null));
  const [view, setView] = useState<View>("wizard");
  const [login, setLogin] = useState("notariusz");
  const [password, setPassword] = useState("notariusz123");
  const [loginError, setLoginError] = useState("");
  const [templates, setTemplates] = useState<Template[]>(() => readStorage("aktomat-templates", seedTemplates));
  const [projects, setProjects] = useState<Project[]>(() => readStorage("aktomat-projects", []));
  const [apiStatus, setApiStatus] = useState<ApiStatus>("sprawdzanie");
  const [category, setCategory] = useState("Nieruchomości");
  const [templateId, setTemplateId] = useState("tpl-sale");
  const [step, setStep] = useState(0);
  const [price, setPrice] = useState("520000");
  const [landRegister, setLandRegister] = useState("WA1M/12345678/9");
  const [deedDate, setDeedDate] = useState(today());
  const [place, setPlace] = useState("Warszawa");
  const [parties, setParties] = useState<Party[]>([
    { ...emptyParty, name: "Jan Kowalski", pesel: "80010112345", idNumber: "ABC123456", address: "ul. Prosta 10, 00-001 Warszawa" },
    { ...emptyParty, name: "Anna Nowak", pesel: "85020254321", idNumber: "DEF987654", address: "ul. Jasna 5, 00-002 Warszawa" },
  ]);
  const [approved, setApproved] = useState(false);

  useEffect(() => localStorage.setItem("aktomat-templates", JSON.stringify(templates)), [templates]);
  useEffect(() => localStorage.setItem("aktomat-projects", JSON.stringify(projects)), [projects]);
  useEffect(() => {
    let ignore = false;
    async function loadBackendState() {
      try {
        const [healthResponse, templatesResponse] = await Promise.all([
          fetch("/api/health"),
          fetch("/api/templates"),
        ]);
        if (!healthResponse.ok || !templatesResponse.ok) throw new Error("API unavailable");
        const payload = (await templatesResponse.json()) as { templates: Template[] };
        if (!ignore) {
          setApiStatus("online");
          setTemplates(payload.templates);
        }
      } catch {
        if (!ignore) setApiStatus("offline");
      }
    }
    loadBackendState();
    return () => {
      ignore = true;
    };
  }, []);
  useEffect(() => {
    if (user) {
      localStorage.setItem("aktomat-user", JSON.stringify(user));
    } else {
      localStorage.removeItem("aktomat-user");
    }
  }, [user]);

  const categories = Array.from(new Set(templates.map((template) => template.category)));
  const availableTemplates = templates.filter((template) => template.category === category);
  const selectedTemplate = templates.find((template) => template.id === templateId) ?? availableTemplates[0] ?? templates[0];

  const issues = (() => {
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!selectedTemplate) errors.push("Wybierz szablon aktu.");
    if (!price || Number(price) <= 0) errors.push("Cena musi być większa od zera.");
    if (category === "Nieruchomości" && !/^[A-Z0-9]{4}\/\d{8}\/\d$/.test(landRegister)) {
      warnings.push("Numer księgi wieczystej ma nietypowy format.");
    }
    parties.forEach((party, index) => {
      const label = `Strona ${index + 1}`;
      if (!party.name.trim()) errors.push(`${label}: brak imienia i nazwiska albo nazwy.`);
      if (!party.address.trim()) errors.push(`${label}: brak adresu.`);
      if (party.type === "Osoba fizyczna" && !/^\d{11}$/.test(party.pesel)) errors.push(`${label}: PESEL musi mieć 11 cyfr.`);
      if (party.type === "Spółka" && !party.companyNumber.trim()) errors.push(`${label}: brak numeru KRS/NIP.`);
    });
    if (Number(price) > 1_000_000) warnings.push("Wysoka wartość czynności: sprawdź dodatkowe oświadczenia i podatki.");
    return { errors, warnings };
  })();

  const deedText = (() => {
    const [first, second] = parties;
    return `AKT NOTARIALNY

Dnia ${deedDate} roku w miejscowości ${place}, przed notariuszem prowadzącym kancelarię, stawili się:

1. ${first?.name || "[strona pierwsza]"}, PESEL ${first?.pesel || "[PESEL]"}, legitymujący/a się dokumentem ${first?.idNumber || "[dokument]"}, adres: ${first?.address || "[adres]"}.
2. ${second?.name || "[strona druga]"}, PESEL ${second?.pesel || "[PESEL]"}, legitymujący/a się dokumentem ${second?.idNumber || "[dokument]"}, adres: ${second?.address || "[adres]"}.

Kategoria aktu: ${category}
Szablon: ${selectedTemplate?.name ?? "[brak szablonu]"} v${selectedTemplate?.version ?? "-"}
Księga wieczysta: ${landRegister || "[do uzupełnienia]"}
Wartość czynności: ${Number(price || 0).toLocaleString("pl-PL")} zł

§ 1. Strony oświadczają, że dane wskazane w akcie są zgodne z okazanymi dokumentami.
§ 2. Zakres czynności został określony według szablonu: ${selectedTemplate?.body ?? ""}.
§ 3. Projekt wymaga kontroli notariusza przed podpisaniem.

Status walidacji: ${issues.errors.length ? "wymaga poprawek" : "brak błędów krytycznych"}.`;
  })();

  function handleLogin() {
    const found = users.find((item) => item.login === login && item.password === password);
    if (!found) {
      setLoginError("Nieprawidłowy login lub hasło.");
      return;
    }
    setUser(found);
    setLoginError("");
  }

  function updateParty(index: number, patch: Partial<Party>) {
    setParties((current) => current.map((party, partyIndex) => (partyIndex === index ? { ...party, ...patch } : party)));
  }

  function approveProject() {
    setApproved(true);
    const project: Project = {
      id: crypto.randomUUID(),
      title: `${selectedTemplate?.name ?? "Akt"} - ${parties[0]?.name || "projekt"}`,
      category,
      templateName: selectedTemplate?.name ?? "Brak szablonu",
      status: "Zatwierdzony",
      createdAt: new Date().toLocaleString("pl-PL"),
      warnings: issues.warnings.length,
    };
    setProjects((current) => [project, ...current].slice(0, 12));
    fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    }).catch(() => undefined);
  }

  function exportDocx() {
    const blob = new Blob([deedText], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "projekt-aktu-symulowany.docx";
    link.click();
    URL.revokeObjectURL(url);
  }

  function addTemplate() {
    const next: Template = {
      id: crypto.randomUUID(),
      name: "Nowy szablon testowy",
      category: "Własne",
      version: "0.1",
      updatedAt: today(),
      requiredFields: ["Dane stron", "Parametry aktu"],
      body: "Roboczy szablon do testów UX.",
    };
    setTemplates((current) => [next, ...current]);
    setCategory("Własne");
    setTemplateId(next.id);
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#eef3f8] px-5 py-8 text-slate-900">
        <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_420px]">
          <div>
            <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-lg bg-[#17324d] text-white">
              <FileText size={28} />
            </div>
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-[#111827]">Aktomat dla kancelarii notarialnej</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Prototyp UX do testowania generowania aktów z szablonów DOCX, walidacji danych, podglądu i historii projektów.
            </p>
            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {users.map((item) => (
                <button
                  className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-[#17324d]"
                  key={item.login}
                  onClick={() => {
                    setLogin(item.login);
                    setPassword(item.password);
                  }}
                >
                  <span className="block text-sm font-semibold">{item.role}</span>
                  <span className="mt-1 block text-xs text-slate-500">{item.login}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/70">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#e8f0f7] text-[#17324d]">
                <Lock size={22} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Logowanie lokalne</h2>
                <p className="text-sm text-slate-500">Dane nie opuszczają prototypu.</p>
              </div>
            </div>
            <label className="text-sm font-medium text-slate-700" htmlFor="login">Login</label>
            <input id="login" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-[#17324d]" value={login} onChange={(event) => setLogin(event.target.value)} />
            <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="password">Hasło</label>
            <input id="password" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-[#17324d]" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            {loginError && <p className="mt-3 text-sm font-medium text-red-700">{loginError}</p>}
            <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#17324d] px-4 py-3 font-semibold text-white hover:bg-[#0f253a]" onClick={handleLogin}>
              <ShieldCheck size={18} />
              Zaloguj
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-slate-200 bg-white px-4 py-5">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#17324d] text-white">
              <FileText size={21} />
            </div>
            <div>
              <p className="font-semibold">Aktomat</p>
              <p className="text-xs text-slate-500">Prototyp UX</p>
            </div>
          </div>
          <nav className="space-y-1">
            <NavButton active={view === "wizard"} icon={<LayoutDashboard size={18} />} label="Nowy akt" onClick={() => setView("wizard")} />
            <NavButton active={view === "history"} icon={<History size={18} />} label="Historia" onClick={() => setView("history")} />
            <NavButton active={view === "templates"} icon={<Archive size={18} />} label="Szablony" onClick={() => setView("templates")} />
            <NavButton active={view === "settings"} icon={<FolderKanban size={18} />} label="Ustawienia" onClick={() => setView("settings")} />
          </nav>
        </aside>

        <section className="min-w-0">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
            <div>
              <h1 className="text-xl font-semibold">Generator aktów notarialnych</h1>
              <p className="text-sm text-slate-500">Lokalny prototyp przepływu pracy z szablonami DOCX</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <span className={`h-2 w-2 rounded-full ${apiStatus === "online" ? "bg-emerald-500" : apiStatus === "offline" ? "bg-amber-500" : "bg-slate-300"}`} />
                API {apiStatus}
              </span>
              <span className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <UserRound size={16} />
                {user.role}
              </span>
              <button className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50" title="Wyloguj" onClick={() => setUser(null)}>
                <LogOut size={18} />
              </button>
            </div>
          </header>

          {view === "wizard" && (
            <div className="p-5">
              <div className="mb-5 overflow-x-auto rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex min-w-[760px] gap-2">
                  {steps.map((label, index) => (
                    <button
                      className={`flex flex-1 items-center justify-center rounded-md px-3 py-2 text-sm font-medium ${index === step ? "bg-[#17324d] text-white" : index < step ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                      key={label}
                      onClick={() => setStep(index)}
                    >
                      {index < step ? <CheckCircle2 className="mr-1" size={15} /> : null}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-[minmax(440px,620px)_1fr]">
                <section className="space-y-5">
                  <Panel title="Parametry aktu" icon={<ClipboardList size={19} />}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Kategoria">
                        <select className="input" value={category} onChange={(event) => {
                          const nextCategory = event.target.value;
                          setCategory(nextCategory);
                          setTemplateId(templates.find((template) => template.category === nextCategory)?.id ?? "");
                        }}>
                          {categories.map((item) => <option key={item}>{item}</option>)}
                        </select>
                      </Field>
                      <Field label="Szablon">
                        <select className="input" value={selectedTemplate?.id ?? ""} onChange={(event) => setTemplateId(event.target.value)}>
                          {availableTemplates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
                        </select>
                      </Field>
                      <Field label="Data aktu">
                        <input className="input" type="date" value={deedDate} onChange={(event) => setDeedDate(event.target.value)} />
                      </Field>
                      <Field label="Miejscowość">
                        <input className="input" value={place} onChange={(event) => setPlace(event.target.value)} />
                      </Field>
                      <Field label="Cena / wartość czynności">
                        <input className="input" inputMode="numeric" value={price} onChange={(event) => setPrice(event.target.value)} />
                      </Field>
                      <Field label="Księga wieczysta">
                        <input className="input" value={landRegister} onChange={(event) => setLandRegister(event.target.value.toUpperCase())} />
                      </Field>
                    </div>
                  </Panel>

                  <Panel title="Strony czynności" icon={<UserRound size={19} />}>
                    <div className="space-y-4">
                      {parties.map((party, index) => (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={index}>
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="font-semibold">Strona {index + 1}</h3>
                            <select className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm" value={party.type} onChange={(event) => updateParty(index, { type: event.target.value as PartyType })}>
                              <option>Osoba fizyczna</option>
                              <option>Spółka</option>
                            </select>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <input className="input" placeholder="Imię i nazwisko / nazwa" value={party.name} onChange={(event) => updateParty(index, { name: event.target.value })} />
                            <input className="input" placeholder="PESEL" value={party.pesel} onChange={(event) => updateParty(index, { pesel: event.target.value })} />
                            <input className="input" placeholder="Dowód osobisty" value={party.idNumber} onChange={(event) => updateParty(index, { idNumber: event.target.value.toUpperCase() })} />
                            <input className="input" placeholder="KRS / NIP dla spółki" value={party.companyNumber} onChange={(event) => updateParty(index, { companyNumber: event.target.value })} />
                            <input className="input sm:col-span-2" placeholder="Adres" value={party.address} onChange={(event) => updateParty(index, { address: event.target.value })} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Panel>

                  <Panel title="Walidacja i decyzja" icon={<AlertTriangle size={19} />}>
                    <ValidationList errors={issues.errors} warnings={issues.warnings} />
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button disabled={issues.errors.length > 0} className="btn-primary disabled:cursor-not-allowed disabled:bg-slate-300" onClick={approveProject}>
                        <Save size={18} />
                        Zatwierdź projekt
                      </button>
                      <button className="btn-secondary" onClick={exportDocx}>
                        <Download size={18} />
                        Eksportuj DOCX
                      </button>
                    </div>
                    {approved && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">Projekt zapisany w historii.</p>}
                  </Panel>
                </section>

                <section className="min-w-0 rounded-lg border border-slate-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                    <div>
                      <h2 className="font-semibold">Podgląd wygenerowanego aktu</h2>
                      <p className="text-sm text-slate-500">Tekst składany lokalnie z parametrów formularza.</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${issues.errors.length ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                      {issues.errors.length ? "Wymaga poprawek" : "Gotowy do kontroli"}
                    </span>
                  </div>
                  <pre className="doc-preview min-h-[680px] whitespace-pre-wrap p-8 text-[17px] leading-8 text-slate-900">{deedText}</pre>
                </section>
              </div>
            </div>
          )}

          {view === "history" && (
            <SimplePage title="Historia projektów" subtitle="Symulowana trwałość danych w localStorage.">
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                {projects.length === 0 ? (
                  <p className="p-6 text-slate-500">Brak zapisanych projektów. Zatwierdź projekt w kreatorze.</p>
                ) : (
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Projekt</th>
                        <th className="px-4 py-3">Kategoria</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Ostrzeżenia</th>
                        <th className="px-4 py-3">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((project) => (
                        <tr className="border-t border-slate-100" key={project.id}>
                          <td className="px-4 py-3 font-medium">{project.title}</td>
                          <td className="px-4 py-3">{project.category}</td>
                          <td className="px-4 py-3"><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{project.status}</span></td>
                          <td className="px-4 py-3">{project.warnings}</td>
                          <td className="px-4 py-3 text-slate-500">{project.createdAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </SimplePage>
          )}

          {view === "templates" && (
            <SimplePage title="Zarządzanie szablonami" subtitle="Lista symuluje katalog lokalnych plików DOCX.">
              <div className="mb-4 flex justify-end">
                <button className="btn-primary" onClick={addTemplate}><Plus size={18} />Dodaj szablon</button>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {templates.map((template) => (
                  <article className="rounded-lg border border-slate-200 bg-white p-5" key={template.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{template.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">{template.category} · wersja {template.version}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{template.updatedAt}</span>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-600">{template.body}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {template.requiredFields.map((field) => <span className="rounded-md bg-[#e8f0f7] px-2 py-1 text-xs font-medium text-[#17324d]" key={field}>{field}</span>)}
                    </div>
                  </article>
                ))}
              </div>
            </SimplePage>
          )}

          {view === "settings" && (
            <SimplePage title="Ustawienia prototypu" subtitle="Ekran pomocniczy do testowania roli i założeń offline.">
              <div className="grid gap-4 md:grid-cols-3">
                {["Offline", "Bez AI", "Bez API zewnętrznych"].map((item) => (
                  <div className="rounded-lg border border-slate-200 bg-white p-5" key={item}>
                    <CheckCircle2 className="mb-3 text-emerald-600" />
                    <h3 className="font-semibold">{item}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">Założenie docelowej aplikacji desktopowej zachowane w prototypie UX.</p>
                  </div>
                ))}
              </div>
            </SimplePage>
          )}
        </section>
      </div>
    </main>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${active ? "bg-[#e8f0f7] text-[#17324d]" : "text-slate-600 hover:bg-slate-50"}`} onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center gap-2 text-[#17324d]">
        {icon}
        <h2 className="font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function ValidationList({ errors, warnings }: { errors: string[]; warnings: string[] }) {
  if (!errors.length && !warnings.length) {
    return <p className="rounded-lg bg-emerald-50 px-3 py-3 text-sm font-medium text-emerald-700">Brak błędów krytycznych i ostrzeżeń.</p>;
  }
  return (
    <div className="space-y-3">
      {errors.map((error) => <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" key={error}>Błąd: {error}</p>)}
      {warnings.map((warning) => <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800" key={warning}>Ostrzeżenie: {warning}</p>)}
    </div>
  );
}

function SimplePage({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="p-5">
      <div className="mb-5">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
