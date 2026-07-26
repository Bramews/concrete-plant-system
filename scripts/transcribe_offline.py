import os
import sys
import json
import urllib.request
import zipfile
import wave
from vosk import Model, KaldiRecognizer

MODEL_URL = "https://huggingface.co/rhasspy/vosk-models/resolve/main/ar/vosk-model-ar-mgb2-0.4.zip"
MODEL_DIR = os.path.join(os.path.dirname(__file__), "vosk-model-ar-mgb2-0.4")
ZIP_PATH = os.path.join(os.path.dirname(__file__), "vosk-model-ar.zip")

def download_model():
    if not os.path.exists(MODEL_DIR):
        if not os.path.exists(ZIP_PATH):
            sys.stderr.write("Downloading Arabic Vosk model... (This is a one-time setup)\n")
            sys.stderr.flush()
            urllib.request.urlretrieve(MODEL_URL, ZIP_PATH)
        sys.stderr.write("Extracting model...\n")
        sys.stderr.flush()
        with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
            zip_ref.extractall(os.path.dirname(MODEL_DIR))
        if os.path.exists(ZIP_PATH):
            os.remove(ZIP_PATH)
        sys.stderr.write("Model downloaded and extracted successfully.\n")
        sys.stderr.flush()

def transcribe(wav_path):
    try:
        download_model()
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Failed to download/extract model: {str(e)}"}, ensure_ascii=False))
        return
    
    if not os.path.exists(wav_path):
        print(json.dumps({"success": False, "error": f"WAV file not found: {wav_path}"}, ensure_ascii=False))
        return

    try:
        wf = wave.open(wav_path, "rb")
        model = Model(MODEL_DIR)
        rec = KaldiRecognizer(model, wf.getframerate())
        
        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            rec.AcceptWaveform(data)
        
        res = json.loads(rec.FinalResult())
        text = res.get("text", "")
        print(json.dumps({"success": True, "text": text}, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Transcription error: {str(e)}"}, ensure_ascii=False))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No WAV file path provided."}, ensure_ascii=False))
        sys.exit(1)
        
    transcribe(sys.argv[1])
