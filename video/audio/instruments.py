"""Instrumente und Soundeffekte – vollständig synthetisiert."""
import numpy as np
from dsp import (SR, RNG, n_of, tl, sine, saw, square, noise, pink, exp_env, adsr, fade, lp, hp, bp,
                 svf, pan, to_stereo, reverb, soft_clip, widen)

# ------------------------------------------------------------------ Drums
def kick(punch=1.0, length=0.36, tone=54.0):
    t = tl(length)
    f = tone + (190 - tone) * np.exp(-t / 0.038)
    body = sine(f, length) * exp_env(length, 0.15 * punch, 0.0008)
    knock = sine(f * 2.2, length) * exp_env(length, 0.035) * 0.45
    click = hp(noise(0.008), 2800) * np.linspace(1, 0, n_of(0.008)) * 0.9
    out = body + knock
    out[: len(click)] += click
    return soft_clip(out * 1.5, 1.8) * 0.95


def clap(length=0.32):
    n = n_of(length)
    out = np.zeros(n)
    w = bp(noise(length), 900, 6000)
    for k, off in enumerate([0, 0.011, 0.022]):
        i = n_of(off)
        e = exp_env(0.02, 0.006)
        out[i:i + len(e)] += w[i:i + len(e)] * e * (0.8 + k * 0.1)
    tail = w * exp_env(length, 0.09) * 0.55
    tail[: n_of(0.03)] = 0
    return (out + tail) * 0.8


def hat(open_=False, length=None):
    length = length or (0.22 if open_ else 0.05)
    w = hp(noise(length), 7000, 3)
    metal = sum(square(f, length) for f in [3140, 4250, 5300, 6800]) * 0.06
    metal = hp(metal, 6000)
    return (w + metal) * exp_env(length, 0.07 if open_ else 0.014) * 0.85


def tick(pitch=1.0, length=0.03):
    w = bp(noise(length), 2200 * pitch, 5200 * pitch)
    body = sine(1900 * pitch, length) * 0.35
    return (w * 1.2 + body) * exp_env(length, 0.0045)


def shaker(length=0.07):
    return hp(noise(length), 5000) * adsr(length, 0.015, 0.02, 0.4, 0.03) * 0.35


# ------------------------------------------------------------------ Tonal
def sub(freq, length, glide_from=None):
    t = tl(length)
    f = np.full(len(t), freq)
    if glide_from:
        f = freq + (glide_from - freq) * np.exp(-t / 0.03)
    s = sine(f, length) + 0.35 * sine(f * 2, length) + 0.12 * sine(f * 3, length)
    return s * adsr(length, 0.004, 0.08, 0.85, 0.06)


def bass_pulse(freq, length, cutoff=520):
    s = saw(freq, length) * 0.6 + square(freq * 0.5, length) * 0.4
    e = exp_env(length, 0.12, 0.002)
    fc = 120 + cutoff * exp_env(length, 0.06)
    return svf(s, fc, 0.35) * e * 1.3


def pad(freqs, length, cutoff=1900, attack=0.5, release=0.8, bright=0.0, voices=5, detune=0.11):
    n = n_of(length)
    out = np.zeros((n, 2))
    for k, f in enumerate(freqs):
        for v in range(voices):
            cents = (v - (voices - 1) / 2) * detune * 100 / max(1, (voices - 1) / 2) * 0.18
            fv = f * 2 ** (cents / 1200)
            s = saw(fv, length) * 0.22
            p = ((v / max(1, voices - 1)) * 2 - 1) * 0.75
            out += pan(s, p)
    t = tl(length)
    lfo = 1 + 0.12 * np.sin(2 * np.pi * 0.23 * t)
    fc = cutoff * lfo * (1 + bright * t / max(length, 1e-3))
    for c in range(2):
        out[:, c] = svf(out[:, c], fc, 0.25)
    env = adsr(length, attack, 0.3, 0.9, release)
    return out * env[:, None] / max(1, len(freqs)) * 1.6


def pluck(freq, length=0.6, bright=5200):
    s = saw(freq, length) * 0.6 + square(freq * 1.002, length, 0.3) * 0.4
    fc = 500 + bright * exp_env(length, 0.07)
    return svf(s, fc, 0.3) * exp_env(length, 0.22, 0.001) * 0.9


def bell(freq, length=2.4, index=3.0, ratio=3.5):
    t = tl(length)
    mod = sine(freq * ratio, length) * index * np.exp(-t / 0.5) * freq
    car = np.sin(2 * np.pi * np.cumsum(freq + mod) / SR)
    return car * exp_env(length, 0.7, 0.002) * 0.7 + sine(freq * 2, length) * exp_env(length, 0.3) * 0.15


