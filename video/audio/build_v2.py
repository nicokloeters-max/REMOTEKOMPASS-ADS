"""
Musik + Sounddesign für die Kampagne „Nachtlicht“ (fünf Ads ohne Voice-over).

Die Musik ist je Ad als Partitur (MIDI) komponiert und wird mit fluidsynth und
der SoundFont-Bank GeneralUser GS (frei für kommerzielle Musikproduktion,
siehe audio/sf/LICENSE.txt) gerendert: echtes Klavier, Streicher, Chor,
Celesta, Pauken. Effekte kommen synthetisiert aus instruments.py.

Zeitpunkte stammen aus src/v2/ads/<id>.json – dieselben, die das Bild steuern.

  python3 audio/build_v2.py            # alle fünf
  python3 audio/build_v2.py a1 a3      # einzelne
Ergebnis: audio/out/v2/<id>-mix.wav (−14 LUFS, True Peak ≤ −1 dBTP)
"""
import json
import os
import subprocess
import sys
import urllib.request

import mido
import numpy as np
import pyloudnorm as pyln
from scipy.io import wavfile
from scipy.ndimage import maximum_filter1d

sys.path.insert(0, os.path.dirname(__file__))
from dsp import SR, n_of, place, to_stereo, reverb, lp, hp, noise, pink, sine, saw, square, exp_env, adsr, pan, widen, db, svf, bp, shelf_low, peaking
import instruments as I

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SF_DIR = os.path.join(HERE, "sf")
SF = os.path.join(SF_DIR, "GeneralUser-GS.sf2")
SF_URL = "https://raw.githubusercontent.com/mrbumpy409/GeneralUser-GS/main/GeneralUser-GS.sf2"
LIC_URL = "https://raw.githubusercontent.com/mrbumpy409/GeneralUser-GS/main/documentation/LICENSE.txt"
OUT = os.path.join(HERE, "out", "v2")


def ensure_sf():
    if os.path.exists(SF):
        return
    os.makedirs(SF_DIR, exist_ok=True)
    print("lade GeneralUser GS …")
    urllib.request.urlretrieve(SF_URL, SF)
    urllib.request.urlretrieve(LIC_URL, os.path.join(SF_DIR, "LICENSE.txt"))


# ============================================================ Partitur-Helfer
NOTE = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8,
        "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}


def m(name):
    """'D4' → 62"""
    return 12 * (int(name[-1]) + 1) + NOTE[name[:-1]]


# GM-Programme
PIANO, CELESTA, GLOCK, MUSICBOX, HARP = 0, 8, 9, 10, 46
CELLO, BASS, TREM, PIZZ, TIMP = 42, 43, 44, 45, 47
STR, STR_SLOW, CHOIR, OOHS, HORN = 48, 49, 52, 53, 60
PAD_WARM, PAD_HALO = 89, 94


class Score:
    TPS = 960  # Ticks pro Sekunde (480 TPB @ 120 BPM)

    def __init__(self):
        self.ev = []
        self.ch = {}

    def inst(self, name, program, ch, vol=100, rev=70, pan_=64):
        self.ch[name] = ch
        self.ev += [(0, 0, mido.Message("program_change", channel=ch, program=program)),
                    (0, 1, mido.Message("control_change", channel=ch, control=7, value=vol)),
                    (0, 1, mido.Message("control_change", channel=ch, control=91, value=rev)),
                    (0, 1, mido.Message("control_change", channel=ch, control=10, value=pan_)),
                    (0, 1, mido.Message("control_change", channel=ch, control=11, value=127))]

    def note(self, name, pitch, t, dur, vel=80):
        if t < 0:
            dur += t
            t = 0
        if dur <= 0:
            return
        c = self.ch[name]
        p = m(pitch) if isinstance(pitch, str) else pitch
        vel = int(max(1, min(127, vel)))
        self.ev.append((t, 3, mido.Message("note_on", channel=c, note=p, velocity=vel)))
        self.ev.append((t + dur, 2, mido.Message("note_off", channel=c, note=p, velocity=0)))

    def chord(self, name, notes, t, dur, vel=70, spread=0.0):
        for i, n in enumerate(notes):
            self.note(name, n, t + i * spread, dur - i * spread, vel)

    def cc(self, name, ctrl, val, t):
        self.ev.append((max(0, t), 1, mido.Message("control_change", channel=self.ch[name], control=ctrl, value=int(max(0, min(127, val))))))

    def ramp(self, name, ctrl, t0, t1, v0, v1, steps=24):
        for i in range(steps + 1):
            x = i / steps
            self.cc(name, ctrl, v0 + (v1 - v0) * x, t0 + (t1 - t0) * x)

    def pedal(self, name, t0, t1):
        self.cc(name, 64, 127, t0)
        self.cc(name, 64, 0, t1)

    def arp(self, name, notes, t0, t1, step, vel=60, pattern=None, length=None, accent=0):
        pattern = pattern or list(range(len(notes)))
        i = 0
        t = t0
        while t < t1 - 1e-6:
            n = notes[pattern[i % len(pattern)]]
            v = vel + (accent if i % len(pattern) == 0 else 0)
            self.note(name, n, t, length or step * 1.6, v)
            i += 1
            t += step

    def render(self, path_mid, path_wav, gain=0.55):
        mf = mido.MidiFile(ticks_per_beat=480)
        tr = mido.MidiTrack()
        mf.tracks.append(tr)
        tr.append(mido.MetaMessage("set_tempo", tempo=500000))
        last = 0
        for t, _, msg in sorted(self.ev, key=lambda e: (e[0], e[1])):
            tick = int(round(t * self.TPS))
            tr.append(msg.copy(time=tick - last))
            last = tick
        mf.save(path_mid)
        subprocess.run(["fluidsynth", "-ni", "-q", "-g", str(gain), "-r", str(SR),
                        "-o", "synth.reverb.room-size=0.82", "-o", "synth.reverb.width=1.0",
                        "-o", "synth.reverb.level=0.7", "-o", "synth.reverb.damp=0.35",
                        "-o", "synth.polyphony=512",
                        "-F", path_wav, SF, path_mid], check=True)
        sr, x = wavfile.read(path_wav)
        x = x.astype(np.float64) / 32768.0
        return x


