# Optimiertes Briefing: Meta-Ad „Funkstille“ für den Remote Job Kompass

Das ist die ausgearbeitete Fassung deines Prompts. Danach wurde die Ad produziert.

> **Ursprünglicher Prompt (sinngemäß):** Hochkant-Meta-Ad mit hoher Conversion für mein Remote-Job-E-Book,
> sehr emotional, starke Hook gegen das Weiterwischen, Stil grob wie im Referenzvideo.
> Infos von der Website, Stimme über ElevenLabs.

---

## 1. Ziel

| | |
| --- | --- |
| Kampagnenziel | Verkäufe (Conversion „Purchase“). Der Spot soll direkt zum Kauf führen, nicht nur Reichweite bringen. |
| Platzierungen | Reels, Stories, Feed (9:16). Hauptplatzierung: Reels. |
| Erfolgskennzahlen | Hook-Rate (3-Sekunden-Views / Impressionen) > 30 %, Hold-Rate bis 15 s, CTR (Link), Kosten pro Kauf. |
| Länge | ca. 30 s. Die Hook trägt die ersten 1,5 s, das Angebot steht ab ca. Sekunde 26 im Bild. |

## 2. Produkt-Fakten (nur Belegtes)

Quellen: Landingpage `remote-job-kompass` (Branch `claude/remote-kompass-landing-pa9emt`, `src/content.ts`),
das E-Book selbst (Branch `claude/remote-kompass-ebook-4evfea`) und die Ad vom 1. Oktober
(Branch `claude/serene-hopper-hgncfy`). Die Live-Seite `compass-to-remote.lovable.app` war aus der
Produktionsumgebung gesperrt.

- Marke: **Remote Job Kompass**. Cover-Titel wie in der Ad vom 1. Oktober: *Remote in 30 Tagen*
  (das PDF heißt *Der Remote Kompass*. Eine Zeile in `video/src/content.ts` stellt das um).
- Untertitel: *Das System für die strukturierte Remote-Jobsuche*.
- Preis **39 €, Einmalzahlung, kein Abo**.
- Inhalt: Vorlagen, Bewerbungs-Tracker, Interview-Fragen, Gehaltsverhandlung, Quellenliste.
- Buchinhalt, den die Ad zeigt: die **vier Märkte** (Kap. „Wo die Remote-Stellen wirklich sind“):
  offene Jobbörsen · Firmenseiten direkt · Netzwerk & Empfehlung · verdeckter Markt.
- Kernthese des Buchs (Vorwort): Wer viele Bewerbungen ohne Antwort hat, *hat nicht versagt*.
  Er bewirbt sich in einem System, das nicht für ihn gebaut ist.

**Bewusst nicht im Spot:** Jobgarantie, Erfolgszahlen, Testimonials (auf der Landingpage nur
Platzhalter), Streichpreis 79 € und 14-Tage-Garantie (auf der Live-Seite nicht prüfbar).

## 3. Zielgruppe

Deutschsprachige Angestellte von 25 bis 45 mit Berufserfahrung, die remote arbeiten wollen.
Sie bewerben sich schon eine Weile und bekommen keine Antworten.

| Schmerz (heute) | Wunsch (morgen) |
| --- | --- |
| Bewerbungen verschwinden ohne Antwort („Funkstille“) | Endlich Rückmeldungen, endlich ein Plan |
| Jeden Abend dieselben Jobbörsen | Wissen, wo die guten Stellen wirklich sind |
| Pendeln, Stau, Zeit weg | Arbeitsweg = Flur, Zeit gehört wieder einem selbst |
| Leiser Selbstzweifel: „Liegt’s an mir?“ | Entlastung: „Es lag am System, nicht an mir“ |

## 4. Große Idee

**„Du hast nicht versagt. Dir fehlt nur ein System.“**
Der emotionale Wendepunkt nimmt die Schuld von der Person und gibt sie dem fehlenden System.
Das löst das Produkt ein (Untertitel des Covers: *Das System für …*).

## 5. Hook (0 bis 2 s)

