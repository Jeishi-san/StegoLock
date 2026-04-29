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
    channels = len(img.getbands()) # RGB=3, RGBA=4

    # Total bits in LSB embedding
    total_bits = width * height * channels

    # Convert to bytes
    total_bytes = total_bits // 8

    # Apply safety factor
    safe_bytes = int(total_bytes * (SAFETY_PERCENT / 100))

    return width, height, safe_bytes

# LSB embedding
def embed(image_path, output_path, data_bytes):
    # Open image
    img = Image.open(image_path)
    # Support both RGB and RGBA
    if img.mode not in ['RGB', 'RGBA']:
        img = img.convert('RGB')
    
    mode = img.mode
    channels = len(img.getbands())
    width, height = img.size

    # Add delimiter
    DELIMITER = b'###STEGOLOCK###'
    full_payload = data_bytes + DELIMITER
    binary_data = to_binary(full_payload)
    data_len = len(binary_data)

    # Check payload against safe capacity
    # Important: Subtract delimiter size from safe_bytes check or include it in length
    _, _, safe_bytes = get_image_safe_capacity(image_path)
    
    if len(data_bytes) > safe_bytes:
        raise Exception(f"Payload too large! Max safe size: {safe_bytes} bytes")

    px = img.load()
    data_index = 0

    # Embed each bit into LSB of each channel
    for y in range(height):
        for x in range(width):
            if data_index >= data_len:
                break
            
            pixel = list(px[x, y])
            for c in range(channels):
                if data_index < data_len:
                    pixel[c] = (pixel[c] & ~1) | int(binary_data[data_index])
                    data_index += 1
            
            px[x, y] = tuple(pixel)
        
        if data_index >= data_len:
            break

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