def stab_dark(freqs, length=0.7):
    out = sum(saw(f, length) + saw(f * 1.006, length) for f in freqs) / len(freqs)
    out = svf(out, 300 + 2400 * exp_env(length, 0.09), 0.3)
    return soft_clip(out * 1.6, 2.0) * exp_env(length, 0.25) * 0.8


# ------------------------------------------------------------------ Sounddesign
def whoosh(length=0.6, f0=300, f1=4000, p0=-0.6, p1=0.6, peak=0.6, res=0.55, color="pink"):
    w = pink(length) if color == "pink" else noise(length)
    t = np.linspace(0, 1, n_of(length))
    fc = f0 * (f1 / f0) ** t
    s = svf(w, fc, res, "bp") * 1.2 + svf(w, fc * 0.5, 0.2, "lp") * 0.3
    env = np.where(t < peak, (t / peak) ** 2.2, ((1 - t) / (1 - peak)) ** 1.6)
    return pan(s * env, np.linspace(p0, p1, len(t)))


def whip(length=0.14, up=True, p=0.0):
    return whoosh(length, 900 if up else 6000, 7000 if up else 900, p - 0.4, p + 0.4, 0.45, 0.7, "white")


def impact(size=1.0, low=52, tail=1.6):
    length = tail
    t = tl(length)
    f = low * 0.55 + (low * 1.8 - low * 0.55) * np.exp(-t / 0.09)
    boom = sine(f, length) * exp_env(length, 0.55 * size, 0.001)
    crack = lp(noise(0.25), 3200) * exp_env(0.25, 0.04) * 0.9
    thud = lp(noise(0.12), 400) * exp_env(0.12, 0.03) * 1.2
    dry = boom.copy()
    dry[: len(crack)] += crack * size
    dry[: len(thud)] += thud
    dry = soft_clip(dry * 1.3, 1.5)
    wet = reverb(hp(crack, 300), "hall") * 0.5
    out = to_stereo(dry)
    out[: len(wet)] += wet[: len(out)]
    return out * 0.9


def soft_hit(freq=110, length=1.2):
    t = tl(length)
    body = sine(freq * (1 + 0.5 * np.exp(-t / 0.02)), length) * exp_env(length, 0.35)
    air = bp(noise(0.3), 400, 3000) * exp_env(0.3, 0.06) * 0.25
    out = body * 0.8
    out[: len(air)] += air
    st = to_stereo(out)
    wet = reverb(out * 0.5, "hall")
    return st + wet * 0.45


def riser(length=1.5, f0=250, f1=7000, tone=True):
    t = np.linspace(0, 1, n_of(length))
    w = noise(length)
    fc = f0 * (f1 / f0) ** (t ** 1.4)
    s = svf(w, fc, 0.6, "bp") * (t ** 2.2)
    out = pan(s, np.sin(t * 18) * 0.5)
    if tone:
        f = 180 * (6 ** (t ** 1.5))
        tn = (saw(f, length) * 0.3 + sine(f * 1.5, length) * 0.2)
        tn = svf(tn, 600 + 3000 * t, 0.3) * (t ** 2.5) * 0.35
        out += widen(tn)
    return out


def reverse_swell(length=1.0, bright=6000):
    w = hp(noise(length), 1500)
    w = lp(w, bright)
    e = np.linspace(0, 1, n_of(length)) ** 3.5
    return widen(w * e * 0.6, 0.009)


def ui_click(pitch=1.0, length=0.03):
    s = sine(2400 * pitch, length) * exp_env(length, 0.004)
    s += hp(noise(length), 3000) * exp_env(length, 0.0015) * 0.5
    return s * 0.8


def pop(f0=420, f1=980, length=0.09):
    t = tl(length)
    f = f0 + (f1 - f0) * (1 - np.exp(-t / 0.018))
    return sine(f, length) * exp_env(length, 0.03, 0.001) * 0.9


def ding(freq=1568, length=0.9):
    s = sine(freq, length) * exp_env(length, 0.28) + sine(freq * 2.01, length) * exp_env(length, 0.09) * 0.3
    s += sine(freq * 3.02, length) * exp_env(length, 0.04) * 0.12
    return fade(s, 0.001, 0.05) * 0.6