- **Erstes Bild schon voll:** riesige „47“, darunter „Bewerbungen“, daneben die traurige Halftone-Figur.
  Es gibt kein leeres Startbild wie in der Referenz, weil das erste Bild auch das Vorschaubild ist.
- **Konkrete Zahlen statt Floskel:** „47 Bewerbungen. 3 Absagen. 44× Funkstille.“ Darin erkennt man sich sofort wieder.
- **Muster-Bruch im Ton:** Bei „Funkstille“ fällt die Musik komplett weg. Die Stille ist hörbar.
- Bewerbungs-Karten fliegen „ins Leere“ und verschwinden in einem Punkt. Aus diesem Punkt öffnet sich die nächste Szene.

## 6. Dramaturgie (PAS + Vision)

| # | Zeit (ca.) | Phase | Bild | Ton |
| --- | --- | --- | --- | --- |
| 1 | 0–4 s | **Hook / Problem** | Papier-Weiß. „47 Bewerbungen. 3 Absagen. 44× *Funkstille.*“ Karten fliegen weg, Absagen knallen rein, leerer Posteingang, Träne | Spannung, dann Stille |
| 2 | 4–8 s | **Verstärken** | Amber-Fläche (Kreis-Wipe). Handy mit endlos scrollender Jobbörse, „23:41“. Wecker „06:30“, Stau-Karte. Figur müde | Puls, Uhr-Ticken |
| 3 | 8–10 s | **Tiefpunkt** | Schwarz, Lichtkegel, kleine Figur. „Liegt’s an *mir?*“ | Einzelne Klaviertöne |
| 4 | 10–13 s | **Wendepunkt** | Weißer Blitz. „Nein.“ Die Figur schaut auf. „Du hast nicht versagt. Dir fehlt nur ein *System.*“ | Beat setzt ein |
| 5 | 13–21 s | **Lösung** | Buch fliegt ein. Vier Markt-Karten wie die Produktkarten der Referenz (Mitbewerber: 200–2.000 → 0–5). Raster mit Vorlage, Tracker, Interview-Fragen. Stempel „*Mit System.*“ | Treibend, Klicks, Stempel |
| 6 | 21–26 s | **Vision** | Halftone-Kreis ins Warme. Figur am Laptop mit Tasse, glücklich. „Dein Arbeitsweg: *der Flur.*“ Chip „Arbeitsweg · 12 Sek.“ | Höhepunkt, warm |
| 7 | 26–31 s | **Angebot + CTA** | Logo fällt ein, Figur taucht dahinter auf und zwinkert. Cover, „39 € · einmalig · kein Abo“, Button „Jetzt sichern →“, „↓ Link unten“ | Schlussakkord |

## 7. Sprechertext (ElevenLabs, Stimme `vvIfKUJ2y2tsRB2Duo5k`)

1. Siebenundvierzig Bewerbungen. Drei Absagen. Und vierundvierzigmal … Funkstille.
2. Jeden Abend dieselben Jobbörsen. Jeden Morgen derselbe Stau.
3. Und du fragst dich: Liegt’s an mir?
4. Nein. Du hast nicht versagt. Dir fehlt nur ein System.
5. Der Remote Job Kompass zeigt dir, wo Remote-Jobs wirklich vergeben werden – auch die, die nie ausgeschrieben werden.
6. Mit Vorlagen, Tracker und Interview-Fragen.
7. Stell dir vor: Dein Arbeitsweg ist nur noch der Flur. Und deine Zeit gehört wieder dir.
8. Remote Job Kompass. Einmalig neununddreißig Euro. Kein Abo. Hol ihn dir jetzt.

Der Text steht in `video/voice/script.json`. Jede Zeile wird einzeln erzeugt und bekommt die Nachbarzeilen
als Kontext (gleichmäßige Betonung). Die Pausen setzt die Zeitachse fest. Wort-Zeitstempel von ElevenLabs
steuern jede Text-Animation, deshalb sitzen Bild und Stimme framegenau.

## 8. Stil (aus der Referenz übertragen)

