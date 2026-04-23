import sys
from PIL import Image

# Constants — must match embed.py
DELIMITER = b'###END###'

# Convert binary string to bytes
def to_bytes(binary_str):
    all_bytes = [binary_str[i:i+8] for i in range(0, len(binary_str), 8)]
    return bytes(int(b, 2) for b in all_bytes)

# Extract payload from image LSB
def extract(image_path):
    img = Image.open(image_path)
    img = img.convert('RGB')
    pixels = list(img.getdata())

    binary_data = ""

    # Read LSB from R, G, B channels
    for pixel in pixels:
        r, g, b = pixel
        binary_data += str(r & 1)
        binary_data += str(g & 1)
        binary_data += str(b & 1)

    # Convert binary to bytes
    data_bytes = to_bytes(binary_data)

    # Find delimiter
    end_index = data_bytes.find(DELIMITER)
    if end_index == -1:
        raise Exception("Delimiter not found — extraction failed")

    # Return payload up to delimiter
    return data_bytes[:end_index]

# CLI execution
if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python extract.py <stego_image> <output_file>")
        sys.exit(1)

    stego_image = sys.argv[1]
    output_file = sys.argv[2]

    try:
        payload = extract(stego_image)
        with open(output_file, "wb") as f:
            f.write(payload)
        print(f"Extraction successful! Payload saved to {output_file}")
    except Exception as e:
        print(f"Extraction failed: {e}")
        sys.exit(1)
