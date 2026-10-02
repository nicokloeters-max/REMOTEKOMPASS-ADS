"""
Musik, Sounddesign und Mischung für die Ad „Funkstille“.

Liest src/timeline.json (Sekunden, aus den Wort-Zeitstempeln des Voice-overs)
und setzt jeden Effekt auf das Bildereignis, das ihn auslöst. Die Formeln für
Szenengrenzen sind dieselben wie in src/tl.ts.

Ergebnis in audio/out/:
  music.wav  – Musikbett (synthetisiert)
  sfx.wav    – Soundeffekte (synthetisiert)
  vo.wav     – Voice-over (falls voice/out/*.mp3 vorhanden)
  mix.wav    – Endmischung, −14 LUFS, True Peak ≤ −1 dBTP

dsp.py und instruments.py stammen aus der Ad vom 1. Oktober (Repo
remote-job-kompass, Branch claude/serene-hopper-hgncfy).
"""
import json
import os
import subprocess
import sys

import numpy as np
import pyloudnorm as pyln
from scipy.io import wavfile
from scipy.ndimage import maximum_filter1d, uniform_filter1d

sys.path.insert(0, os.path.dirname(__file__))
from dsp import (SR, RNG, n_of, tl, nf, sine, saw, noise, exp_env, adsr, fade, lp, hp, bp, svf, place, to_stereo,
                 reverb, delay, peaking, shelf_high, shelf_low, soft_clip, widen, pan, db)
import instruments as I

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
T = json.load(open(os.path.join(ROOT, "src", "timeline.json")))
DUR = T["duration"]
N = n_of(DUR)
LN = T["lines"]


def L(i):
    return LN[i]


def W(i, k):
    ws = LN[i]["words"]
    return ws[k % len(ws)]["s"]


# --- Szenengrenzen wie in src/tl.ts ------------------------------------------
S = {
    "abend": L("abend")["start"] - 0.32,
    "mir": L("mir")["start"] - 0.3,
    "nein": W("nein", 0) - 0.05,
    "kompass": L("kompass")["start"] - 0.28,
    "vision": L("vision")["start"] - 0.42,
    "cta": L("cta")["start"] - 0.32,
}
GRID = L("inhalt")["start"] - 0.38
STAMP = L("inhalt")["end"] + 0.02
FUNK = W("funk", 6)
BEAT = 0.6  # 100 BPM
T0 = W("nein", 9)  # Downbeat auf „System.“

music = {k: np.zeros((N, 2)) for k in ["drums", "bass", "pad", "keys", "fx"]}
sfx = np.zeros((N, 2))


def M(bus, snd, t, g=1.0):
    place(music[bus], snd, t, g)


def X(snd, t, g=1.0):
    place(sfx, snd, t, g)


# ============================================================ Instrumente
def piano(f, length=2.8, vel=0.8):
    """Gedämpftes „Felt Piano“: leicht inharmonische Teiltöne, weicher Anschlag."""
    t = tl(length)
    out = np.zeros(len(t))
    B = 0.00035
    for k in range(1, 10):
        fk = f * k * np.sqrt(1 + B * k * k)
        if fk > 9000:
            break
        amp = (1 / k ** 1.25) * vel ** (0.4 + 0.18 * k)
        tau = 2.2 / (1 + 0.45 * k) * (262 / f) ** 0.3
        out += amp * np.sin(2 * np.pi * fk * t + RNG.random() * 6.28) * np.exp(-t / tau)
    out *= adsr(length, 0.004, 0.2, 1.0, 0.15)
    ham = lp(noise(0.03), 1800) * exp_env(0.03, 0.006) * 0.08 * vel
    out[: len(ham)] += ham
    return lp(out, 1600 + 2600 * vel) * 0.42


def strings(freqs, length, attack=0.8, cutoff=2600):
    """Weicher Streicher-Pad: verstimmte Sägezähne mit Vibrato."""
    n = n_of(length)
    t = tl(length)
    out = np.zeros((n, 2))
    for f in freqs:
        for v in range(4):
            vib = 1 + 0.004 * np.sin(2 * np.pi * (5.1 + v * 0.3) * t + v)
            det = 2 ** (((v - 1.5) * 7) / 1200)
            s = saw(f * det * vib, length) * 0.2
            out += pan(s, (v / 3) * 1.4 - 0.7)
    for c in range(2):
        out[:, c] = svf(out[:, c], cutoff, 0.2)
    env = adsr(length, attack, 0.4, 0.85, min(1.2, length * 0.4))
    return out * env[:, None] / max(1, len(freqs)) * 1.7