# ============================================================ Soundeffekte
def buzz(length=0.42):
    """Handy-Vibration: brummender Motor, leicht schnarrend."""
    t = np.arange(n_of(length)) / SR
    s = square(142, length, 0.5) * 0.4 + sine(142, length) * 0.6
    s = lp(s, 900) * (0.6 + 0.4 * np.sin(2 * np.pi * 23 * t) ** 2)
    return s * adsr(length, 0.01, 0.05, 0.9, 0.05) * 0.9


def soft_ding(f=1318.5):
    a = I.ding(f, 1.2) * 0.8
    b = I.ding(f * 1.5, 0.9) * 0.3
    a[: len(b)] += b
    return a


def crowd(length):
    """Gemurmel einer Menge: gefiltertes Rauschen mit langsamer Modulation."""
    t = np.arange(n_of(length)) / SR
    w = pink(length)
    mod = 0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t) * np.sin(2 * np.pi * 1.9 * t + 1)
    s = bp(w, 250, 2600) * mod
    return widen(s * adsr(length, 0.8, 0.2, 0.9, 0.8) * 0.9, 0.012)


def endcard_sfx(X, at):
    X(I.whoosh(0.7, 300, 3800, -0.3, 0.3, 0.55, 0.45), at - 0.25, 0.45)
    X(I.thump(80, 0.35), at + 0.45, 0.45)
    X(I.impact(0.6, 58, 1.1), at + 0.85, 0.42)
    X(I.ping(0.5), at + 0.9, 0.22)
    X(I.pop(320, 760, 0.12), at + 1.25, 0.3)
    X(I.shimmer(1.8, 2093), at + 1.3, 0.18)


# ============================================================ Kompositionen
def compose_a1(T, dur):
    """Aufführung: Solo-Klavier in d-Moll → Stille bei „Wie oft noch?“ → Dur-Aufgang."""
    s = Score()
    s.inst("pno", PIANO, 0, vol=105, rev=85)
    s.inst("str", STR_SLOW, 1, vol=92, rev=100)
    s.inst("cel", CELESTA, 2, vol=80, rev=110, pan_=80)
    s.inst("choir", OOHS, 3, vol=70, rev=110)
    s.inst("cello", CELLO, 4, vol=88, rev=90, pan_=50)
    # A) d-Moll, gebrochene Akkorde, zart
    sec = [(0.0, ["D3", "A3", "E4", "F4"]), (T["calendar"], ["Bb2", "F3", "C4", "D4"]),
           (T["chat"], ["F2", "C3", "A3", "F4"]), (T["del"] + 0.6, ["C3", "G3", "E4", "G4"])]
    for i, (t0, ch) in enumerate(sec):
        t1 = sec[i + 1][0] if i + 1 < len(sec) else T["okay"]
        s.pedal("pno", t0, t1 - 0.05)
        s.arp("pno", ch, t0, t1, 0.42, vel=46, pattern=[0, 1, 2, 3, 2, 1], length=1.2, accent=8)
    mel = [("A4", 0.15, 1.2), ("F4", 1.7, 0.8), ("E4", 2.5, 0.8), ("D4", 3.3, 1.6), ("C5", 5.0, 0.8), ("Bb4", 6.0, 1.2),
           ("A4", 7.4, 1.0), ("G4", 8.6, 1.4), ("E4", 10.0, 1.2)]
    for n, t0, d in mel:
        s.note("pno", n, t0, d, 64)
    s.chord("cello", ["D2"], 0.0, T["calendar"], 50)
    s.ramp("cello", 11, 0.0, 3.0, 40, 100)
    s.chord("cello", ["Bb1"], T["calendar"], T["chat"] - T["calendar"], 55)
    s.chord("cello", ["F2"], T["chat"], 2.6, 55)
    s.chord("cello", ["C2"], T["del"] + 0.6, T["okay"] - T["del"] - 0.6, 55)
    # „okay.“ – g-Moll, dann fast Stille
    s.chord("pno", ["G2", "D3", "Bb3"], T["okay"], 1.4, 50)
    s.pedal("pno", T["okay"], T["howOften"] + 1.8)
    s.note("pno", "D2", T["howOften"], 3.0, 62)
    s.note("pno", "A5", T["howOften"] + 0.05, 2.5, 40)
    s.chord("str", ["Bb2", "F3", "D4"], T["howOften"] + 0.4, T["dawn"] - T["howOften"] - 0.2, 45)
    s.ramp("str", 11, T["howOften"] + 0.4, T["dawn"], 30, 90)
    # B) Morgenlicht: F-Dur, Streicher-Schwellung, Celesta
    up = [(T["dawn"], ["F2", "C3", "A3", "C4", "F4"]), (T["flur"] + 1.4, ["C2", "G3", "C4", "E4"]),
          (T["imagine"], ["Bb1", "F3", "D4", "F4"]), (T["reply"], ["F2", "C3", "A3", "C4"]),
          (T["hearts"], ["C2", "G3", "E4", "G4"]), (T["end"], ["F2", "C3", "A3", "C4", "F4"])]
    for i, (t0, ch) in enumerate(up):
        t1 = up[i + 1][0] if i + 1 < len(up) else dur
        s.chord("str", ch, t0, t1 - t0 + 0.3, 62 + i * 6)
        s.chord("cello", [ch[0]], t0, t1 - t0, 60 + i * 4)
        s.pedal("pno", t0, t1 - 0.05)
        s.arp("pno", ch[1:], t0, t1, 0.3, vel=50 + i * 3, pattern=[0, 1, 2, 3, 2, 1] if len(ch) > 4 else [0, 1, 2, 1], length=1.0)
    s.ramp("str", 11, T["dawn"], T["imagine"], 60, 120)
    s.chord("choir", ["F3", "A3", "C4"], T["imagine"], dur - T["imagine"], 48)
    s.ramp("choir", 11, T["imagine"], T["imagine"] + 2, 20, 100)
    mel2 = [("C5", T["flur"], 1.0), ("A4", T["flur"] + 1.0, 0.6), ("C5", T["flur"] + 1.6, 0.6), ("D5", T["flur"] + 2.2, 1.6),
            ("F5", T["reply"], 1.0), ("E5", T["hearts"], 0.6), ("C5", T["hearts"] + 0.6, 0.8), ("F5", T["end"], 2.5)]
    for n, t0, d in mel2:
        s.note("pno", n, t0, d, 72)
    for k, n in enumerate(["F5", "A5", "C6", "F6", "A6", "C7"]):
        s.note("cel", n, T["end"] + 1.2 + k * 0.12, 1.5, 55)
        s.note("cel", n, T["dawn"] + 0.4 + k * 0.15, 1.2, 40)
    s.ramp("str", 11, dur - 1.5, dur, 120, 40)
    return s


