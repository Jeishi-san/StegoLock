import sys
import numpy as np
from scipy.io import wavfile

DELIMITER = b'###END###'  # Marks end of payload

def to_bitstream(data_bytes):
    
    """Convert bytes to string of bits."""
    return ''.join(format(byte, '08b') for byte in data_bytes)

def embed_wav(input_wav, output_wav, payload_file):
    # Read WAV
    rate, audio = wavfile.read(input_wav)
    original_shape = audio.shape

    # Ensure 1D array for simplicity (flatten multi-channel)
    audio_flat = audio.flatten()

    # Load payload
    with open(payload_file, "rb") as f:
        payload = f.read() + DELIMITER

    payload_bits = to_bitstream(payload)
    num_bits = len(payload_bits)

    # Capacity check
    if num_bits > len(audio_flat):
        raise Exception(f"Payload too large for this WAV. Max bits: {len(audio_flat)}, required: {num_bits}")

    # Embed bits
    audio_flat_copy = np.copy(audio_flat)
    for i in range(num_bits):
        audio_flat_copy[i] = (audio_flat_copy[i] & ~1) | int(payload_bits[i])

    # Reshape back to original shape
    audio_embedded = audio_flat_copy.reshape(original_shape)

    # Save stego WAV
    wavfile.write(output_wav, rate, audio_embedded)

    print(0) #offset: to be stored in the map of fragment to cover metadata

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python embed.py input.wav output.wav payload.bin")
        sys.exit(1)

    input_wav = sys.argv[1]
    output_wav = sys.argv[2]
    payload_file = sys.argv[3]

    embed_wav(input_wav, output_wav, payload_file)
