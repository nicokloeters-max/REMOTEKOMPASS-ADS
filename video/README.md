# Meta-Ad „Funkstille“ (Remote Job Kompass)

9:16 · 1080 × 1920 · 60 fps · H.264 + AAC · ca. 34 s · Voice-over (ElevenLabs), Musik und Sounddesign.

Das Briefing mit Zielgruppe, Hook-Strategie, Sprechertext, Stilregeln und Compliance steht in
[`../BRIEFING.md`](../BRIEFING.md).

## Aufbau

| Pfad | Inhalt |
| --- | --- |
| `voice/script.json` | Sprechertext je Zeile, Pausen, Stimme, ElevenLabs-Einstellungen |
| `scripts/voice.mjs` | Erzeugt das Voice-over zeilenweise mit Wort-Zeitstempeln → `voice/vo.json` |
| `scripts/timeline.mjs` | Baut daraus die gemeinsame Zeitachse `src/timeline.json` (Bild **und** Ton) |
| `src/tl.ts` | Szenengrenzen und Ereignisse, abgeleitet aus den Wortzeiten |
| `src/mascot/` | Die 3D-Figur (Three.js) mit Halbton-Shader und Mimik |
| `src/mascotTrack.ts` | Choreografie der Figur (Mimik, Position, Squash & Stretch) |
| `src/scenes/` | Die sieben Szenen |
| `src/content.ts` | Alle sichtbaren Texte, Preis, Coverdaten |
| `audio/build_audio.py` | Musik und Effekte (komplett synthetisiert) + Mischung auf −14 LUFS |

Jede Text-Animation startet auf dem Wortanfang im Voice-over. Wird der Sprechertext geändert,
laufen nach `voice → timeline → audio → render` Bild, Musik und Effekte automatisch wieder synchron.

## Erzeugen

```sh
npm install
pip install numpy scipy numba pyloudnorm pillow

# 1) Stimme (Schlüssel als Umgebungsvariable oder in video/.env, die nicht ins Repo geht)
ELEVENLABS_API_KEY=… npm run voice        # ohne Netz: node scripts/voice.mjs --placeholder
node scripts/timeline.mjs

# 2) Ton
npm run audio                              # audio/out/mix.wav

# 3) Bild + Zusammenführen
node scripts/stills.mjs 0 600 1200         # Prüfbilder nach out/stills
FINAL=1 npm run render                     # out/video-silent.mp4
sh scripts/mux.sh                          # ../REMOTE-JOB-KOMPASS-META-AD-FUNKSTILLE.mp4
```

Das Rendern nutzt das vorinstallierte Chromium mit Software-WebGL (`gl: "swangle"`).
Remotion ist für Einzelpersonen und Firmen bis 3 Mitarbeitende kostenlos, darüber braucht es eine
Firmenlizenz (remotion.pro).

## Anpassen

- **Produkttitel auf dem Cover:** `src/content.ts` → `brand.coverTitle`.
- **Preis, CTA, Hinweise:** `src/content.ts` → `brand`.
- **Sprechertext / Pausen:** `voice/script.json`, danach `voice`, `timeline`, `audio`, `render`.
  Die Szenen greifen per Index auf Wörter zu. `timeline.mjs` warnt, wenn sich die Wortzahl einer
  Zeile ändert, dann müssen die Indizes in der Szene nachgezogen werden.