def sfx_a1(T, dur, X):
    X(buzz(), T["notif1"], 0.55)
    X(soft_ding(1318.5), T["notif1"] + 0.02, 0.28)
    X(buzz(), T["notif2"], 0.5)
    X(soft_ding(1174.7), T["notif2"] + 0.02, 0.25)
    X(I.whoosh(0.6, 2500, 400, 0.2, -0.2, 0.5, 0.4), T["calendar"] - 0.2, 0.4)
    for k, d in enumerate([0.25, 0.6, 0.9]):
        X(I.pop(380 + k * 80, 860 + k * 80, 0.08), T["calendar"] + d, 0.22)
    X(I.ui_click(0.7), T["calendar"] + 1.25, 0.3)
    X(I.whoosh(0.5, 400, 3000, -0.2, 0.2, 0.5, 0.4), T["chat"] - 0.1, 0.35)
    for c in range(int((T["del"] - T["type1"]) * 16)):
        X(I.keypress(0.9 + 0.2 * np.random.default_rng(c).random()), T["type1"] + c / 16, 0.16)
    for c in range(int(0.5 * 40)):
        X(I.keypress(1.3), T["del"] + c / 40, 0.08)
    for c in range(int((T["send"] - T["type2"]) * 17)):
        X(I.keypress(0.9 + 0.2 * np.random.default_rng(c + 99).random()), T["type2"] + c / 17, 0.16)
    X(I.whip(0.18, True, 0.4), T["send"], 0.4)
    X(I.pop(500, 900, 0.07), T["okay"], 0.3)
    X(I.reverse_swell(0.9, 5000), T["howOften"] - 0.9, 0.35)
    X(I.impact(0.6, 44, 2.2), T["howOften"], 0.5)
    X(I.shimmer(2.4, 1568), T["dawn"] + 0.2, 0.2)
    X(I.pop(), T["imagine"] + 0.25, 0.22)
    X(I.whip(0.16, True, 0.4), T["reply"], 0.3)
    X(I.pop(600, 1100, 0.08), T["hearts"], 0.3)
    endcard_sfx(X, T["end"])


