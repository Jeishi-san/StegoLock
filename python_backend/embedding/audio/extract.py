import sys
import numpy as np
from scipy.io import wavfile

DELIMITER = b'###STEGOLOCK###'

def bits_to_bytes(bits):
    """Convert bit string to bytes"""
    byte_list = [bits[i:i+8] for i in range(0, len(bits), 8)]
    return bytes([int(b, 2) for b in byte_list])

def extract_wav(input_wav, output_file):
    rate, audio = wavfile.read(input_wav)
    audio_flat = audio.flatten()

    bits = ""
    for sample in audio_flat:
        bits += str(sample & 1)

    # Convert bits to bytes
    all_bytes = bits_to_bytes(bits)

    # Look for delimiter
    delimiter_index = all_bytes.find(DELIMITER)
    if delimiter_index == -1:
        raise Exception("Delimiter not found. Extraction failed.")

    payload = all_bytes[:delimiter_index]

    # Save extracted fragment
    with open(output_file, "wb") as f:
        f.write(payload)

    print(f"Extraction complete: {output_file}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python extract.py input_stego.wav output_fragment.bin")
        sys.exit(1)

    input_wav = sys.argv[1]
    output_file = sys.argv[2]

    extract_wav(input_wav, output_file)
