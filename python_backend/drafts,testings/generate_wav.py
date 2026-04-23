import numpy as np
import wave
import argparse

# ======================
# CONFIG
# ======================
SAMPLE_RATE = 44100
DURATION = 60
VOLUME = 0.25  # LSB-safe low amplitude (critical)

# A major chord set (frequencies)
# CHORDS = [
#     [220.00, 277.18, 329.63],   # A3 major
#     [246.94, 293.66, 369.99],   # B minor-ish flavor
#     [261.63, 329.63, 392.00],   # C# minor-ish
#     [293.66, 369.99, 440.00],   # D major-ish
#     [329.63, 415.30, 493.88],   # E major-ish
# ]

CHORDS = [
    # Original (fixed)
    [220.00, 277.18, 329.63],   # A major (A C# E)
    [246.94, 293.66, 369.99],   # B minor (B D F#)
    [277.18, 329.63, 415.30],   # C# minor (C# E G#) <-- FIXED
    [293.66, 369.99, 440.00],   # D major (D F# A)
    [329.63, 415.30, 493.88],   # E major (E G# B)

    # NEW (correct continuation)
    [369.99, 440.00, 277.18],   # F# minor (F# A C#)
    [415.30, 493.88, 293.66],   # G# diminished (G# B D)
    [220.00, 277.18, 329.63],   # A major (resolution)
    [329.63, 415.30, 493.88],   # E major (strong ending / loopable)

    [369.99, 440.00, 277.18],   # F#m (inversion)
    [293.66, 440.00, 369.99],   # D (inversion)
    [277.18, 329.63, 220.00],   # A (inversion)
    [415.30, 493.88, 329.63],   # E (inversion)
    [246.94, 369.99, 293.66],   # Bm (inversion)

    [277.18, 329.63, 415.30],   # C#m
    [369.99, 440.00, 277.18],   # F#m
    [246.94, 293.66, 369.99],   # Bm
    [329.63, 415.30, 493.88],   # E
    [220.00, 277.18, 329.63],   # A (final resolve)

    [369.99, 440.00, 277.18],   # F# minor (F# A C#)
    [415.30, 493.88, 293.66],   # G# diminished (G# B D)
    [220.00, 277.18, 329.63],   # A major (resolution)
    [329.63, 415.30, 493.88],   # E major (strong ending / loopable)

    [369.99, 440.00, 277.18],   # F#m (inversion)
    [293.66, 440.00, 369.99],   # D (inversion)
    [277.18, 329.63, 220.00],   # A (inversion)
    [415.30, 493.88, 329.63],   # E (inversion)
    [220.00, 277.18, 329.63],   # A (final resolve)
]

# rhythm pattern (kick-like pulses)
BEAT_PATTERN = [1, 0, 0.6, 0, 1, 0, 0.7, 0]


# ======================
# WAVE GENERATION
# ======================
def sine(freq, t):
    return np.sin(2 * np.pi * freq * t)


def apply_envelope(signal, sample_rate):
    """Smooth envelope to avoid clicks and LSB instability"""
    fade_len = int(0.01 * sample_rate)

    envelope = np.ones_like(signal)
    envelope[:fade_len] = np.linspace(0, 1, fade_len)
    envelope[-fade_len:] = np.linspace(1, 0, fade_len)

    return signal * envelope


# ======================
# POLYPHONIC CHORD
# ======================
def generate_chord(chord_freqs, duration, sample_rate):
    t = np.linspace(0, duration, int(sample_rate * duration), False)

    chord = np.zeros_like(t)

    for f in chord_freqs:
        chord += sine(f, t)

    chord /= len(chord_freqs)  # normalize

    return apply_envelope(chord, sample_rate)


# ======================
# RHYTHM LAYER (kick-style pulse)
# ======================
def generate_rhythm(duration, sample_rate):
    step_time = 0.25
    steps = int(duration / step_time)

    audio = np.array([], dtype=np.float32)

    for i in range(steps):
        t = np.linspace(0, step_time, int(sample_rate * step_time), False)

        pulse = BEAT_PATTERN[i % len(BEAT_PATTERN)]
        tone = sine(60, t) * pulse  # low frequency "kick feel"

        audio = np.concatenate((audio, tone))

    return apply_envelope(audio, sample_rate)


# ======================
# STEREO SPATIALIZER
# ======================
def stereo_pan(mono_signal):
    """Creates left-right movement effect"""
    length = len(mono_signal)

    left = np.zeros(length)
    right = np.zeros(length)

    for i in range(length):
        pan = np.sin(2 * np.pi * (i / length))  # smooth L-R movement

        left[i] = mono_signal[i] * (0.5 + (1 - pan) / 2)
        right[i] = mono_signal[i] * (0.5 + (1 + pan) / 2)

    return np.vstack((left, right))


# ======================
# MAIN GENERATION
# ======================
def generate(output):
    chord_duration = 2.0
    rhythm_duration = DURATION

    audio = np.zeros(int(SAMPLE_RATE * DURATION))

    # build layered structure
    for i in range(int(DURATION / chord_duration)):
        chord = CHORDS[i % len(CHORDS)]
        segment = generate_chord(chord, chord_duration, SAMPLE_RATE)

        start = int(i * chord_duration * SAMPLE_RATE)
        audio[start:start + len(segment)] += segment

    # add rhythm layer
    rhythm = generate_rhythm(rhythm_duration, SAMPLE_RATE)
    audio[:len(rhythm)] += rhythm

    # ======================
    # LSB-SAFE NORMALIZATION
    # ======================
    max_val = np.max(np.abs(audio))
    if max_val > 0:
        audio = audio / max_val

    audio *= VOLUME  # keep safe amplitude range

    # stereo conversion
    stereo = stereo_pan(audio)

    # convert to 16-bit PCM
    stereo = (stereo * 32767).astype(np.int16)

    # ======================
    # WRITE WAV
    # ======================
    with wave.open(output, "w") as f:
        f.setnchannels(2)  # stereo
        f.setsampwidth(2)  # 16-bit
        f.setframerate(SAMPLE_RATE)
        f.writeframes(stereo.T.tobytes())

    print(f"Generated LSB-safe stereo WAV: {output}")


# ======================
# CLI
# ======================
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("-o", "--output", default="stegolock_audio.wav")
    args = parser.parse_args()

    generate(args.output)