def compose_a2(T, dur):
    """Kompass: Spannung (Tremolo, Pizzicato, Pauke) → Stille → Einrasten (D-Dur, Chor) → Aufbruch."""
    s = Score()
    s.inst("trem", TREM, 0, vol=95, rev=80)
    s.inst("pizz", PIZZ, 1, vol=100, rev=60, pan_=44)
    s.inst("timp", TIMP, 2, vol=110, rev=70)
    s.inst("str", STR, 3, vol=100, rev=85)
    s.inst("choir", CHOIR, 4, vol=95, rev=110)
    s.inst("pno", PIANO, 5, vol=100, rev=80, pan_=70)
    s.inst("horn", HORN, 6, vol=90, rev=90, pan_=56)
    s.inst("glock", GLOCK, 7, vol=85, rev=100, pan_=80)
    s.inst("bass", BASS, 8, vol=100, rev=60)
    # A) Kreisen: Tremolo-Cluster, Pizzicato-Ostinato wird schneller
    s.chord("trem", ["D2", "A2", "D3", "Eb3"], 0.0, T["hush"] - 0.05, 60)
    s.ramp("trem", 11, 0.0, T["hush"] - 0.1, 50, 125)
    pz = ["D4", "F4", "A4", "D5", "A4", "F4", "Eb4", "F4"]
    t = 0.0
    step = 0.25
    i = 0
    while t < T["hush"] - 0.1:
        s.note("pizz", pz[i % len(pz)], t, 0.3, 70 + (i % 4 == 0) * 15)
        i += 1
        step = max(0.11, 0.25 - t * 0.017)
        t += step
    for k in range(int(T["hush"] / 0.5)):
        s.note("timp", "D2", k * 0.5, 0.4, 50 + k * 3 if k % 2 == 0 else 40)
    for k in range(18):
        s.note("timp", "A1", T["hush"] - 0.9 + k * 0.05, 0.1, 50 + k * 4)
    # B) Einrasten: D-Dur mit allem
    L = T["lock"]
    s.note("timp", "D2", L, 1.2, 127)
    s.note("bass", "D1", L, 2.4, 110)
    s.chord("choir", ["D3", "A3", "F#4", "A4"], L, T["route"] - L + 0.4, 95)
    s.chord("str", ["D2", "A2", "F#3", "D4", "A4"], L, T["route"] - L + 0.3, 92)
    s.ramp("str", 11, L + 0.2, T["route"] - 0.2, 125, 80)
    s.chord("pno", ["D2", "A2", "D3", "F#3", "A3", "D4"], L, 2.5, 95, spread=0.02)
    s.pedal("pno", L, L + 2.4)
    s.note("glock", "A6", L + 0.02, 1.5, 90)
    # C) Route: I–V–vi–IV in Achteln, Steigerung zum Ankommen
    prog = [["D3", "A3", "D4", "F#4"], ["A2", "E3", "A3", "C#4"], ["B2", "F#3", "B3", "D4"], ["G2", "D3", "G3", "B3"]]
    roots = ["D2", "A1", "B1", "G1"]
    bar = 1.2
    t = T["route"]
    k = 0
    while t < T["arrive"] - 0.05:
        ch = prog[k % 4]
        s.arp("str", ch, t, min(t + bar, T["arrive"]), 0.15, vel=58 + k * 4, pattern=[0, 1, 2, 3, 2, 1, 2, 3], length=0.18)
        s.note("bass", roots[k % 4], t, bar, 85)
        s.note("timp", roots[k % 4].replace("1", "2") if "1" in roots[k % 4] else roots[k % 4], t, 0.4, 70 + k * 6)
        s.note("timp", "D2", t + 0.6, 0.3, 55 + k * 4)
        t += bar
        k += 1
    for w, n in zip(["wp1", "wp2", "wp3", "wp4"], ["D6", "F#6", "A6", "D7"]):
        s.note("glock", n, T[w], 1.4, 100)
    s.chord("horn", ["D3", "A3"], T["wp3"], T["arrive"] - T["wp3"], 70)
    s.ramp("horn", 11, T["wp3"], T["arrive"], 50, 120)
    # D) Ankommen: IV – V – I, dann ruhige End-Card
    A = T["arrive"]
    s.chord("str", ["G2", "D3", "B3", "G4"], A - 1.0, 0.6, 100)
    s.chord("str", ["A2", "E3", "C#4", "A4"], A - 0.4, 0.5, 105)
    s.chord("str", ["D2", "A2", "F#3", "D4", "F#4", "A4"], A, dur - A, 105)
    s.chord("choir", ["D3", "A3", "D4", "F#4"], A, dur - A, 100)
    s.chord("horn", ["F#3", "D4"], A, 2.5, 100)
    s.note("timp", "D2", A, 1.5, 120)
    s.note("bass", "D1", A, dur - A, 100)
    s.ramp("str", 11, A + 1.5, dur, 120, 70)
    s.ramp("choir", 11, A + 1.5, dur, 120, 60)
    s.pedal("pno", T["end"], dur)
    s.arp("pno", ["D4", "F#4", "A4", "D5"], T["end"], dur - 0.5, 0.25, vel=58, pattern=[0, 1, 2, 3, 2, 1])
    return s