def ping(length=0.5):
    out = np.zeros(n_of(length))
    a = ding(987.8, 0.3) * 0.7
    b = ding(1318.5, 0.42) * 0.7
    out[: len(a)] += a
    i = n_of(0.07)
    out[i:i + len(b)] += b[: len(out) - i]
    return out


def keypress(seed_pitch=1.0):
    length = 0.045
    s = bp(noise(length), 1800 * seed_pitch, 7000) * exp_env(length, 0.006) * 0.8
    s += sine(170 * seed_pitch, length) * exp_env(length, 0.01) * 0.5
    return s


def page_flip(length=0.42):
    t = np.linspace(0, 1, n_of(length))
    w = pink(length)
    flutter = 0.6 + 0.4 * np.abs(np.sin(t * 90 + RNG.random() * 6)) * (1 - t)
    fc = 5200 * (1 - t) + 900
    s = svf(w, fc, 0.35, "bp") * 1.4 + hp(noise(length), 4500) * 0.25
    env = np.where(t < 0.12, (t / 0.12) ** 1.5, np.exp(-(t - 0.12) / 0.16))
    return pan(s * env * flutter, np.linspace(0.35, -0.35, len(t)))


def thump(freq=85, length=0.25):
    t = tl(length)
    s = sine(freq * (1 + np.exp(-t / 0.015)), length) * exp_env(length, 0.07)
    s += lp(noise(length), 900) * exp_env(length, 0.02) * 0.5
    return s


def alarm(beeps=4, on=0.07, off=0.045, freq=2600):
    seg = square(freq, on, 0.5) * 0.35 + sine(freq, on) * 0.4
    seg = lp(seg, 6000) * adsr(on, 0.003, 0.01, 0.9, 0.01)
    gap = np.zeros(n_of(off))
    return np.concatenate([np.concatenate([seg, gap]) for _ in range(beeps)])


def chime_two(f1=659.3, f2=523.3):
    a = bell(f1, 0.9, 1.4, 2.0) * 0.5
    b = bell(f2, 1.2, 1.4, 2.0) * 0.5
    out = np.zeros(n_of(1.4))
    out[: len(a)] += a
    i = n_of(0.16)
    out[i:i + len(b)] += b[: len(out) - i]
    return out


def ratchet(length=0.6, rate0=40, rate1=6, pitch=1.0):
    out = np.zeros(n_of(length))
    t = 0.0
    while t < length:
        frac = t / length
        rate = rate0 + (rate1 - rate0) * frac
        tk = tick(pitch * (1.1 - 0.25 * frac), 0.02) * 0.6
        i = n_of(t)
        out[i:i + len(tk)] += tk[: len(out) - i]
        t += 1.0 / rate
    return out


def stamp():
    s = thump(70, 0.3) * 1.2
    slap = bp(noise(0.08), 1500, 7000) * exp_env(0.08, 0.012)
    s[: len(slap)] += slap * 0.8
    out = to_stereo(s)
    out += reverb(s * 0.4, "room")[: len(out)]
    return out


def zip_up(length=0.32, f0=320, f1=1500):
    t = np.linspace(0, 1, n_of(length))
    f = f0 * (f1 / f0) ** t
    tn = sine(f, length) * 0.4 + saw(f, length) * 0.08
    s = svf(noise(length), f * 3, 0.6, "bp") * 0.5
    env = np.sin(np.pi * np.clip(t * 1.1, 0, 1)) ** 0.8
    return widen((tn + s) * env * 0.8)


def glitch(length=0.16):
    out = np.zeros(n_of(length))
    pos = 0
    while pos < len(out):
        d = int(SR * (0.008 + RNG.random() * 0.02))
        f = 200 + RNG.random() * 3000
        seg = square(f, d / SR, 0.3) * (0.3 + RNG.random() * 0.4)
        out[pos:pos + d] += seg[: len(out) - pos]
        pos += d
    return lp(out, 7000) * np.linspace(1, 0.2, len(out))


def heartbeat():
    a = thump(52, 0.3) * 0.9
    b = thump(48, 0.35) * 0.7
    out = np.zeros(n_of(0.7))
    out[: len(a)] += a
    i = n_of(0.21)
    out[i:i + len(b)] += b[: len(out) - i]
    return lp(out, 300)


def shimmer(length=1.4, base=2093.0):
    out = np.zeros(n_of(length))
    for k, m in enumerate([1, 1.5, 2, 2.5, 3]):
        d = n_of(0.03 * k)
        b = bell(base * m, length - 0.03 * k, 1.2, 1.41) * (0.5 / (k + 1))
        out[d:d + len(b)] += b[: len(out) - d]
    return out
