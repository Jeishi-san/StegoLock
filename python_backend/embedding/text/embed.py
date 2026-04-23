import sys
import random

def to_binary(data):
    return ''.join(format(byte, '08b') for byte in data)

def from_binary(binary_str):
    bytes_list = [int(binary_str[i:i+8], 2) for i in range(0, len(binary_str), 8)]
    return bytes(bytes_list)

def embed(input_text_file, output_text_file, data_file):
    with open(input_text_file, 'rb') as f:
        cover_bytes = bytearray(f.read())

    with open(data_file, 'rb') as f:
        payload_bytes = f.read()

    # Add delimiter so we know where the payload ends
    delimiter = b'###END###'
    payload_bytes += delimiter

    binary_payload = to_binary(payload_bytes)

    cover_len = len(cover_bytes)
    payload_len = len(binary_payload)

    if payload_len > cover_len:
        raise Exception("Payload too large for this text file!")

    max_offset = cover_len - payload_len
    offset = random.randint(0, max_offset)

    # Embed payload
    for i in range(len(binary_payload)):
        cover_bytes[offset + i] = (cover_bytes[offset + i] & ~1) | int(binary_payload[i])

    with open(output_text_file, 'wb') as f:
        f.write(cover_bytes)

    print(offset) #to be stored in the map of fragment to cover metadata

if __name__ == "__main__":
    embed(sys.argv[1], sys.argv[2], sys.argv[3])
