/**
 * Alle sichtbaren Texte des Spots. Quellen: Landingpage (src/content.ts im Repo
 * remote-job-kompass), das Ebook (Kapitel „Wo die Remote-Stellen wirklich
 * sind“, „Das Suchsystem“, „Gespräche im Remote-Prozess“) und die Ad vom
 * 1. Oktober (Produktname auf dem Cover).
 */
export const brand = {
  name: "Remote Job Kompass",
  kicker: "REMOTE JOB KOMPASS",
  /** Titel auf dem Cover. Das PDF selbst heißt „Der Remote Kompass“. */
  coverTitle: ["Remote", "in 30 Tagen"],
  coverSub: "Das System für die strukturierte Remote-Jobsuche",
  tagline: ["Der Fahrplan zu deinem", "Remote-Job."],
  price: "39",
  currency: "€",
  priceNote: "einmalig · kein Abo",
  cta: "Jetzt sichern",
  delivery: "Sofort-Download · Guide + Vorlagen",
  linkHint: "Link unten",
};

/** Vier Märkte aus Kapitel 4 des Ebooks, mit typischer Mitbewerberzahl (Tabelle im Buch). */
export const markets = [
  { n: "01", title: "Jobbörsen", sub: "offen ausgeschrieben", rivals: "200–2.000", icon: "boards" },
  { n: "02", title: "Firmenseiten", sub: "direkt beim Team", rivals: "30–200", icon: "building" },
  { n: "03", title: "Netzwerk", sub: "Empfehlung & Kontakte", rivals: "1–10", icon: "network" },
  { n: "04", title: "Verdeckter Markt", sub: "nie ausgeschrieben", rivals: "0–5", icon: "iceberg" },
] as const;

/** Jobbörsen-Liste im Handy (Szene 2) – typische Anzeigen, die nur halb remote sind. */
export const boardItems = [
  { title: "Projektmanager (m/w/d)", meta: "Hybrid · 3 Tage Büro", tag: "Vor Ort" },
  { title: "Marketing Manager", meta: "Homeoffice nach Absprache", tag: "Hybrid" },
  { title: "Customer Success Lead", meta: "Berlin · Präsenz", tag: "Vor Ort" },
  { title: "Product Owner", meta: "2 Tage Homeoffice", tag: "Hybrid" },
  { title: "Sachbearbeiter Vertrieb", meta: "Remote? Nein", tag: "Vor Ort" },
  { title: "UX Designer", meta: "Hybrid · München", tag: "Hybrid" },
  { title: "Teamassistenz", meta: "Vollzeit · Büro", tag: "Vor Ort" },
  { title: "Data Analyst", meta: "1 Tag remote / Woche", tag: "Hybrid" },
];

/** Vorlage „Direktnachricht zur ausgeschriebenen Stelle“ (Kap. 7). */
export const template = {
  label: "// vorlage f",
  title: "Direktnachricht",
  lines: ["Hallo [Name],", "ich habe gesehen, dass ihr eine", "[Rolle] sucht – und wollte mich", "direkt bei dir melden …"],
};

/** Spalten/Beispielzeilen des Bewerbungs-Trackers (Kap. 6). */
export const trackerRows = [
  { firm: "Firma A", channel: "Netzwerk", step: "Gespräch Do" },
  { firm: "Firma B", channel: "Direkt", step: "Nachfassen Mo" },
  { firm: "Firma C", channel: "Initiativ", step: "Antwort offen" },
];

/** Fragen aus „Gespräche im Remote-Prozess“ (Kap. 8). */
export const questions = [
  "Wie viele im Team arbeiten vollständig remote?",
  "Wie sieht eine typische Woche in der Rolle aus?",
  "Woran misst ihr Erfolg nach 6 Monaten?",
];
