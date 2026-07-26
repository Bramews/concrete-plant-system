import os
import sys
import json
import io
import wave
import urllib.request
import zipfile
from http.server import BaseHTTPRequestHandler, HTTPServer
from vosk import Model, KaldiRecognizer

PORT = 5001
MODEL_URL = "https://huggingface.co/rhasspy/vosk-models/resolve/main/ar/vosk-model-ar-mgb2-0.4.zip"
MODEL_DIR = os.path.join(os.path.dirname(__file__), "vosk-model-ar-mgb2-0.4")
ZIP_PATH = os.path.join(os.path.dirname(__file__), "vosk-model-ar.zip")

# Load model globally on startup to prevent cold-start overhead
global_model = None

# Vocabulary dictionary for restricted grammar recognition
VOCABULARY = [
    # Commands & Actions (Arabic)
    "افتح", "اغلق", "إغلاق", "انشئ", "إنشاء", "طلب", "طلبات", "خلطة", "خلطات", "مكعب", "مكعبات",
    "نتيجة", "نتائج", "تذكرة", "تذاكر", "موافق", "الغاء", "إلغاء", "نعم", "لا", "تفاصيل", "لوحة",
    "المختبر", "الإنتاج", "المستودع", "المبيعات", "التحكم", "شخصية", "تراجع", "مع", "السلامة", "الحاسبة",
    # Math & Operators (Arabic)
    "اجمع", "اطرح", "اضرب", "اقسم", "احسب", "زائد", "ناقص", "في", "على", "يساوي",
    # Numbers (Arabic words & digits)
    "واحد", "اثنان", "ثلاثة", "اربعة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة", "صفر",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    # English commands
    "stop", "close", "exit", "shut", "down", "orders", "production", "lab", "dashboard", "settings",
    "calculate", "add", "subtract", "multiply", "divide", "plus", "minus", "equals"
]

def download_model():
    if not os.path.exists(MODEL_DIR):
        if not os.path.exists(ZIP_PATH):
            sys.stderr.write("Downloading Arabic Vosk model... (One-time setup)\n")
            sys.stderr.flush()
            urllib.request.urlretrieve(MODEL_URL, ZIP_PATH)
        sys.stderr.write("Extracting model...\n")
        sys.stderr.flush()
        with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
            zip_ref.extractall(os.path.dirname(MODEL_DIR))
        if os.path.exists(ZIP_PATH):
            os.remove(ZIP_PATH)
        sys.stderr.write("Model loaded successfully.\n")
        sys.stderr.flush()

class VoiceHTTPHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Silence default request logging to avoid stdout pollution
        pass

    def do_POST(self):
        if self.path == "/transcribe":
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                audio_data = self.rfile.read(content_length)

                if not audio_data or len(audio_data) < 44:
                    self.send_response(400)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": False, "error": "Empty audio data"}, ensure_ascii=False).encode('utf-8'))
                    return

                # Read wav file from memory buffer
                wf = wave.open(io.BytesIO(audio_data), "rb")
                
                # Configure recognizer with custom grammar for high accuracy
                grammar_json = json.dumps(VOCABULARY, ensure_ascii=False)
                rec = KaldiRecognizer(global_model, wf.getframerate(), grammar_json)
                
                while True:
                    data = wf.readframes(4000)
                    if len(data) == 0:
                        break
                    rec.AcceptWaveform(data)

                res = json.loads(rec.FinalResult())
                text = res.get("text", "")

                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "text": text}, ensure_ascii=False).encode('utf-8'))
                
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}, ensure_ascii=False).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

def run():
    global global_model
    try:
        download_model()
        global_model = Model(MODEL_DIR)
        
        server_address = ('127.0.0.1', PORT)
        httpd = HTTPServer(server_address, VoiceHTTPHandler)
        sys.stdout.write(f"Voice Service running on http://127.0.0.1:{PORT}\n")
        sys.stdout.flush()
        httpd.serve_forever()
    except Exception as e:
        sys.stderr.write(f"Failed to start voice service: {str(e)}\n")
        sys.stderr.flush()
        sys.exit(1)

if __name__ == "__main__":
    run()
