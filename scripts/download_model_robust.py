import os
import sys
import time
import urllib.request
import zipfile

# Try Alphacephei first because it's direct and supports Range requests, fallback to Hugging Face
URLS = [
    "https://alphacephei.com/vosk/models/vosk-model-ar-mgb2-0.4.zip",
    "https://huggingface.co/rhasspy/vosk-models/resolve/main/ar/vosk-model-ar-mgb2-0.4.zip"
]
ZIP_PATH = os.path.join(os.path.dirname(__file__), "vosk-model-ar.zip")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "vosk-model-ar-mgb2-0.4")
EXPECTED_SIZE = 333241610

def download_file(url, filepath):
    headers = {"User-Agent": "Mozilla/5.0"}
    
    # Check if we can resume
    downloaded = 0
    if os.path.exists(filepath):
        downloaded = os.path.getsize(filepath)
        if downloaded >= EXPECTED_SIZE:
            print("File is already fully downloaded.")
            return True
        
    print(f"Downloading {url} to {filepath}...")
    if downloaded > 0:
        print(f"Resuming download from {downloaded} bytes...")
        headers["Range"] = f"bytes={downloaded}-"
        
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            # Check response code
            status = response.status
            content_length = int(response.headers.get('content-length', 0))
            
            # If server doesn't support range or returns full file
            if status == 200:
                mode = 'wb'
                total_size = content_length
                downloaded = 0
            elif status == 206:
                mode = 'ab'
                total_size = content_length + downloaded
            else:
                mode = 'wb'
                total_size = content_length
                downloaded = 0
                
            with open(filepath, mode) as f:
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
            print("\nDownload completed/resumed successfully.")
            return True
    except Exception as e:
        print(f"\nError: {e}")
        return False

def download_with_retry():
    max_retries = 20
    for attempt in range(max_retries):
        url = URLS[attempt % len(URLS)]
        print(f"\n[Attempt {attempt+1}/{max_retries}] Using URL: {url}")
        success = download_file(url, ZIP_PATH)
        if success:
            actual_size = os.path.getsize(ZIP_PATH)
            if actual_size == EXPECTED_SIZE:
                print("Download fully verified.")
                return True
            else:
                print(f"Warning: File size is {actual_size}, expected {EXPECTED_SIZE}. Retrying...")
        time.sleep(3)
    return False

def main():
    if not os.path.exists(MODEL_DIR):
        success = download_with_retry()
        if not success:
            print("Failed to download model after multiple retries.")
            sys.exit(1)
            
        print("Extracting model...")
        try:
            with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
                zip_ref.extractall(os.path.dirname(MODEL_DIR))
            if os.path.exists(ZIP_PATH):
                os.remove(ZIP_PATH)
            print("Model downloaded and extracted successfully.")
        except Exception as e:
            print(f"Extraction failed: {e}")
            if os.path.exists(ZIP_PATH):
                os.remove(ZIP_PATH)
            sys.exit(1)
    else:
        print("Model already exists.")

if __name__ == "__main__":
    main()