def sfx_a2(T, dur, X):
    for k in range(7):
        X(I.whoosh(0.9, 300, 2500, -0.7 + (k % 2) * 1.4, 0.7 - (k % 2) * 1.4, 0.5, 0.4), k * 0.85 + 0.1, 0.22)
    X(I.ratchet(T["hush"] - 0.2, 26, 12, 1.2), 0.0, 0.12)
    X(I.whoosh(0.7, 3000, 200, 0, 0, 0.5, 0.45), T["map"] - 0.2, 0.35)
    for k in range(4):
        X(I.tick(0.8, 0.03), T["map"] + 0.4 + k * 0.6, 0.18)
    X(I.reverse_swell(0.35, 6000), T["lock"] - 0.35, 0.4)
    click = I.ding(2637, 0.6) * 0.5
    c0 = I.ui_click(2.2, 0.04) * 1.2
    click[: len(c0)] += c0
    X(click, T["lock"], 0.9)
    X(I.impact(1.2, 42, 2.2), T["lock"], 0.9)
    X(I.whoosh(1.0, 200, 5000, 0, 0, 0.15, 0.4), T["lock"], 0.4)
    X(I.riser(T["arrive"] - T["route"], 300, 6000, tone=False), T["route"], 0.22)
    for w in ["wp1", "wp2", "wp3", "wp4"]:
        X(I.pop(420, 980, 0.09), T[w], 0.28)
        X(I.whip(0.14, True, 0.3), T[w] - 0.05, 0.22)
    X(I.impact(0.9, 50, 1.8), T["arrive"], 0.55)
    X(I.shimmer(2.0, 2349), T["arrive"] + 0.05, 0.25)
    endcard_sfx(X, T["end"])


def compose_a3(T, dur):
    """Eine von Hunderten: einsamer Ton → wimmelnde Masse → Ordnung → Lichtkegel (C-Dur)."""
    s = Score()
    s.inst("pno", PIANO, 0, vol=105, rev=90)
    s.inst("trem", TREM, 1, vol=90, rev=80)
    s.inst("pizz", PIZZ, 2, vol=95, rev=70, pan_=40)
    s.inst("pizz2", PIZZ, 3, vol=95, rev=70, pan_=88)
    s.inst("str", STR_SLOW, 4, vol=95, rev=100)
    s.inst("cel", CELESTA, 5, vol=95, rev=110, pan_=74)
    s.inst("choir", OOHS, 6, vol=85, rev=110)
    s.inst("cello", CELLO, 7, vol=95, rev=80)
    # einsamer Herzschlag-Ton
    for k, t0 in enumerate([0.0, 0.9, 1.8]):
        s.note("pno", "E4", t0, 0.8, 55 - k * 4)
        s.note("pno", "E3", t0, 0.8, 40)
    # Masse: Pizzicato-Gewimmel wird dichter, Tremolo schwillt
    rng = np.random.default_rng(7)
    scale = [m(n) for n in ["A3", "B3", "C4", "D4", "E4", "F4", "G#4", "A4", "B4", "C5", "E5"]]
    t = T["zoom"]
    while t < T["turn"]:
        dens = 4 + 26 * min(1, (t - T["zoom"]) / 3.5) * (1 - 0.6 * max(0, (t - T["noone"]) / 2.4))
        s.note("pizz" if rng.random() < 0.5 else "pizz2", int(rng.choice(scale)), t, 0.25, int(40 + rng.random() * 40))
        t += rng.exponential(1 / dens)
    s.chord("trem", ["A2", "E3", "Bb3", "F4"], T["zoom"], T["turn"] - T["zoom"], 60)
    s.ramp("trem", 11, T["zoom"], T["hundreds"] + 1.5, 30, 120)
    s.ramp("trem", 11, T["noone"], T["turn"], 120, 40)
    s.note("cello", "A1", T["noone"], T["turn"] - T["noone"] + 0.4, 70)
    # Wendung: Am – F – C – G, Klavier + Streicher
    prog = [(T["turn"], ["A2", "E3", "C4", "E4"]), (T["sort"], ["F2", "C3", "A3", "C4"]), (T["labels"] + 1.6, ["C3", "G3", "E4", "G4"]),
            (T["travel"], ["G2", "D3", "B3", "D4"]), (T["seen"], ["F2", "C3", "A3", "C4", "F4"]), (T["seen"] + 1.6, ["C3", "G3", "C4", "E4", "G4"]),
            (T["where"], ["A2", "E3", "C4", "E4"]), (T["where"] + 0.9, ["F2", "C3", "A3", "C4"]), (T["end"], ["C3", "G3", "C4", "E4", "G4"])]
    for i, (t0, ch) in enumerate(prog):
        t1 = prog[i + 1][0] if i + 1 < len(prog) else dur
        s.pedal("pno", t0, t1 - 0.05)
        s.arp("pno", ch[:4], t0, t1, 0.25 if t0 >= T["sort"] else 0.35, vel=52 + min(i, 5) * 3, pattern=[0, 1, 2, 3, 2, 1], length=0.9)
        s.chord("str", ch, t0, t1 - t0 + 0.25, 50 + i * 5)
        s.note("cello", ch[0], t0, t1 - t0, 64)
    s.ramp("str", 11, T["turn"], T["seen"], 50, 125)
    # Reise des eigenen Punkts: aufsteigende Celesta
    for k, n in enumerate(["C5", "E5", "G5", "C6", "E6", "G6", "C7"]):
        s.note("cel", n, T["travel"] + k * 0.17, 1.2, 70 + k * 4)
    s.chord("choir", ["C4", "E4", "G4"], T["seen"], T["where"] - T["seen"] + 1, 70)
    s.ramp("choir", 11, T["seen"], T["seen"] + 1.2, 30, 110)
    s.chord("choir", ["C4", "E4", "G4"], T["end"], dur - T["end"], 55)
    s.ramp("str", 11, dur - 1.5, dur, 120, 40)
    return s


