import sys
from PIL import Image

USAGE_RATIO = 0.15

def get_png_embedding_capacity(image_path):
    """
    Validates PNG image for LSB embedding and returns usable and total capacity (in bytes).

    Conditions:
    - Must be PNG
    - Must be RGB or RGBA

    Returns:
    - (usable_bytes, total_bytes) if valid
    - (-1, -1) if not valid
    """

    try:
        # --- Open image ---
        img = Image.open(image_path)

        # --- Validate format ---
        if img.format != 'PNG':
            return -1, -1

        # --- Validate mode ---
        if img.mode not in ['RGB', 'RGBA']:
            return -1, -1

        width, height = img.size

        # --- Determine channels ---
        channels = len(img.getbands())  # RGB=3, RGBA=4

        # --- Compute capacity ---
        total_pixels = width * height
        total_bits = total_pixels * channels  # 1 LSB per channel
        total_bytes = total_bits // 8

        usable_bits = int(total_bits * USAGE_RATIO)
        usable_bytes = (usable_bits // 8) - 9 # Subtract 9 bytes for delimiter '###END###'

        return max(0, usable_bytes), total_bytes

    except Exception:
        return -1, -1


# ------------------- CLI execution -------------------
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python get_png_capacity.py <image_path>")
        sys.exit(1)

    image_path = sys.argv[1]

    usable, total = get_png_embedding_capacity(image_path)
    print(f"{usable},{total}")
