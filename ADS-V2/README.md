# Kampagne „Nachtlicht“: fünf Meta-Ads ohne Voice-over

Briefing (Strategie, Drehbücher, Compliance, Anzeigentexte): [`../BRIEFING-V2.md`](../BRIEFING-V2.md)

Alle Ads: 9:16 · 1080 × 1920 · 30 fps · H.264 + AAC 48 kHz · −14 LUFS · True Peak ≤ −1 dBTP.
Musik als eigene Partitur je Ad, gespielt mit echten Instrument-Samples (GeneralUser GS,
kommerziell frei nutzbar), dazu synthetisiertes Sounddesign. Alles ohne Sprecher und auch stumm verständlich.

| Datei | Winkel | Hook (erste Sekunde) | Länge |
| --- | --- | --- | --- |
| `REMOTE-JOB-KOMPASS-V2-01-AUFFUEHRUNG.mp4` | Familie / verpasste Momente | Push-Nachricht „Kommst du heute zu meiner Aufführung? 🥺“ | 24 s |
| `REMOTE-JOB-KOMPASS-V2-02-KOMPASS.mp4` | Orientierungslosigkeit | Kompassnadel dreht durch, „Du bewirbst dich.“ | 22,6 s |
| `REMOTE-JOB-KOMPASS-V2-03-HUNDERTE.mp4` | Unsichtbar in der Masse | „Das ist deine Bewerbung.“ und dann Hunderte Punkte | 24 s |
| `REMOTE-JOB-KOMPASS-V2-04-14-TAGE.mp4` | Lebenszeit im Pendelverkehr | „14 Tage.“ (Beispielrechnung 45 Min. Arbeitsweg) | 22,4 s |
| `REMOTE-JOB-KOMPASS-V2-05-MAIL.mp4` | Zukunfts-Ich | Ungelesene Mail „Du · in 12 Monaten“ | 24 s |

Zu jeder Ad gibt es ein Vorschaubild (`…-COVER.jpg`).

## Schalten

Lade alle fünf als **eigene Anzeigen in eine Anzeigengruppe** (Ziel: Käufe). Lass sie 3–5 Tage laufen,
ohne einzugreifen, und vergleiche Hook-Rate, Hold-Rate, Link-CTR und Kosten pro Kauf. Die Anzeigentexte je
Ad stehen in `BRIEFING-V2.md`, Abschnitt 8.

## Neu erzeugen

```sh
cd video
npm install && pip install numpy scipy numba pyloudnorm mido   # dazu fluidsynth (apt/brew)
python3 audio/build_v2.py          # Musik + Effekte (lädt die SoundFont beim ersten Mal)
node scripts/render-v2.mjs         # Bild rendern + Ton anlegen → ../ADS-V2/
```

Zeitpunkte je Ad: `video/src/v2/ads/<id>.json`. Bild und Ton lesen dieselben Werte.
Texte stehen direkt in den Szenen `video/src/v2/A*.tsx`.