def chord(names):
    return [nf(n) for n in names]


# ============================================================ MUSIK
# --- A) Hook: angespannt, Puls + Ticken, bricht bei „Funkstille“ ab ----------
HOOK_END = FUNK - 0.04
M("bass", I.sub(nf("A1"), HOOK_END + 0.1), 0.0, 0.55)
M("pad", I.pad(chord(["A2", "E3", "Bb3", "C4"]), HOOK_END + 0.3, cutoff=900, attack=0.05, release=0.2), 0, 0.9)
for i in range(int(HOOK_END / 0.125)):
    t = i * 0.125
    M("drums", pan(I.tick(1.3 if i % 2 == 0 else 0.95), 0.3 if i % 2 else -0.3), t, 0.22 if i % 4 else 0.34)
for i in range(int(HOOK_END / 0.5) + 1):
    M("drums", I.kick(0.8, 0.3, 50), i * 0.5, 0.65 if i % 2 == 0 else 0.4)
M("fx", I.riser(HOOK_END - 2.6, 200, 5000), 2.6, 0.5)

# Stille nach „Funkstille“: nur ein feiner Ton im Ohr
quiet_len = S["abend"] - 0.25 - FUNK
tin = sine(3150, quiet_len) * adsr(quiet_len, 0.4, 0.2, 0.8, 0.5) * 0.012
M("fx", tin, FUNK + 0.1, 1.0)

# --- B) Alltag: monotones Hamsterrad (Uhr tickt, gedämpftes Ostinato) --------
B0 = S["abend"] - 0.05
B1 = S["mir"] - 0.42
k = 0
t = B0
while t < B1:
    M("drums", I.kick(0.7, 0.28, 48), t, 0.55)
    M("drums", pan(I.tick(1.6 if k % 2 == 0 else 1.2, 0.04), -0.4 if k % 2 else 0.4), t + 0.3, 0.35)
    k += 1
    t += 0.6
ost = ["A3", "C4", "E4", "C4", "A3", "C4", "F4", "C4"]
t = B0
i = 0
while t < B1:
    M("keys", I.pluck(nf(ost[i % len(ost)]), 0.32, 1500), t, 0.28)
    i += 1
    t += 0.3
M("bass", I.sub(nf("A1"), B1 - B0), B0, 0.4)
M("pad", I.pad(chord(["A2", "C3", "E3"]), B1 - B0 + 0.3, cutoff=700, attack=0.3, release=0.3), B0, 0.7)

# --- C) Zweifel: einzelne Klaviertöne, viel Raum ------------------------------
C0 = S["mir"] - 0.15
notes = [("E4", 0.0, 0.55), ("C4", 0.62, 0.5), ("A3", 1.24, 0.5), ("B3", 1.86, 0.45)]
for n, dt, v in notes:
    M("keys", piano(nf(n), 3.0, v), C0 + dt, 0.9)
M("keys", piano(nf("A2"), 3.2, 0.6), W("mir", 6), 0.8)
M("keys", piano(nf("E3"), 3.2, 0.5), W("mir", 6) + 0.02, 0.6)
M("keys", piano(nf("C4"), 3.2, 0.45), W("mir", 6) + 0.04, 0.5)
M("pad", strings(chord(["A2", "E3", "C4"]), S["nein"] - C0, 0.9, 1400), C0, 0.6)
for b in range(3):
    M("drums", I.heartbeat(), C0 + 0.2 + b * 1.0, 0.55)
M("fx", I.reverse_swell(1.1, 7000), W("nein", 0) - 1.1, 0.9)

# --- D) Wendepunkt + Lösung: Dur, Groove ab „System.“ -------------------------
N0 = W("nein", 0)
M("pad", strings(chord(["C3", "G3", "E4"]), W("nein", 1) - N0 + 0.4, 0.02, 3200), N0, 0.8)
M("keys", piano(nf("C3"), 3, 0.9), N0, 0.8)
M("keys", piano(nf("G3"), 3, 0.8), N0 + 0.01, 0.6)
M("keys", piano(nf("E4"), 3, 0.8), N0 + 0.02, 0.6)
pre = [(W("nein", 1), ["B2", "G3", "D4"]), (W("nein", 5), ["A2", "E3", "C4"]), (W("nein", 7), ["F2", "C3", "A3"])]
for i, (tt, ch) in enumerate(pre):
    nxt = pre[i + 1][0] if i + 1 < len(pre) else T0
    M("pad", strings(chord(ch), nxt - tt + 0.4, 0.25, 2600), tt, 0.75)
    for j, nn in enumerate(ch):
        M("keys", piano(nf(nn), 2.6, 0.55), tt + j * 0.11, 0.5)

