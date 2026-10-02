"""
Kleine DSP-Bibliothek für Musik und Sounddesign des Spots.
Alles wird hier synthetisiert – keine Samples, keine Fremdaufnahmen.
"""
import numpy as np
from numba import njit
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
RNG = np.random.default_rng(42)


def n_of(d):
    return max(1, int(round(d * SR)))


def tl(d):
    return np.arange(n_of(d)) / SR


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


NOTE = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6,
        "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}


def nf(name):
    """'A2' → Frequenz."""
    p = name[:-1]
    o = int(name[-1])
    return midi(12 * (o + 1) + NOTE[p])


# ------------------------------------------------------------------ Oszillatoren
def phase_of(freq, n):
    f = np.broadcast_to(np.asarray(freq, dtype=np.float64), (n,))
    return np.cumsum(f / SR) % 1.0, f / SR


def sine(freq, d, ph0=0.0):
    n = n_of(d)
    f = np.broadcast_to(np.asarray(freq, dtype=np.float64), (n,))
    ph = np.cumsum(f / SR) + ph0
    return np.sin(2 * np.pi * ph)


def _blep(t, dt):
    out = np.zeros_like(t)
    m1 = t < dt
    x = t[m1] / dt[m1]
    out[m1] = x + x - x * x - 1
    m2 = t > 1 - dt
    x = (t[m2] - 1) / dt[m2]
    out[m2] = x * x + x + x + 1
    return out


def saw(freq, d, ph0=None):
    n = n_of(d)
    f = np.broadcast_to(np.asarray(freq, dtype=np.float64), (n,))
    dt = f / SR
    start = RNG.random() if ph0 is None else ph0
    t = (np.cumsum(dt) + start) % 1.0
    return (2 * t - 1) - _blep(t, dt)


def square(freq, d, pw=0.5):
    n = n_of(d)
    f = np.broadcast_to(np.asarray(freq, dtype=np.float64), (n,))
    dt = f / SR
    t = np.cumsum(dt) % 1.0
    s = np.where(t < pw, 1.0, -1.0)
    s += _blep(t, dt)
    s -= _blep((t + (1 - pw)) % 1.0, dt)
    return s


def tri(freq, d):
    return 2 * np.abs(saw(freq, d)) - 1


def noise(d):
    return RNG.standard_normal(n_of(d))


def pink(d):
    w = noise(d)
    b = butter(1, 1200, "low", fs=SR, output="sos")
    return (sosfilt(b, w) * 3 + w * 0.25)


# ------------------------------------------------------------------ Hüllkurven
def exp_env(d, tau, attack=0.002):
    t = tl(d)
    e = np.exp(-t / tau)
    a = n_of(attack)
    if a > 1:
        e[:a] *= np.linspace(0, 1, a)
    return e


def adsr(d, a=0.01, dc=0.1, s=0.7, r=0.2):
    n = n_of(d)
    e = np.ones(n) * s
    na, nd, nr = n_of(a), n_of(dc), n_of(r)
    na = min(na, n)
    e[:na] = np.linspace(0, 1, na)
    if na + nd < n:
        e[na:na + nd] = np.linspace(1, s, nd)
    if nr < n:
        e[-nr:] *= np.linspace(1, 0, nr) ** 1.5
    return e


def fade(x, fin=0.002, fout=0.01):
    x = x.copy()
    a, b = n_of(fin), n_of(fout)
    a, b = min(a, len(x)), min(b, len(x))
    x[:a] *= np.linspace(0, 1, a)
    x[-b:] *= np.linspace(1, 0, b)
    return x


# ------------------------------------------------------------------ Filter
def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR * 0.45), "low", fs=SR, output="sos"), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, min(hi, SR * 0.45)], "band", fs=SR, output="sos"), x)


@njit(cache=True)
def _svf(x, fc, q, mode):
    y = np.zeros_like(x)
    low = 0.0
    band = 0.0
    for i in range(len(x)):
        f = 2.0 * np.sin(np.pi * min(fc[i], 20000.0) / 48000.0 / 2.0)
        if f > 0.99:
            f = 0.99
        for _ in range(2):  # 2x Oversampling für Stabilität
            high = x[i] - low - q * band
            band += f * high
            low += f * band
        if mode == 0:
            y[i] = low
        elif mode == 1:
            y[i] = band
        else:
            y[i] = high
    return y


def svf(x, fc, res=0.7, mode="lp"):
    """Zustandsvariabler Filter mit zeitvariabler Grenzfrequenz."""
    fcv = np.broadcast_to(np.asarray(fc, dtype=np.float64), x.shape).copy()
    q = max(0.05, 2.0 - 2.0 * res)
    return _svf(x.astype(np.float64), fcv, q, {"lp": 0, "bp": 1, "hp": 2}[mode])


def peaking(x, f0, gain_db, q=0.8):
    a = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / SR
    alpha = np.sin(w0) / (2 * q)
    b0, b1, b2 = 1 + alpha * a, -2 * np.cos(w0), 1 - alpha * a
    a0, a1, a2 = 1 + alpha / a, -2 * np.cos(w0), 1 - alpha / a
    sos = np.array([[b0 / a0, b1 / a0, b2 / a0, 1, a1 / a0, a2 / a0]])
    if x.ndim == 2:
        return np.stack([sosfilt(sos, x[:, c]) for c in range(2)], axis=1)
    return sosfilt(sos, x)


