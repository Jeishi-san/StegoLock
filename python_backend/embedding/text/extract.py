import sys

def to_binary(data):
    return ''.join(format(byte, '08b') for byte in data)

"""
def from_binary(binary_str):
    bytes_list = [binary_str[i:i+8] for i in range(0, len(binary_str), 8)]
    return bytes(bytearray(int(b, 2) for b in bytes_list))
"""

def from_binary(binary_string):
    """Convert a binary string to bytes."""
    bytes_list = []
    for i in range(0, len(binary_string), 8):
        byte = binary_string[i:i+8]
        if len(byte) < 8:
            break
        bytes_list.append(int(byte, 2))
    return bytes(bytes_list)

def extract(stego_file, output_file, offset):
    """
    Extract payload from stego text file starting at offset.

    :param stego_file: path to the embedded text
    :param output_file: path to write extracted payload
    :param payload_length_bytes: number of bytes in the original payload including delimiter
    :param offset: starting index in the cover file
    """
    delimiter = b'###STEGOLOCK###'

    with open(stego_file, 'rb') as f:
        stego_bytes = bytearray(f.read())

    extracted_bits = []

    # Start extracting from the offset
    for byte in stego_bytes[offset:]:
        extracted_bits.append(str(byte & 1))  # get LSB

    # Convert bits to bytes
    binary_string = ''.join(extracted_bits)
    recovered_bytes = from_binary(binary_string)

    # Stop at delimiter
    delimiter_index = recovered_bytes.find(delimiter)
    if delimiter_index == -1:
        raise Exception("Delimiter not found — extraction failed or wrong offset!")

    recovered_payload = recovered_bytes[:delimiter_index]

    # Write recovered fragment
    with open(output_file, 'wb') as f:
        f.write(recovered_payload)

    print(f"Extraction successful: {len(recovered_payload)} bytes recovered")

if __name__ == "__main__":
    # Arguments: stego_file, output_file, offset
    stego_file = sys.argv[1]
    output_file = sys.argv[2]
    offset = int(sys.argv[3])

    extract(stego_file, output_file, offset)