def sfx_a3(T, dur, X):
    for k in range(3):
        X(I.heartbeat(), k * 0.9 + 0.02, 0.5)
    X(I.whoosh(1.2, 4000, 300, 0, 0, 0.3, 0.45), T["zoom"] - 0.05, 0.5)
    X(crowd(T["turn"] - T["zoom"] + 0.8), T["zoom"] + 0.2, 0.35)
    for k in range(40):
        X(I.tick(1.6, 0.02), T["zoom"] + 0.2 + 3.6 * (k / 40) ** 1.4, 0.08)
    X(I.reverse_swell(0.8, 6000), T["turn"] - 0.8, 0.35)
    X(I.whoosh(1.4, 300, 3000, -0.4, 0.4, 0.5, 0.4), T["sort"], 0.4)
    X(I.zip_up(1.2, 300, 1800), T["travel"], 0.3)
    X(I.shimmer(2.0, 2093), T["seen"], 0.28)
    X(I.soft_hit(110, 1.8), T["seen"], 0.4)
    endcard_sfx(X, T["end"])


def compose_a4(T, dur):
    """14 Tage: Uhrwerk-Ostinato (a-Moll) → Celesta je verlorenem Tag → F-Dur-Weite."""
    s = Score()
    s.inst("pno", PIANO, 0, vol=105, rev=75)
    s.inst("str", STR, 1, vol=92, rev=95)
    s.inst("timp", TIMP, 2, vol=110, rev=70)
    s.inst("cel", CELESTA, 3, vol=100, rev=110, pan_=76)
    s.inst("pizz", PIZZ, 4, vol=100, rev=60)
    s.inst("choir", CHOIR, 5, vol=85, rev=110)
    s.inst("cello", CELLO, 6, vol=95, rev=80)
    s.inst("bass", BASS, 7, vol=95, rev=60)
    s.note("pno", "A1", 0.0, 3.0, 100)
    s.note("pno", "A2", 0.0, 3.0, 90)
    s.note("timp", "A1", 0.0, 1.5, 110)
    s.pedal("pno", 0.0, 2.9)
    # Uhrwerk: a-Moll-Arpeggien in Achteln (100 BPM)
    E8 = 0.3
    secs = [(1.2, ["A3", "C4", "E4"]), (T["math"], ["F3", "A3", "C4"]), (T["m3"], ["D3", "F3", "A3"]), (T["eq"], ["E3", "G#3", "B3"]),
            (T["year"], ["A3", "C4", "E4"]), (T["glow"], ["F3", "A3", "C4"]), (T["glow"] + 1.2, ["C3", "E3", "G3"])]
    for i, (t0, ch) in enumerate(secs):
        t1 = secs[i + 1][0] if i + 1 < len(secs) else T["moments"]
        s.arp("pno", ch, t0, t1, E8, vel=50 + i * 3, pattern=[0, 1, 2, 1], length=0.35, accent=10)
        s.note("cello", ch[0].replace("3", "2"), t0, t1 - t0, 58 + i * 3)
    s.chord("str", ["A2", "E3", "A3"], T["year"], T["moments"] - T["year"], 50)
    s.ramp("str", 11, T["year"], T["moments"], 50, 110)
    for k in ["m1", "m2", "m3", "m4"]:
        s.note("timp", "E2", T[k], 0.6, 90)
        s.note("pizz", "A2", T[k], 0.3, 100)
    s.note("timp", "A1", T["eq"], 0.9, 100)
    for k in range(10):
        s.note("timp", "E2", T["days"] - 0.5 + k * 0.05, 0.1, 50 + k * 6)
    s.note("timp", "A1", T["days"], 1.2, 120)
    s.note("bass", "A1", T["days"], 1.5, 100)
    # jeder leuchtende Tag ein Celesta-Ton (Pentatonik aufwärts)
    penta = ["A5", "C6", "D6", "E6", "G6", "A6", "C7", "A5", "C6", "E6", "G6", "A6", "C7", "E7"]
    for k, n in enumerate(penta):
        s.note("cel", n, T["glow"] + k * 0.11, 1.0, 70 + k * 2)
    # Momente: F-Dur, weit
    up = [(T["moments"], ["F2", "C3", "A3", "C4", "F4"]), (T["moments"] + 1.6, ["C2", "G3", "C4", "E4"]),
          (T["moments"] + 3.2, ["D2", "A3", "D4", "F4"]), (T["back"] - 0.6, ["Bb1", "F3", "Bb3", "D4"]),
          (T["back"], ["F2", "C3", "A3", "C4", "F4"]), (T["end"], ["F2", "C3", "A3", "C4", "F4"])]
    for i, (t0, ch) in enumerate(up):
        t1 = up[i + 1][0] if i + 1 < len(up) else dur
        s.chord("str", ch, t0, t1 - t0 + 0.3, 70 + i * 5)
        s.note("bass", ch[0], t0, t1 - t0, 80)
        s.pedal("pno", t0, t1 - 0.05)
        s.arp("pno", ch[1:], t0, t1, 0.3, vel=55, pattern=[0, 1, 2, 3, 2, 1] if len(ch) > 4 else [0, 1, 2, 1], length=0.9)
    mel = [("A4", T["moments"] + 0.5), ("C5", T["moments"] + 1.05), ("G4", T["moments"] + 1.6), ("E5", T["moments"] + 2.15),
           ("F5", T["moments"] + 3.2), ("D5", T["moments"] + 3.75), ("C5", T["back"]), ("A4", T["back"] + 0.6), ("C5", T["end"])]
    for n, t0 in mel:
        s.note("pno", n, t0, 1.2, 72)
    s.chord("choir", ["F3", "A3", "C4", "F4"], T["back"], dur - T["back"], 80)
    s.ramp("choir", 11, T["back"], T["back"] + 1, 40, 115)
    s.note("timp", "F2", T["back"], 1.4, 110)
    s.ramp("str", 11, dur - 1.5, dur, 120, 40)
    s.ramp("choir", 11, dur - 1.5, dur, 115, 30)
    return s