| Referenz | Umsetzung für den Remote Job Kompass |
| --- | --- |
| 3D-Figur im Halbton-Raster, reagiert mit Mimik | Eigene 3D-Figur (Three.js) mit Halbton-Shader, Locken, Rollkragen, **Kompass-Emblem** auf dem Pulli. Mimik: traurig, müde, erstaunt, hoffnungsvoll, glücklich, Zwinkern |
| Weiß / Kobaltblau / Schwarz | Papier `#f4f1ea` / Amber `#e8a33d` (Kompassnadel) / Tinte `#080c11`, alles aus der Landingpage |
| Fette Grotesk + kursive Serif-Akzente in Farbe | Inter Tight + Fraunces Italic in Amber (die Schriften der Landingpage) |
| Wörter steigen hinter einer Maske auf, Akzentwort unterstrichen | Gleich, aber synchron zum Voice-over-Wortanfang |
| Karten fliegen gestaffelt rein | Vier Markt-Karten mit Halbton-Icons |
| Zoom-Blur-Übergang, Stempel „Handled.“, Dither-Kreis, weißer Lichtkreis | Zoom-Blur in den Tracker, Stempel „*Mit System.*“, Dither-Kreis ins Schwarze, Lichtkreis zum „Nein.“ |
| Logo-Buchstaben fallen ein, Figur hinter dem Logo zwinkert | Gleich, mit „Remote Job Kompass“ |
| HUD: `// 01 — hook` und Timecode | `// 01 — funkstille` … `REMOTE JOB KOMPASS 00:00:00:00` |

## 9. Technische Vorgaben für Meta

- 1080 × 1920, 60 fps, H.264 High, yuv420p, AAC 48 kHz, `+faststart`.
- **Safe Zones (Reels):** Oben 14 % und unten 35 % bleiben frei von wichtigem Text. Die Figur und Deko
  dürfen dort stehen. Seitlich gilt ein Rand von mindestens 6 %. Preis und Button stehen über y = 1250.
- **Ohne Ton verständlich:** Jedes gesprochene Wort steht als Typo im Bild, das ersetzt Untertitel.
- Lautheit −14 LUFS integriert, True Peak ≤ −1 dBTP.

## 10. Compliance

- Keine Jobgarantie, kein „in X Tagen zum Job“, keine Verdienst- oder Erfolgsversprechen.
- Keine erfundenen Kundenstimmen (UWG). Zahlen im Bild sind entweder Szene („47 Bewerbungen“) oder Buchinhalt
  (Mitbewerberzahlen der vier Märkte, als Auszug gekennzeichnet).
- Meta-Richtlinie „persönliche Merkmale“: Es gibt keine Aussage über Arbeitslosigkeit, Finanzlage oder Ähnliches.
  „Du“-Sätze beschreiben Verhalten (Bewerben, Pendeln), keine geschützten Merkmale.
- Hinweis: Meta kann Anzeigen rund um „Jobs“ der Sonderkategorie *Beschäftigung* zuordnen.
  Ein Ratgeber ist kein Stellenangebot. Wird die Anzeige trotzdem markiert, hilft ein Einspruch mit dem Hinweis „digitales Produkt“.

## 11. Anzeigentexte (zum Einfügen im Werbeanzeigenmanager)

**Primärtext A (emotional)**
> 47 Bewerbungen. 3 Absagen. 44× Funkstille. 😶
> Wenn dir das bekannt vorkommt: Es liegt nicht an dir. Dir fehlt ein System.
> Der Remote Job Kompass zeigt dir die vier Märkte, in denen Remote-Stellen wirklich vergeben werden,
> plus Vorlagen, Bewerbungs-Tracker und Interview-Fragen.
> 👉 Einmalig 39 € · kein Abo · sofort als Download.

**Primärtext B (kurz)**
> Hör auf, Bewerbungen ins Leere zu schicken. Der Fahrplan zu deinem Remote-Job, einmalig 39 €.

**Überschrift:** Dein Fahrplan zum Remote-Job
**Beschreibung:** Einmalig 39 € · kein Abo
**Button:** „Jetzt kaufen“ (Alternative: „Mehr dazu“ für kalte Zielgruppen)