PROG = [["C3", "G3", "E4"], ["G2", "D3", "B3"], ["A2", "E3", "C4"], ["F2", "C3", "A3"]]
ROOTS = ["C2", "G1", "A1", "F1"]


def beats(t_from, t_to):
    """Schläge des globalen 100-BPM-Rasters (ab T0) im Intervall."""
    k0 = int(np.ceil((t_from - T0) / BEAT))
    k1 = int(np.floor((t_to - T0 - 1e-6) / BEAT))
    return [(kk, T0 + kk * BEAT) for kk in range(k0, k1 + 1)]


def groove(t_from, t_to, energy=1.0, clap=True, arp=True, half=False):
    for kk, tb in beats(t_from, t_to):
        bar = (kk // 4) % 4
        pos = kk % 4
        if not half or pos in (0, 2):
            M("drums", I.kick(1.0, 0.36, 52), tb, 0.85 * energy)
        if clap and pos in (1, 3) and not half:
            M("drums", I.clap(), tb, 0.5 * energy)
        if not half:
            M("drums", pan(I.hat(), 0.25), tb + BEAT / 2, 0.28 * energy)
            M("drums", pan(I.shaker(), -0.3), tb + BEAT / 4, 0.18 * energy)
            M("drums", pan(I.shaker(), -0.3), tb + 3 * BEAT / 4, 0.14 * energy)
        root = nf(ROOTS[bar])
        M("bass", I.bass_pulse(root, BEAT * 0.48, 420), tb, 0.42 * energy)
        M("bass", I.bass_pulse(root, BEAT * 0.48, 420), tb + BEAT / 2, 0.32 * energy)
        if pos == 0:
            M("pad", I.pad(chord(PROG[bar]), BEAT * 4 + 0.2, cutoff=1700, attack=0.08, release=0.4), tb, 0.55 * energy)
        if arp:
            ch = chord(PROG[bar])
            seq = [ch[0] * 2, ch[1] * 2, ch[2] * 2, ch[1] * 2]
            for q in range(4):
                M("keys", I.pluck(seq[q], 0.25, 2600), tb + q * BEAT / 4, 0.16 * energy)


groove(T0, GRID - 0.05, 0.9)
# Zoom-Sog in das Raster
M("fx", I.riser(0.45, 400, 9000), GRID - 0.42, 0.7)
groove(GRID + 0.2, STAMP - 0.15, 1.0)
M("pad", strings(chord(["C3", "G3", "E4", "G4"]), 1.6, 0.02, 3800), STAMP, 0.6)

# --- E) Vision: warm, getragen, Höhepunkt bei „dir.“ --------------------------
V0 = S["vision"]
V1 = S["cta"] - 0.1
vis_prog = [(V0 + 0.2, ["F2", "C3", "A3", "E4"]), (W("vision", 8), ["C3", "G3", "E4"]), (W("vision", 10), ["A2", "E3", "C4", "G4"]), (W("vision", 13), ["F2", "C3", "A3", "C5"])]
for i, (tt, ch) in enumerate(vis_prog):
    nxt = vis_prog[i + 1][0] if i + 1 < len(vis_prog) else V1
    M("pad", strings(chord(ch), nxt - tt + 0.6, 0.5 if i == 0 else 0.25, 2400 + i * 500), tt, 0.85 + i * 0.1)
    M("bass", I.sub(nf(ch[0]) / 2, nxt - tt), tt, 0.35)
melody = [("E5", W("vision", 3)), ("D5", W("vision", 4)), ("C5", W("vision", 6)), ("G4", W("vision", 9)),
          ("E5", W("vision", 11)), ("G5", W("vision", 13)), ("E5", W("vision", 14)), ("C5", W("vision", 15))]
for n, tt in melody:
    M("keys", piano(nf(n), 2.4, 0.7), tt, 0.55)
for kk, tb in beats(V0 + 0.6, V1):
    if kk % 4 == 0:
        M("drums", I.kick(0.8, 0.4, 50), tb, 0.5)
M("fx", I.reverse_swell(0.9, 9000), W("vision", 15) - 0.9, 0.5)

# --- F) Angebot: Groove leichter, Kadenz F – G – C ----------------------------
F0 = S["cta"] + 0.1
groove(F0, W("cta", 11) - 0.05, 0.75, arp=True)
M("pad", strings(chord(["C3", "G3", "E4", "C5"]), DUR - W("cta", 11), 0.02, 3600), W("cta", 11), 0.8)
M("keys", piano(nf("C3"), 4, 0.9), W("cta", 11), 0.8)
M("keys", piano(nf("E4"), 4, 0.8), W("cta", 11) + 0.02, 0.6)
M("keys", piano(nf("G4"), 4, 0.8), W("cta", 11) + 0.04, 0.6)
M("keys", piano(nf("C5"), 4, 0.8), W("cta", 11) + 0.06, 0.5)
M("bass", I.sub(nf("C2"), 2.5), W("cta", 11), 0.5)

# ============================================================ SOUNDDESIGN
# 01 Funkstille
X(I.impact(0.6, 48, 1.2), 0.0, 0.55)
for i, at in enumerate([0.0, 0.42, 0.84]):
    X(I.whoosh(0.95, 500, 5200, -0.2, 0.7, 0.35, 0.5), at, 0.32)
    X(I.pop(500, 900, 0.07), at, 0.12)
for i in range(3):
    at = W("funk", 2) + i * 0.17
    X(I.stamp(), at + 0.05, 0.6)
    X(I.thump(70 - i * 6, 0.25), at + 0.05, 0.5)
X(I.glitch(0.18), W("funk", 5), 0.3)
X(I.ratchet(1.0, 10, 6, 0.8), FUNK + 0.3, 0.12)
X(I.reverse_swell(0.42, 6000), S["abend"] - 0.42 - 0.32 + 0.32, 0.4)
X(I.whoosh(0.6, 250, 3500, 0.6, -0.4, 0.4, 0.45), S["abend"] - 0.24, 0.6)

# 02 Alltag
pa = S["abend"] + 0.33
X(I.whip(0.18, True, -0.5), pa, 0.45)
for c in range(11):
    X(I.keypress(0.9 + 0.2 * RNG.random()), pa + 0.05 + c * 0.045, 0.22)
X(I.pop(), pa + 0.25, 0.25)
for q in range(int((W("abend", 4) - pa) / 0.09)):
    X(pan(I.tick(2.2, 0.012), -0.4), pa + 0.3 + q * 0.09, 0.05)
X(I.alarm(3, 0.07, 0.05, 2600), W("abend", 4) + 0.02, 0.18)
X(I.whip(0.2, False, -0.6), W("abend", 4) - 0.2, 0.35)
X(I.whip(0.2, True, -0.3), W("abend", 6) - 0.05, 0.35)
rumble = lp(noise(2.0), 180) * adsr(2.0, 0.3, 0.3, 0.8, 0.8) * 0.35
X(rumble, W("abend", 6) - 0.05, 0.8)
horn = lp(sum(saw(f, 0.35) for f in (392, 466)) * 0.2, 2200) * adsr(0.35, 0.01, 0.05, 0.9, 0.06)
X(pan(horn, 0.6), W("abend", 7) + 0.25, 0.12)
X(I.whoosh(0.7, 3000, 200, 0.3, -0.3, 0.55, 0.4), S["mir"] - 0.42, 0.55)

# 03 Zweifel – fast nichts, Raum

# 04 Wendepunkt
X(I.impact(1.1, 46, 1.8), N0, 0.85)
X(I.shimmer(1.6, 2093), N0, 0.35)
X(I.pop(300, 760, 0.12), S["nein"] + 0.1, 0.35)
X(I.ding(1568, 1.0), W("nein", 9) + 0.05, 0.3)
X(I.zip_up(0.3, 400, 1600), W("nein", 9) + 0.2, 0.25)

# 05 System
X(I.whoosh(0.5, 3000, 300, 0, 0, 0.6, 0.5), S["kompass"], 0.5)
X(I.thump(90, 0.3), S["kompass"] + 0.5, 0.6)
X(I.pop(), S["kompass"] + 0.4, 0.25)
X(I.page_flip(0.42), S["kompass"] + 0.7, 0.3)
X(I.whip(0.18, True, 0.6), W("kompass", 6) - 0.15, 0.4)
m_at = W("kompass", 7) - 0.1
for i in range(4):
    X(I.whip(0.16, False, 0.8 - i * 0.3), m_at + i * 0.16, 0.35)
    X(I.ui_click(1.0 + i * 0.12), m_at + i * 0.16 + 0.2, 0.3)
X(I.shimmer(1.2, 1760), W("kompass", 11) - 0.05, 0.3)
X(I.ding(1318.5, 0.8), W("kompass", 14), 0.25)
X(I.impact(0.7, 60, 1.0), GRID + 0.2, 0.55)
for i in range(4):
    X(I.pop(380 + i * 60, 900 + i * 80, 0.08), GRID + 0.15 + i * 0.05, 0.22)
for c in range(20):
    X(I.keypress(0.9 + 0.25 * RNG.random()), GRID + 0.32 + c * 0.06, 0.16)
X(I.ui_click(1.2), W("inhalt", 2), 0.4)
X(I.ding(2093, 0.6), W("inhalt", 2) + 0.06, 0.25)
for i in range(3):
    X(I.tick(1.4, 0.03), W("inhalt", 2) - 0.15 + i * 0.22, 0.25)
    X(I.ui_click(1.5 + i * 0.1), W("inhalt", 4) - 0.3 + 0.35 + i * 0.25, 0.3)
X(I.whoosh(0.13, 600, 6000, 0, 0, 0.8, 0.5), STAMP - 0.13, 0.5)
X(I.stamp(), STAMP, 1.0)
X(I.impact(1.0, 50, 1.6), STAMP, 0.75)
X(I.whoosh(0.35, 4000, 800, 0, 0.5, 0.4, 0.45), STAMP + 0.42, 0.3)
X(I.shimmer(1.2, 2637), STAMP + 0.55, 0.3)
X(I.whoosh(0.8, 2400, 120, 0.4, -0.2, 0.5, 0.4), S["vision"] - 0.24, 0.6)

# 06 Vision
X(I.shimmer(2.2, 1568), S["vision"] + 0.45, 0.28)
X(I.pop(420, 980, 0.09), W("vision", 4) + 0.1, 0.25)
X(I.chime_two(1318.5, 1568), W("vision", 9), 0.25)
X(I.pop(380, 860, 0.09), W("vision", 12) - 0.1, 0.22)

# 07 Angebot
X(I.whoosh(0.55, 300, 4000, -0.3, 0.3, 0.5, 0.45), S["cta"] - 0.16, 0.5)
logo_at = max(S["cta"] + 0.32, W("cta", 0) - 0.05)
for c in range(17):
    X(pan(I.tick(1.1 + c * 0.03, 0.02), -0.6 + c * 0.07), logo_at + c * 0.035 + 0.12, 0.2)
X(I.pop(300, 800, 0.11), S["cta"] + 0.8, 0.3)
X(I.whip(0.18, True, -0.4), W("cta", 3) - 0.1, 0.35)
X(I.impact(0.7, 58, 1.0), W("cta", 4), 0.5)
X(I.ping(0.5), W("cta", 4) + 0.05, 0.3)
for i in range(3):
    X(I.ui_click(1.1 + i * 0.1), W("cta", 6) + i * 0.12, 0.25)
X(I.pop(320, 760, 0.12), W("cta", 8) - 0.05, 0.35)
X(I.ui_click(0.9), W("cta", 11), 0.6)
X(I.chime_two(1046.5, 1318.5), W("cta", 11) + 0.05, 0.35)
X(I.shimmer(1.8, 2093), W("cta", 11) + 0.1, 0.25)

# ============================================================ VOICE-OVER
vo = np.zeros((N, 2))
have_vo = False
for c in T.get("clips", []):
    src = os.path.join(ROOT, c["file"])
    if not os.path.exists(src):
        continue
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
    place(vo, x, c["at"], 1.0)
    have_vo = True

if have_vo:
    v = vo[:, 0]
    v = hp(v, 85)
    v = peaking(v[:, None].repeat(2, 1), 3200, 2.0, 0.9)[:, 0]
    v = shelf_high(v[:, None].repeat(2, 1), 9000, 1.5)[:, 0]
    # sanfte Kompression
    env = uniform_filter1d(np.abs(v), n_of(0.02))
    thr = np.percentile(env[env > 1e-4], 70) if np.any(env > 1e-4) else 1
    gain = np.where(env > thr, (thr / np.maximum(env, 1e-9)) ** 0.45, 1.0)
    gain = uniform_filter1d(gain, n_of(0.01))
    v = v * gain
    vo = to_stereo(v)
    vo += reverb(v * 0.08, "room")[:N] * 0.5

# ============================================================ MISCHUNG
# Ducking: Musik weicht der Stimme
if have_vo:
    venv = uniform_filter1d(np.abs(vo[:, 0]), n_of(0.05))
    venv = maximum_filter1d(venv, n_of(0.12))
    venv = venv / (np.max(venv) + 1e-9)
    duck = 1 - 0.42 * np.clip(venv * 3, 0, 1)
    duck = uniform_filter1d(duck, n_of(0.08))
else:
    duck = np.ones(N)

dry = (music["drums"] * db(-2) + music["bass"] * db(-4) + music["pad"] * db(-1) + music["keys"] * db(1)
       + music["fx"] * db(-3))
hall = reverb((music["pad"] * 0.2 + music["keys"] * 0.55).mean(axis=1), "hall")[:N] * 0.45
kd = delay(music["keys"], BEAT * 0.75, 0.3, 0.22)[:N]
mus = (dry + hall + kd * 0.5) * duck[:, None]
# Platz für die Stimme
mus = peaking(mus, 2600, -4.0, 0.7)
mus = peaking(mus, 1100, -1.5, 0.9)
mus = shelf_high(mus, 8000, 1.5)
mus = np.stack([hp(mus[:, c], 30) for c in range(2)], axis=1)
mus = np.stack([lp(mus[:, c], 15000) for c in range(2)], axis=1)

# harter Schnitt bei „Funkstille“ (nur das Musikbett, der feine Ton bleibt)
gate = np.ones(N)
i0 = int(HOOK_END * SR)
i1 = int((S["abend"] - 0.3) * SR)
f = n_of(0.015)
gate[i0:i0 + f] = np.linspace(1, 0, f)
gate[i0 + f:i1] = 0
tin_track = to_stereo(np.zeros(N))
place(tin_track, tin, FUNK + 0.1, 1.0)
mus = mus * gate[:, None] + tin_track * db(-3)

sfx_bus = sfx + reverb(sfx.mean(axis=1) * 0.22, "room")[:N] * 0.35
sfx_bus = np.stack([hp(sfx_bus[:, c], 35) for c in range(2)], axis=1)
if have_vo:
    sfx_bus *= (1 - 0.25 * (1 - duck) / 0.42)[:, None]

tail = n_of(0.6)
for b in (mus, sfx_bus, vo):
    b[-tail:] *= np.linspace(1, 0, tail)[:, None] ** 2


def limiter(x, ceiling_db=-1.2, look=0.004, release=0.08):
    c = db(ceiling_db)
    peak = np.max(np.abs(x), axis=1)
    pk = maximum_filter1d(peak, size=2 * n_of(look) + 1)
    g = np.minimum(1.0, c / np.maximum(pk, 1e-9))
    a = np.exp(-1 / (release * SR))
    out = np.empty_like(g)
    cur = 1.0
    for i in range(len(g)):
        cur = g[i] if g[i] < cur else a * cur + (1 - a) * g[i]
        out[i] = cur
    return x * out[:, None]


meter = pyln.Meter(SR)


def lufs(x):
    return meter.integrated_loudness(x)


# Pegel: Stimme vorn, Musik ~10 dB darunter, Effekte dazwischen
if have_vo:
    vo *= db(-17 - lufs(vo))
    mus *= db(-27 - lufs(mus))
    sfx_bus *= db(-25 - lufs(sfx_bus))
else:
    mus *= db(-18 - lufs(mus))
    sfx_bus *= db(-20 - lufs(sfx_bus))

mix = vo + mus + sfx_bus
before = lufs(mix)
mix *= db(-15.5 - before)
mix = limiter(mix, -1.5)
mix *= db(-14.0 - lufs(mix))
mix = limiter(mix, -1.2)
final = lufs(mix)

out_dir = os.path.join(HERE, "out")
os.makedirs(out_dir, exist_ok=True)


def wav(name, x):
    wavfile.write(os.path.join(out_dir, name), SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))


g = db(-14.0 - before + 1.5)
wav("music.wav", mus * g)
wav("sfx.wav", sfx_bus * g)
if have_vo:
    wav("vo.wav", vo * g)
wav("mix.wav", mix)
print(f"Mix: {final:.1f} LUFS, Peak {20 * np.log10(np.max(np.abs(mix)) + 1e-12):.2f} dBFS, "
      f"Stimme: {'ja' if have_vo else 'nein (Platzhalter-Zeiten)'}, Dauer {DUR:.2f} s")