def sfx_a4(T, dur, X):
    X(I.impact(1.0, 44, 2.0), 0.0, 0.6)
    for k in range(int(T["math"] / 0.6)):
        X(pan(I.tick(1.3 if k % 2 else 1.0, 0.03), -0.3 if k % 2 else 0.3), 0.6 + k * 0.6, 0.12)
    X(I.whoosh(0.6, 2500, 300, 0, 0, 0.5, 0.4), T["math"] - 0.2, 0.35)
    for k in ["m1", "m2", "m3", "m4"]:
        X(I.thump(90, 0.25), T[k], 0.4)
        X(I.ui_click(1.1), T[k], 0.3)
    X(I.ratchet(0.8, 40, 12, 1.2), T["eq"], 0.25)
    X(I.impact(0.8, 52, 1.4), T["days"], 0.5)
    X(I.whoosh(1.0, 300, 3000, -0.5, 0.5, 0.45, 0.4), T["year"] - 0.1, 0.3)
    for k in range(14):
        X(I.tick(2.0, 0.02), T["year"] + k * 0.05, 0.06)
    X(I.whoosh(0.9, 3000, 300, 0, 0, 0.5, 0.4), T["moments"] - 0.3, 0.3)
    for k in range(5):
        X(I.pop(380 + k * 40, 900 + k * 40, 0.09), T["moments"] + 0.5 + k * 0.55, 0.25)
    X(I.shimmer(2.4, 1760), T["moments"] + 0.1, 0.2)
    X(I.soft_hit(87, 2.0), T["back"], 0.45)
    endcard_sfx(X, T["end"])


def compose_a5(T, dur):
    """Mail an dich: Spieluhr + warmes Pad + gedämpftes Klavier in G-Dur, Aufschwung zum Plan."""
    s = Score()
    s.inst("pad", PAD_WARM, 0, vol=80, rev=100)
    s.inst("pno", PIANO, 1, vol=100, rev=90)
    s.inst("box", MUSICBOX, 2, vol=90, rev=110, pan_=76)
    s.inst("str", STR_SLOW, 3, vol=92, rev=100)
    s.inst("choir", OOHS, 4, vol=80, rev=110)
    s.inst("cel", CELESTA, 5, vol=90, rev=110, pan_=60)
    s.inst("timp", TIMP, 6, vol=100, rev=80)
    s.inst("cello", CELLO, 7, vol=90, rev=90)
    s.chord("pad", ["G2", "D3", "B3"], 0.0, T["open"] + 0.4, 55)
    s.ramp("pad", 11, 0.0, 1.5, 30, 100)
    for k, n in enumerate(["D5", "B4", "G4", "D5", "C5", "A4"]):
        s.note("box", n, 0.15 + k * 0.32, 1.0, 60)
    prog = [["G2", "D3", "B3", "D4"], ["D2", "A3", "D4", "F#4"], ["E2", "B3", "E4", "G4"], ["C2", "G3", "C4", "E4"]]
    bar = 1.72  # zwei Akkorde pro Zeile, ruhig
    t = T["open"]
    k = 0
    while t < T["plan"] - 0.05:
        ch = prog[k % 4]
        t1 = min(t + bar, T["plan"])
        s.pedal("pno", t, t1 - 0.05)
        s.arp("pno", ch[1:], t, t1, 0.43, vel=44 + min(k, 6) * 3, pattern=[0, 1, 2, 1], length=1.2)
        s.note("pno", ch[0].replace("2", "3"), t, bar, 50)
        s.chord("pad", ch[:3], t, bar + 0.2, 50)
        if t >= T["l4"]:
            s.note("cello", ch[0], t, bar, 55 + k * 2)
        t += bar
        k += 1
    box = {"l1": "G5", "l2": "B5", "l3": "D6", "l4": "A5", "l5": "B5", "l6": "E6", "l7": "D6", "sign": "G6"}
    for key, n in box.items():
        s.note("box", n, T[key], 1.4, 62)
    s.chord("str", ["G2", "D3", "B3", "G4"], T["l6"], T["plan"] - T["l6"] + 0.3, 50)
    s.ramp("str", 11, T["l6"], T["plan"], 40, 120)
    # Der Plan → „Fang heute an“: großer warmer Akkord
    P = T["plan"]
    s.chord("str", ["C2", "G2", "E3", "C4", "G4"], P, T["today"] - P + 0.2, 85)
    s.chord("choir", ["C4", "E4", "G4"], P, T["today"] - P + 0.2, 70)
    s.chord("str", ["D2", "A2", "F#3", "D4", "A4"], T["today"] - 0.5, 0.6, 95)
    s.chord("str", ["G2", "D3", "B3", "G4", "B4"], T["today"], dur - T["today"], 100)
    s.chord("choir", ["G3", "B3", "D4", "G4"], T["today"], dur - T["today"], 90)
    s.note("timp", "G2", T["today"], 1.5, 110)
    s.pedal("pno", P, dur)
    s.arp("pno", ["G3", "B3", "D4", "G4"], P, dur - 0.4, 0.27, vel=56, pattern=[0, 1, 2, 3, 2, 1])
    for k2, n in enumerate(["G5", "B5", "D6", "G6", "B6", "D7"]):
        s.note("cel", n, P + 0.1 + k2 * 0.13, 1.4, 70)
        s.note("cel", n, T["end"] + 1.2 + k2 * 0.12, 1.4, 55)
    s.ramp("str", 11, dur - 1.5, dur, 120, 40)
    s.ramp("choir", 11, dur - 1.5, dur, 120, 30)
    return s


