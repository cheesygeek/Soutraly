"""Bande-son Soutraly : 120 BPM, si bémol majeur, 20 s. Effets sur la même grille."""
import wave

import numpy as np

SR = 44100
DUR = 20.0
N = int(SR * DUR)
BEAT = 0.5
STEP = BEAT / 4  # double-croche
rng = np.random.default_rng(7)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def fft_filter(x, lo=None, hi=None):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    g = np.ones_like(f)
    if hi:
        g *= 1 / np.sqrt(1 + (f / hi) ** 4)
    if lo:
        g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1)) ** 4)
    return np.fft.irfft(X * g, len(x))


def add(buf, sig, t):
    i = int(round(t * SR))
    if i >= len(buf):
        return
    sig = sig[: len(buf) - i]
    buf[i : i + len(sig)] += sig


def env(n, a=0.002, d=0.3):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)


def marimba(midi, dur=0.9, vel=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(midi)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.35)
    s += 0.35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t / 0.05)
    s += 0.08 * np.sin(2 * np.pi * f * 9.9 * t) * np.exp(-t / 0.015)
    return vel * s * np.minimum(1, t / 0.0015)


def bell(midi, dur=1.4, vel=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(midi)
    s = np.sin(2 * np.pi * f * t + 0.6 * np.sin(2 * np.pi * f * 3.5 * t) * np.exp(-t / 0.2))
    return vel * s * np.exp(-t / 0.5) * np.minimum(1, t / 0.002)


def kick(vel=1.0):
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 45 + 80 * np.exp(-t / 0.03)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return vel * np.sin(ph) * np.exp(-t / 0.12) * np.minimum(1, t / 0.004)


def noise_hit(dur, d, lo=None, hi=None, vel=1.0):
    n = int(dur * SR)
    x = fft_filter(rng.standard_normal(n), lo, hi)
    x /= np.max(np.abs(x)) + 1e-9
    return vel * x * env(n, 0.001, d)


def bass_note(midi, dur, vel=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(midi)
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t) + 0.1 * np.sin(2 * np.pi * 3 * f * t)
    e = np.minimum(1, t / 0.004) * np.exp(-t / 0.35)
    e *= np.minimum(1, (dur - t) / 0.02).clip(0)
    return vel * s * e


def pad_chord(notes, dur, vel=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for m in notes:
        for det in (-0.12, 0.12):
            f = hz(m + det / 1)
            s += np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)
    e = np.minimum(1, t / 0.25) * np.minimum(1, (dur - t) / 0.3).clip(0)
    return vel * s * e / len(notes)


def whoosh(dur, vel=1.0, rise=True):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    x = fft_filter(x, 400, 5000)
    t = np.linspace(0, 1, n)
    e = (t ** 2 if rise else (1 - t) ** 2) * np.sin(np.pi * np.clip(t * 1.0, 0, 1)) ** 0.3
    return vel * x / (np.max(np.abs(x)) + 1e-9) * e


def reverb(x, secs=1.1, mix=0.22):
    n = int(secs * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal(n) * np.exp(-t / (secs / 5))
    ir = fft_filter(ir, 200, 6000)
    ir /= np.sqrt(np.sum(ir ** 2))
    L = len(x) + n
    y = np.fft.irfft(np.fft.rfft(x, L) * np.fft.rfft(ir, L), L)[: len(x)]
    return (1 - mix) * x + mix * y * 0.9


drums = np.zeros(N)
bass = np.zeros(N)
keys = np.zeros(N)
pad = np.zeros(N)
sfx = np.zeros(N)

# F – Dm – Bb – C (une mesure = 2 s), fondamentales en MIDI
CHORDS = [(46, [62, 65, 70]), (43, [62, 67, 70]), (51, [63, 67, 70]), (53, [60, 65, 69])]
BARS = 10
END_GROOVE = 19.0  # accord final à 19 s

for bar in range(BARS):
    t0 = bar * 2.0
    root, tri = CHORDS[bar % 4]
    if t0 < END_GROOVE:
        pad_len = min(2.0, END_GROOVE - t0)
        add(pad, pad_chord(tri, pad_len + 0.05, 0.5), t0)
    for step in range(16):
        t = t0 + step * STEP
        if t >= END_GROOVE:
            continue
        if step in (0, 6, 8):
            add(drums, kick(1.0 if step != 6 else 0.7), t)
        if step in (4, 12):
            add(drums, noise_hit(0.2, 0.05, 900, 7000, 0.38), t)
            add(drums, marimba(84, 0.15, 0.10), t)  # rim
        add(drums, noise_hit(0.08, 0.018, 6000, 11000, 0.12 if step % 2 else 0.06), t)  # shaker
        if step in (0, 3, 6, 8, 11, 14):
            m = root - 12 + (7 if step in (11,) else 0)
            add(bass, bass_note(m, STEP * (3 if step in (0, 3, 8, 11) else 2) * 0.95, 0.9), t)
        # marimba en croches syncopées sur l'accord
        if step in (2, 5, 7, 10, 13, 15):
            note = tri[[0, 1, 2, 1, 2, 0][[2, 5, 7, 10, 13, 15].index(step)]] + 12
            add(keys, marimba(note, 0.5, 0.22), t)

# Petite respiration avant la révélation (2,75 → 3,0) : on retire le shaker / la caisse
gap = (np.arange(N) / SR > 2.75) & (np.arange(N) / SR < 3.0)
drums[gap] *= 0.25

# Accord final à 19 s
add(pad, pad_chord([62, 65, 70, 74], 1.0, 0.7), END_GROOVE)
add(bass, bass_note(34, 1.0, 1.0), END_GROOVE)
add(drums, kick(0.9), END_GROOVE)
for i, m in enumerate([74, 77, 82, 86]):
    add(keys, marimba(m, 0.95, 0.25), END_GROOVE + i * 0.0)

# --- Effets (même tonalité, même grille)
for i, m in enumerate([70, 72, 74, 77]):  # calendrier 21 → 24
    add(sfx, marimba(m, 0.5, 0.35), 0.5 * i + (0.5 if i else 0.0))
for m in [70, 74, 77, 82]:  # le 25
    add(sfx, bell(m, 1.4, 0.13), 2.0)
add(sfx, whoosh(0.5, 0.18), 2.5)
for m in [58, 65, 70, 74, 77]:  # révélation
    add(sfx, bell(m, 1.8, 0.15), 3.0)
add(sfx, whoosh(0.5, 0.12), 5.5)
for i in range(5):  # saisie de 50000
    add(sfx, marimba(94, 0.12, 0.10), 6.75 + i * STEP)
for t, m in [(7.5, 82), (9.5, 82), (12.0, 82), (14.0, 82)]:  # envoi / touches
    add(sfx, marimba(m, 0.4, 0.38), t)
for t, m in [(8.0, 77), (10.0, 74), (12.5, 77)]:  # réponses du bot
    add(sfx, bell(m, 0.9, 0.14), t)
add(sfx, whoosh(0.3, 0.10, rise=False), 10.75)
for i, m in enumerate([70, 74, 77, 82]):  # financement réussi
    add(sfx, marimba(m, 0.7, 0.35), 14.5 + i * STEP)
add(sfx, bell(86, 1.2, 0.12), 14.5 + 4 * STEP)
add(sfx, whoosh(0.5, 0.2), 15.5)
for m in [58, 65, 70, 74]:
    add(sfx, bell(m, 2.0, 0.12), 16.0)

drums = fft_filter(drums, 30, 10000)
bass = fft_filter(bass, 30, 900)
mix = 0.9 * drums + 0.55 * bass + reverb(0.9 * keys + 0.18 * pad, 1.2, 0.25) + reverb(0.8 * sfx, 1.4, 0.3)

# Fondu de sortie (19,3 → 20)
tt = np.arange(N) / SR
mix *= np.clip((DUR - tt) / 0.7, 0, 1)
mix *= np.clip(tt / 0.01, 0, 1)

mix /= np.max(np.abs(mix))
mix = np.tanh(mix * 1.6) / np.tanh(1.6)
mix *= 0.89  # ~ -1 dBFS

st = np.stack([mix, mix], 1)
# léger élargissement stéréo sur la réverbe : décalage de 9 ms côté droit pour keys/sfx
wide = reverb(0.9 * keys + 0.8 * sfx, 1.2, 1.0) * 0.08
d = int(0.009 * SR)
st[:, 0] += wide
st[d:, 1] -= wide[:-d] * 0.6
st /= np.max(np.abs(st)) / 0.63

with wave.open("music.wav", "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes())
print("ok", st.shape)
