import sys
from PIL import Image

SAFETY_PERCENT = 15 #Percentage of LSB capacity to use (default 15%)

# Convert bytes to binary string
def to_binary(data):
    return ''.join(format(byte, '08b') for byte in data)

# Get safe capacity in bytes (with safety margin)
def get_image_safe_capacity(image_path):
    """
    # Returns the image dimensions and safe payload capacity in bytes.

    # :param image_path: Path to image file
    # :return: (width, height, safe_bytes)
    """
    img = Image.open(image_path)
    width, height = img.size

    # Total bits in LSB RGB embedding
    total_bits = width * height * 3

    # Convert to bytes
    total_bytes = total_bits // 8

    # Apply safety factor
    safe_bytes = int(total_bytes * (SAFETY_PERCENT / 100))

    return width, height, safe_bytes

# LSB embedding
def embed(image_path, output_path, data_bytes):
    # Open image
    img = Image.open(image_path)
    img = img.convert('RGB')

    pixels = list(img.getdata())

    # Add delimiter
    DELIMITER = b'###END###'
    data_bytes += DELIMITER
    binary_data = to_binary(data_bytes)

    # Check payload against safe capacity
    _, _, safe_bytes = get_image_safe_capacity(image_path)
    if len(data_bytes) > safe_bytes:
        raise Exception(f"Payload too large! Max safe size: {safe_bytes} bytes")

    binary_data = to_binary(data_bytes)
    data_len = len(binary_data)
    data_index = 0
    new_pixels = []

    # Embed each bit into LSB of R, G, B
    for pixel in pixels:
        r, g, b = pixel

        if data_index < data_len:
            r = (r & ~1) | int(binary_data[data_index])
            data_index += 1

        if data_index < data_len:
            g = (g & ~1) | int(binary_data[data_index])
            data_index += 1

        if data_index < data_len:
            b = (b & ~1) | int(binary_data[data_index])
            data_index += 1

        new_pixels.append((r, g, b))

    img.putdata(new_pixels)
    img.save(output_path)

    print(0) #offset: to be stored in the map of fragment to cover metadata

# CLI execution
if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python embed.py <input_image> <output_image> <data_file>")
        sys.exit(1)

    input_image = sys.argv[1]
    output_image = sys.argv[2]
    data_file = sys.argv[3]

    with open(data_file, "rb") as f:
        data = f.read()

    try:
        embed(input_image, output_image, data)
        print(f"Embedding successful! Output: {output_image}")
    except Exception as e:
        print(f"Embedding failed: {e}")
        sys.exit(1)