def sfx_a5(T, dur, X):
    X(soft_ding(1567.98), T["arrive"], 0.32)
    X(I.pop(500, 900, 0.07), T["arrive"], 0.2)
    X(I.ui_click(1.0), T["tap"], 0.45)
    X(I.whoosh(0.6, 300, 3500, 0, 0, 0.45, 0.4), T["open"], 0.35)
    paras = [("l1", "Hey du,"), ("l2", "heute ist Montag, 8:57."), ("l3", "Ich sitze am Küchentisch. Kaffee in der Hand."),
             ("l4", "Kein Stau. Kein Wecker um sechs."), ("l5", "Ich hab endlich wieder Zeit."), ("l6", "Und weißt du, wie es angefangen hat?"),
             ("l7", "Mit einem Plan. Und dem Mut, heute anzufangen."), ("sign", "– Du 🧡")]
    rng = np.random.default_rng(3)
    for key, txt in paras:
        for c, ch in enumerate(txt):
            if ch == " ":
                continue
            X(I.keypress(0.85 + 0.3 * rng.random()), T[key] + c / 30, 0.1)
    X(I.whoosh(0.8, 3000, 300, 0, 0, 0.5, 0.4), T["plan"] - 0.2, 0.35)
    X(I.shimmer(2.0, 1568), T["plan"] + 0.1, 0.25)
    X(I.soft_hit(98, 2.0), T["today"], 0.45)
    endcard_sfx(X, T["end"])


ADS = {"a1": (compose_a1, sfx_a1), "a2": (compose_a2, sfx_a2), "a3": (compose_a3, sfx_a3), "a4": (compose_a4, sfx_a4), "a5": (compose_a5, sfx_a5)}


# ============================================================ Mischung
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


def build(ad_id):
    tl = json.load(open(os.path.join(ROOT, "src", "v2", "ads", f"{ad_id}.json")))
    T, dur = tl["t"], tl["dur"]
    N = n_of(dur)
    compose, sfx_fn = ADS[ad_id]
    os.makedirs(OUT, exist_ok=True)
    score = compose(T, dur)
    mus = score.render(os.path.join(OUT, f"{ad_id}.mid"), os.path.join(OUT, f"{ad_id}-score-raw.wav"))
    music = np.zeros((N, 2))
    place(music, mus[:N], 0.0, 1.0)
    # Kino-Raum: zusätzlicher Hall + sanfte Höhenluft
    hall = reverb(music.mean(axis=1) * 0.35, "hall")[:N] * 0.35
    music = music + hall
    music = np.stack([hp(music[:, c], 32) for c in range(2)], axis=1)
    music = shelf_low(music, 140, -3.0)  # klarer auf Handy-Lautsprechern
    music = peaking(music, 320, -1.5, 0.8)

    sfx = np.zeros((N, 2))

    def X(snd, t, g=1.0):
        place(sfx, snd, t, g)

    sfx_fn(T, dur, X)
    sfx = sfx + reverb(sfx.mean(axis=1) * 0.2, "room")[:N] * 0.35
    sfx = np.stack([hp(sfx[:, c], 35) for c in range(2)], axis=1)

    meter = pyln.Meter(SR)
    music *= db(-16.5 - meter.integrated_loudness(music))
    sfx *= db(-21.0 - meter.integrated_loudness(sfx))
    mix = music + sfx
    tail = n_of(0.5)
    mix[-tail:] *= np.linspace(1, 0, tail)[:, None] ** 2
    mix[: n_of(0.004)] *= np.linspace(0, 1, n_of(0.004))[:, None]
    mix *= db(-15.0 - meter.integrated_loudness(mix))
    mix = limiter(mix, -1.5)
    mix *= db(-14.0 - meter.integrated_loudness(mix))
    mix = limiter(mix, -1.2)
    wavfile.write(os.path.join(OUT, f"{ad_id}-mix.wav"), SR, (np.clip(mix, -1, 1) * 32767).astype(np.int16))
    print(f"{ad_id}: {meter.integrated_loudness(mix):.1f} LUFS, Peak {20 * np.log10(np.max(np.abs(mix))):.2f} dBFS, {dur:.1f} s")


if __name__ == "__main__":
    ensure_sf()
    ids = sys.argv[1:] or list(ADS)
    for a in ids:
        build(a)
