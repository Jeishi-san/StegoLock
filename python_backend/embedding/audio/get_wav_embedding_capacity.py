import sys
import numpy as np
from scipy.io import wavfile
import wave

USAGE_RATIO = 0.15

def get_wav_embedding_capacity(wav_path):
    """
    Validates WAV file for LSB embedding and returns usable and total LSB capacity (in bytes).

    Conditions:
    - Sample rate >= 44100 Hz
    - Bit depth = 16-bit PCM (int16)
    - Uncompressed (PCM)

    Returns:
    - (usable_bytes, total_bytes) if valid
    - (-1, -1) if not valid
    """

    try:
        # --- Check compression (must be PCM / uncompressed) ---
        with wave.open(wav_path, 'rb') as wav_file:
            comptype = wav_file.getcomptype()
            if comptype != 'NONE':
                return -1, -1  # compressed WAV

        # --- Read WAV data ---
        rate, audio = wavfile.read(wav_path)

        # --- Check sample rate ---
        if rate < 44100:
            return -1, -1

        # --- Check bit depth (dtype) ---
        if audio.dtype != np.int16:
            return -1, -1

        # --- Determine channels ---
        if len(audio.shape) == 1:
            num_channels = 1
            num_samples = audio.shape[0]
        else:
            num_channels = audio.shape[1]
            num_samples = audio.shape[0] * num_channels

        # --- Compute total LSB capacity ---
        total_bits = num_samples  # 1 LSB per sample
        total_bytes = total_bits // 8

        # --- Apply stealth usage ratio ---
        usable_bits = int(total_bits * USAGE_RATIO)
        usable_bytes = usable_bits // 8

        return usable_bytes, total_bytes

    except Exception as e:
        return -1, -1

# ------------------- CLI execution -------------------
if __name__ == "__main__":
    if len(sys.argv) < 1:
        print("Usage: python get_wav_capacity.py <wav_path> [USAGE_RATIO]")
        sys.exit(1)

    wav_path = sys.argv[1]

    usable, total = get_wav_embedding_capacity(wav_path)
    print(f"{usable},{total}")  # Comma-separated for easy parsing in Laravel


"""
LARAVEL CALL
$wavPath = storage_path('app/public/cover_audio/sample.wav');
$output = exec("python3 python_backend/embedding/audio/get_wav_capacity.py {$wavPath}");
$capacity = (int) $output;

if ($capacity === -1) {
    // Not valid
} else {
    // Valid, capacity in bytes
}

"""
