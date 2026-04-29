import sys
import json
import os
import importlib.util

# Dynamically import the extractors to avoid circular dependencies or path issues
def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

# Load the core extractors
TEXT_EXTRACTOR = load_module("text_extract", os.path.join(os.path.dirname(__file__), "embedding/text/extract.py"))
IMAGE_EXTRACTOR = load_module("image_extract", os.path.join(os.path.dirname(__file__), "embedding/image/extract.py"))
AUDIO_EXTRACTOR = load_module("audio_extract", os.path.join(os.path.dirname(__file__), "embedding/audio/extract.py"))

def process_batch(manifest_path):
    with open(manifest_path, 'r') as f:
        manifest = json.load(f)

    results = []
    
    for item in manifest:
        try:
            file_type = item['type']
            stego_path = item['stego_path']
            output_path = item['output_path']
            
            if file_type == 'txt':
                offset = int(item.get('offset', 0))
                TEXT_EXTRACTOR.extract(stego_path, output_path, offset)
            elif file_type in ['png', 'jpg', 'jpeg']:
                # Image extractor returns the payload instead of writing it
                payload = IMAGE_EXTRACTOR.extract(stego_path)
                with open(output_path, "wb") as f:
                    f.write(payload)
            elif file_type in ['mp3', 'wav']:
                # Audio extractor uses extract_wav function name
                AUDIO_EXTRACTOR.extract_wav(stego_path, output_path)
            else:
                raise ValueError(f"Unsupported file type: {file_type}")
            
            results.append({"id": item['id'], "status": "success"})
        except Exception as e:
            results.append({"id": item['id'], "status": "error", "message": str(e)})

    # Print results as JSON for PHP to consume - MUST BE LAST LINE
    print(json.dumps(results))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No manifest provided"}))
        sys.exit(1)
    
    process_batch(sys.argv[1])