def shelf_high(x, f0, gain_db):
    a = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / SR
    alpha = np.sin(w0) / 2 * np.sqrt(2)
    cw = np.cos(w0)
    b0 = a * ((a + 1) + (a - 1) * cw + 2 * np.sqrt(a) * alpha)
    b1 = -2 * a * ((a - 1) + (a + 1) * cw)
    b2 = a * ((a + 1) + (a - 1) * cw - 2 * np.sqrt(a) * alpha)
    a0 = (a + 1) - (a - 1) * cw + 2 * np.sqrt(a) * alpha
    a1 = 2 * ((a - 1) - (a + 1) * cw)
    a2 = (a + 1) - (a - 1) * cw - 2 * np.sqrt(a) * alpha
    sos = np.array([[b0 / a0, b1 / a0, b2 / a0, 1, a1 / a0, a2 / a0]])
    if x.ndim == 2:
        return np.stack([sosfilt(sos, x[:, c]) for c in range(2)], axis=1)
    return sosfilt(sos, x)


# ------------------------------------------------------------------ Raum & Stereo
def make_ir(decay=2.2, size=1.0, damp=5200, pre=0.012):
    d = decay * 1.3
    n = n_of(d)
    t = np.arange(n) / SR
    env = np.exp(-6.9 * t / decay)
    irs = []
    for c in range(2):
        w = RNG.standard_normal(n)
        w = lp(w, damp) * 0.6 + lp(w, damp * 0.35) * 0.4
        ir = w * env
        # frühe Reflexionen
        for k in range(10):
            pos = int((pre + RNG.random() * 0.05 * size) * SR)
            if pos < n:
                ir[pos] += (RNG.random() - 0.5) * 1.6 * (1 - k / 12)
        irs.append(ir)
    ir = np.stack(irs, axis=1)
    pad = n_of(pre)
    ir[:pad] = 0
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


IR_HALL = None
IR_ROOM = None


def reverb(x, kind="hall", mix=1.0):
    global IR_HALL, IR_ROOM
    if IR_HALL is None:
        IR_HALL = make_ir(2.6, 1.0, 6000, 0.02)
        IR_ROOM = make_ir(0.9, 0.4, 7000, 0.006)
    ir = IR_HALL if kind == "hall" else IR_ROOM
    st = to_stereo(x)
    out = np.stack([fftconvolve(st[:, 0], ir[:, 0])[: len(st)], fftconvolve(st[:, 1], ir[:, 1])[: len(st)]], axis=1)
    return out * mix


def to_stereo(x):
    if x.ndim == 2:
        return x
    return np.stack([x, x], axis=1)


def pan(x, p=0.0):
    """p: -1 links … +1 rechts, gleichleistend. p darf ein Array sein."""
    p = np.asarray(p)
    a = (p + 1) * np.pi / 4
    if x.ndim == 2:
        x = x.mean(axis=1)
    return np.stack([x * np.cos(a), x * np.sin(a)], axis=1)


def widen(x, amount=0.012):
    """Haas-artige Verbreiterung durch leicht versetzte Kopie."""
    st = to_stereo(x).copy()
    d = n_of(amount)
    r = np.zeros_like(st[:, 1])
    r[d:] = st[:-d, 1]
    st[:, 1] = st[:, 1] * 0.5 + r * 0.5
    return st


def delay(x, time=0.375, fb=0.35, mix=0.3, pingpong=True, lpf=4500):
    st = to_stereo(x)
    n = len(st)
    out = np.zeros((n + n_of(time * 8), 2))
    out[:n] += st
    d = n_of(time)
    tap = lp(st.mean(axis=1), lpf)
    g = mix
    for k in range(1, 8):
        side = (k % 2) if pingpong else 0
        seg = tap * g
        out[k * d: k * d + n, side] += seg
        if not pingpong:
            out[k * d: k * d + n, 1] += seg
        g *= fb
    return out[:n] if len(out) > n else out


def place(buf, snd, t, gain=1.0):
    """Mischt `snd` (mono/stereo) ab Sekunde `t` in `buf` (stereo)."""
    s = to_stereo(snd) * gain
    i = int(round(t * SR))
    if i < 0:
        s = s[-i:]
        i = 0
    j = min(len(buf), i + len(s))
    if j > i:
        buf[i:j] += s[: j - i]


def soft_clip(x, drive=1.0):
    return np.tanh(x * drive) / np.tanh(drive)


def db(x):
    return 10 ** (x / 20)


def shelf_low(x, f0, gain_db):
    a = 10 ** (gain_db / 40)
    w0 = 2 * np.pi * f0 / SR
    alpha = np.sin(w0) / 2 * np.sqrt(2)
    cw = np.cos(w0)
    b0 = a * ((a + 1) - (a - 1) * cw + 2 * np.sqrt(a) * alpha)
    b1 = 2 * a * ((a - 1) - (a + 1) * cw)
    b2 = a * ((a + 1) - (a - 1) * cw - 2 * np.sqrt(a) * alpha)
    a0 = (a + 1) + (a - 1) * cw + 2 * np.sqrt(a) * alpha
    a1 = -2 * ((a - 1) + (a + 1) * cw)
    a2 = (a + 1) + (a - 1) * cw - 2 * np.sqrt(a) * alpha
    sos = np.array([[b0 / a0, b1 / a0, b2 / a0, 1, a1 / a0, a2 / a0]])
    if x.ndim == 2:
        return np.stack([sosfilt(sos, x[:, c]) for c in range(2)], axis=1)
    return sosfilt(sos, x)
