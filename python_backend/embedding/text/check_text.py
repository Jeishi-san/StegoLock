import sys

USAGE_RATIO = 0.02
MIN_CHARS = 100

def get_txt_embedding_capacity(file_path):
    """
    Validates TXT file for LSB-like text embedding and returns usable and total capacity.

    Conditions:
    - Must be .txt
    - Must be UTF-8 decodable
    - Must meet minimum size

    Returns:
    - (usable_bytes, total_bytes) if valid
    - (-1, -1) if not valid
    """

    try:
        # --- Validate extension ---
        if not file_path.lower().endswith('.txt'):
            return -1, -1

        # --- Read file safely ---
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        total_chars = len(content)

        # --- Reject small files ---
        if total_chars < MIN_CHARS:
            return -1, -1

        # --- Capacity ---
        total_bits = total_chars  # 1 bit per char position
        total_bytes = total_bits // 8

        usable_bits = int(total_bits * USAGE_RATIO)
        usable_bytes = usable_bits // 8

        return usable_bytes, total_bytes

    except Exception:
        return -1, -1


# ------------------- CLI execution -------------------
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python get_txt_capacity.py <file_path>")
        sys.exit(1)

    file_path = sys.argv[1]

    usable, total = get_txt_embedding_capacity(file_path)
    print(f"{usable},{total}")
