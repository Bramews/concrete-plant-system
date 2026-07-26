import os
import sys
import time
import urllib.request
import zipfile

MODEL_URL = "https://huggingface.co/rhasspy/vosk-models/resolve/main/ar/vosk-model-ar-mgb2-0.4.zip"
ZIP_PATH = os.path.join(os.path.dirname(__file__), "vosk-model-ar.zip")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "vosk-model-ar-mgb2-0.4")

def download_with_retry():
    print(f"Downloading model from {MODEL_URL}...")
    headers = {"User-Agent": "Mozilla/5.0"}
    
    max_retries = 5
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(MODEL_URL, headers=headers)
            with urllib.request.urlopen(req) as response:
                total_size = int(response.headers.get('content-length', 0))
                downloaded = 0
                
                with open(ZIP_PATH, 'wb') as f:
                    while True:
                        chunk = response.read(65536)
                        if not chunk:
                            break
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total_size > 0:
                            percent = (downloaded / total_size) * 100
                            sys.stdout.write(f"\rProgress: {percent:.2f}% ({downloaded}/{total_size} bytes)")
                            sys.stdout.flush()
                print("\nDownload finished.")
                return True
        except Exception as e:
            print(f"\nAttempt {attempt+1} failed: {e}. Retrying in 5 seconds...")
            time.sleep(5)
            
    return False

def main():
    if not os.path.exists(MODEL_DIR):
        if not os.path.exists(ZIP_PATH):
            success = download_with_retry()
            if not success:
                print("Failed to download model after retries.")
                sys.exit(1)
        else:
            print("Found existing ZIP file. Skipping download.")
            
        print("Extracting model...")
        with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
            zip_ref.extractall(os.path.dirname(MODEL_DIR))
            
        if os.path.exists(ZIP_PATH):
            os.remove(ZIP_PATH)
        print("Model downloaded and extracted successfully.")
    else:
        print("Model already exists.")

if __name__ == "__main__":
    main()
