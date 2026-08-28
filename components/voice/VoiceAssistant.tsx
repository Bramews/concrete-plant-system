"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Mic,
  Volume2,
  Activity,
  Settings,
  Clock,
  User,
  WifiOff,
  ChevronUp,
  ChevronDown,
  Check,
  RefreshCw,
  X,
} from "lucide-react";
import { VoiceProcessor } from "@/lib/voice/processor";
import {
  VOICE_CHARACTERS,
  VOICE_LANGUAGES,
  getVoiceMessage,
  VoiceCharacter,
} from "@/lib/voice/languages";
import {
  saveVoiceLogAction,
  getVoiceLogsAction,
  getVoiceContextAction,
  saveVoiceContextAction,
  processVoiceCommand,
} from "@/app/actions/voice";
import { usePreferences } from "@/context/PreferenceContext";
import { toast } from "sonner";
import { flattenArray, createWavBlob } from "@/lib/voice/wav-encoder";

export function VoiceAssistant() {
  const pathname = usePathname();
  const router = useRouter();
  const { preferences } = usePreferences();
  const lang = preferences.language || "ar";

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Character State
  const [character, setCharacter] = useState<VoiceCharacter>(
    VOICE_CHARACTERS.saleh,
  );

  // UI Tabs & Toggles
  const [showSettings, setShowSettings] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [voiceLogs, setVoiceLogs] = useState<any[]>([]);
  const [continuousMode, setContinuousMode] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const updateVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  // Audio References
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // Offline recording refs
  const recordingBuffersRef = useRef<Float32Array[]>([]);
  const recordingLengthRef = useRef<number>(0);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const isOfflineRecordingRef = useRef<boolean>(false);
  const isOfflineModeRef = useRef<boolean>(false);
  const handleCommandRef = useRef<any>(null);

  // Initialize and load context
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }

    // Load saved context from local JSON config on server
    const loadContext = async () => {
      try {
        const res = await getVoiceContextAction();
        if (res.success && res.context) {
          const charId = res.context.currentCharacter;
          if (VOICE_CHARACTERS[charId]) {
            setCharacter(VOICE_CHARACTERS[charId]);
          }
        }
      } catch (err) {
        console.error("Failed to load local voice context:", err);
      }
    };
    loadContext();

    return () => {
      cleanupAudio();
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const cleanupAudio = () => {
    if (animationFrameRef.current)
      cancelAnimationFrame(animationFrameRef.current);
    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
      } catch (e) {
        console.error("[المساعد الصوتي] تعذر فصل معالج الصوت:", e);
      }
      scriptProcessorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  // Fetch Voice Logs Timeline
  const fetchLogs = async () => {
    try {
      const res = await getVoiceLogsAction();
      if (res.success && res.logs) {
        setVoiceLogs(res.logs);
      }
    } catch (err) {
      console.error("Failed to fetch voice logs:", err);
    }
  };

  useEffect(() => {
    if (showLogs) {
      fetchLogs();
    }
  }, [showLogs]);

  // Audio Waveform visualizer
  const drawWaveform = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isListening) return;
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current?.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#818cf8"; // Indigo-400
      ctx.lineCap = "round";
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };
    draw();
  }, [isListening]);

  // TTS Speech Synthesis helper
  const speakResponse = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window)) return;

      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      setIsSpeaking(false);

      const utterance = new SpeechSynthesisUtterance(text);
      // Dynamically set language from current preferences
      utterance.lang = VOICE_LANGUAGES[lang]?.synthesisLang || "ar-SA";

      // Configure voice properties based on active character
      utterance.rate = character.voiceRate;
      utterance.pitch = character.voicePitch;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      // Optional: try to find a native voice matches character gender/tone
      if (voices.length > 0) {
        const targetLang = VOICE_LANGUAGES[lang]?.synthesisLang || "ar-SA";

        // Filter voices by locale
        const filtered = voices.filter((v) =>
          v.lang
            .toLowerCase()
            .replace("_", "-")
            .startsWith(targetLang.split("-")[0].toLowerCase()),
        );

        if (filtered.length > 0) {
          if (character.tone === "friendly" && filtered.length > 1) {
            // Typically friendly matches female/pitch high
            utterance.voice =
              filtered.find((v) => {
                const name = v.name.toLowerCase();
                return (
                  name.includes("female") ||
                  name.includes("zira") ||
                  name.includes("samantha") ||
                  name.includes("hoda") ||
                  name.includes("laila") ||
                  name.includes("leila")
                );
              }) || filtered[0];
          } else {
            utterance.voice =
              filtered.find((v) => {
                const name = v.name.toLowerCase();
                return (
                  name.includes("male") ||
                  name.includes("david") ||
                  name.includes("maged") ||
                  name.includes("tarik") ||
                  name.includes("naayef")
                );
              }) || filtered[0];
          }
        }
      }

      window.speechSynthesis.speak(utterance);
    },
    [character, lang, voices],
  );

  const cancelSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const cancelAll = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    isOfflineRecordingRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("[المساعد الصوتي] تعذر إيقاف التعرف على الصوت:", e);
      }
    }
    setIsListening(false);
    setIsProcessing(false);
    setTranscript("");
    cleanupAudio();
  }, []);

  // Handler for custom local characters selection
  const selectCharacter = async (charKey: string) => {
    const char = VOICE_CHARACTERS[charKey];
    if (!char) return;
    setCharacter(char);

    // Save to local context JSON
    await saveVoiceContextAction({ currentCharacter: charKey });

    const greeting = lang === "ar" ? char.greetingAr : char.greetingEn;
    toast.success(
      lang === "ar"
        ? `تم اختيار شخصية ${char.nameAr}`
        : `Selected ${char.nameEn}`,
    );
    speakResponse(greeting);
  };

  // Start offline recording using Web Audio API
  const startOfflineRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      analyserRef.current = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      recordingBuffersRef.current = [];
      recordingLengthRef.current = 0;

      processor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        recordingBuffersRef.current.push(new Float32Array(input));
        recordingLengthRef.current += input.length;
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      isOfflineRecordingRef.current = true;
      setIsListening(true);
      setTranscript(
        lang === "ar"
          ? "تسجيل محلي (تحدث الآن)..."
          : "Local recording (speak now)...",
      );

      setTimeout(() => drawWaveform(), 100);
    } catch (err) {
      console.error("Offline recording access denied", err);
      toast.error(
        lang === "ar"
          ? "يرجى تفعيل صلاحيات الميكروفون"
          : "Please enable microphone permission",
      );
    }
  }, [drawWaveform, lang]);

  // Fallback to online/global speech recognition if local fails
  const startOnlineListening = useCallback(async () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error(
        lang === "ar"
          ? "محرك المتصفح للتعرف على الصوت غير مدعوم"
          : "Browser speech recognition not supported",
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      setIsListening(true);
      setTranscript(
        lang === "ar"
          ? "جاري الاستماع للطلب عبر الإنترنت..."
          : "Listening online...",
      );

      setTimeout(() => drawWaveform(), 100);
    } catch (err) {
      console.error("Audio access denied", err);
      toast.error(
        lang === "ar"
          ? "يرجى تفعيل صلاحيات الميكروفون"
          : "Please enable microphone permission",
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = VOICE_LANGUAGES[lang]?.recognitionLang || "ar-SA";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event: any) => {
      const command = event.results[0][0].transcript;
      setTranscript(command);
      setIsProcessing(true);
      await handleCommandRef.current?.(command);
      setIsProcessing(false);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      cleanupAudio();
      if (event.error !== "no-speech") {
        const errMsg = getVoiceMessage(lang, "error");
        toast.error(errMsg);
        speakResponse(errMsg);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      cleanupAudio();
    };

    recognition.start();
  }, [drawWaveform, lang, speakResponse]);

  // Start listening (Click command) - Prioritizing Local Offline mode first
  const startListening = useCallback(async () => {
    cancelAll();
    await startOfflineRecording();
  }, [cancelAll, startOfflineRecording]);

  // Stop listening
  const stopListening = useCallback(async () => {
    if (isOfflineRecordingRef.current) {
      isOfflineRecordingRef.current = false;
      setIsListening(false);

      if (scriptProcessorRef.current) {
        try {
          scriptProcessorRef.current.disconnect();
        } catch (e) {
          console.error("[المساعد الصوتي] تعذر فصل معالج الصوت عند إيقاف الاستماع:", e);
        }
        scriptProcessorRef.current = null;
      }

      const buffers = [...recordingBuffersRef.current];
      const length = recordingLengthRef.current;
      const sampleRate = audioContextRef.current?.sampleRate || 16000;

      cleanupAudio();

      if (length === 0) {
        toast.error(
          lang === "ar" ? "لم يتم التقاط أي صوت" : "No sound captured",
        );
        return;
      }

      setIsProcessing(true);
      setTranscript(
        lang === "ar"
          ? "جاري التعرف الصوتي المحلي..."
          : "Transcribing locally...",
      );

      try {
        const flatSamples = flattenArray(buffers, length);
        const wavBlob = createWavBlob(flatSamples, sampleRate);

        const formData = new FormData();
        formData.append("file", wavBlob, "voice.wav");

        const res = await fetch("/api/voice/transcribe", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (data.success && data.text) {
          setTranscript(data.text);
          await handleCommandRef.current?.(data.text);
        } else {
          // Fallback to online internet speech recognition if local fails
          toast.info(
            lang === "ar"
              ? "فشل التعرف المحلي. جاري المحاولة عبر الإنترنت..."
              : "Local transcription failed. Trying online recognition...",
          );
          await startOnlineListening();
        }
      } catch (err) {
        console.error("Local offline transcription failed:", err);
        // Fallback to online internet speech recognition if local connection fails
        toast.info(
          lang === "ar"
            ? "فشل الاتصال المحلي. جاري المحاولة عبر الإنترنت..."
            : "Local connection failed. Trying online recognition...",
        );
        await startOnlineListening();
      } finally {
        setIsProcessing(false);
      }
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      cleanupAudio();
    }
  }, [lang, speakResponse, startOnlineListening]);

  // Main command interpreter logic
  const handleCommand = async (text: string) => {
    const cleanText = text.toLowerCase().trim();

    // 1. Manual close command detection
    const closePhrases = [
      "إغلاق",
      "إنهاء",
      "مع السلامة",
      "اغلق",
      "انهاء",
      "stop",
      "close",
      "exit",
      "shut down",
    ];
    if (
      closePhrases.some(
        (phrase) => cleanText === phrase || cleanText.includes(phrase),
      )
    ) {
      const farewell =
        lang === "ar"
          ? "مع السلامة، تم إغلاق المساعد."
          : "Goodbye, shutting down.";
      speakResponse(farewell);
      toast(farewell);
      stopListening();

      await saveVoiceLogAction(text, farewell, true, character.id, lang);
      return;
    }

    // 2. Process Client-side Navigation Intents
    const intent = await VoiceProcessor.process(text, pathname);
    if (intent) {
      toast.success(intent.feedback, {
        icon: <Volume2 className="w-4 h-4 text-indigo-400" />,
        duration: 6000,
      });
      speakResponse(intent.feedback);

      // Save Log
      await saveVoiceLogAction(text, intent.feedback, true, character.id, lang);

      // Standard single task: Close microphone immediately
      stopListening();

      if (!intent.isQuery) {
        setTimeout(() => {
          if (intent.action) intent.action();
        }, 1500);
      }
      return;
    }

    // 3. Process Server-side DB Actions and Queries
    try {
      const result = (await processVoiceCommand(text)) as any;
      if (result.success && result.response) {
        toast.success(result.response, { duration: 6000 });
        speakResponse(result.response);

        // Save Log
        await saveVoiceLogAction(
          text,
          result.response,
          true,
          character.id,
          lang,
        );

        // Execute clientAction if present
        if (result.clientAction) {
          setTimeout(() => {
            if (result.clientAction.type === "NAVIGATE") {
              router.push(result.clientAction.target);
            } else if (result.clientAction.type === "TOGGLE_SIDEBAR") {
              const btn = document.querySelector(
                '[aria-label="Toggle Sidebar"]',
              ) as HTMLButtonElement;
              if (btn) btn.click();
            } else if (result.clientAction.type === "REFRESH") {
              window.location.reload();
            } else if (result.clientAction.type === "TRACK_TRUCK") {
              const truckNum = result.clientAction.truckNumber;
              router.push(
                `/system/operator/material-status?truck=${encodeURIComponent(truckNum)}`,
              );
            }
          }, 1500);
        }

        // Standard single task / order execution: Close microphone immediately unless continuousMode is on
        const isSingleTask =
          result.isAction ||
          result.response.includes("تم") ||
          result.response.includes("نجاح") ||
          result.clientAction;
        if (isSingleTask && !continuousMode) {
          stopListening();
        } else if (continuousMode) {
          // If continuous, restart recognition after speaking finishes
          const checkSpeakingDone = setInterval(() => {
            if (
              typeof window !== "undefined" &&
              window.speechSynthesis &&
              !window.speechSynthesis.speaking
            ) {
              clearInterval(checkSpeakingDone);
              setTimeout(() => {
                if (!isListening) startListening();
              }, 1500);
            }
          }, 500);
        }
      } else {
        const notUnderstoodMsg = getVoiceMessage(lang, "notUnderstood");
        toast.error(result.response || notUnderstoodMsg);
        speakResponse(result.response || notUnderstoodMsg);

        // Save Log
        await saveVoiceLogAction(
          text,
          result.response || notUnderstoodMsg,
          false,
          character.id,
          lang,
        );

        if (!continuousMode) {
          stopListening();
        }
      }
    } catch (error) {
      console.error("Voice execution failed:", error);
      const errMsg = getVoiceMessage(lang, "error");
      toast.error(errMsg);
      speakResponse(errMsg);

      await saveVoiceLogAction(text, errMsg, false, character.id, lang);
      stopListening();
    }
  };

  handleCommandRef.current = handleCommand;

  if (!isSupported) return null;

  return (
    <div
      className="fixed bottom-8 left-8 z-[100] flex flex-col items-start gap-3"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      {/* 1. Status Bubble and Waveform Visualizer */}
      {(isListening || isProcessing) && (
        <div className="mb-2 glass-panel p-5 rounded-[28px] border border-white/10 animate-in fade-in slide-in-from-bottom-8 min-w-[280px] max-w-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl bg-slate-950/80">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${isProcessing ? "bg-amber-500 animate-pulse" : "bg-indigo-500 animate-ping"}`}
              />
              <p className="text-xs font-bold text-slate-400 font-mono tracking-wider uppercase">
                {isProcessing
                  ? lang === "ar"
                    ? "جاري معالجة الطلب..."
                    : "AI PROCESSING..."
                  : lang === "ar"
                    ? "استماع مباشر"
                    : "LIVE LISTENING..."}
              </p>
            </div>
            <Activity
              className={`w-3.5 h-3.5 text-indigo-500/60 ${isListening ? "animate-pulse" : ""}`}
            />
          </div>

          {/* Waveform Canvas */}
          {isListening && (
            <div className="relative h-10 w-full mb-4 bg-white/5 rounded-xl overflow-hidden border border-white/5">
              <canvas
                ref={canvasRef}
                width={260}
                height={40}
                className="w-full h-full"
              />
            </div>
          )}

          <p className="text-sm font-bold text-white leading-relaxed text-center italic opacity-95 px-1 line-clamp-3">
            &quot;{transcript}&quot;
          </p>
        </div>
      )}

      {/* 2. Controls Row */}
      <div className="flex items-center gap-3">
        {/* Main Microphone Button */}
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={isProcessing}
          className={`relative group w-16 h-16 rounded-[24px] flex items-center justify-center transition-all duration-700 shadow-2xl overflow-hidden ${
            isListening
              ? "bg-rose-500 shadow-rose-500/40 rotate-90 scale-105 !rounded-full"
              : isProcessing
                ? "bg-indigo-600 animate-pulse"
                : "bg-slate-900 border border-white/10 hover:border-indigo-500/50 hover:bg-slate-800 shadow-indigo-500/10 hover:rounded-[28px]"
          }`}
        >
          {isListening && (
            <span className="absolute inset-0 rounded-full border-4 border-rose-500/30 animate-ping" />
          )}

          {isProcessing ? (
            <div className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
            </div>
          ) : isListening ? (
            <Mic className="w-7 h-7 text-white -rotate-90 animate-pulse" />
          ) : (
            <div className="relative group-hover:scale-105 transition-transform duration-500">
              <Mic className="w-7 h-7 text-slate-400 group-hover:text-indigo-400 transition-colors" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border-4 border-slate-900 shadow-lg animate-pulse" />
            </div>
          )}

          {/* Glowing ring */}
          {!isListening && !isProcessing && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
            </span>
          )}
        </button>

        {/* Cancel/Close Button */}
        {(isListening || isProcessing || isSpeaking) && (
          <button
            onClick={cancelAll}
            className="w-16 h-16 rounded-[24px] bg-slate-900 border border-white/10 hover:border-rose-500/50 hover:bg-slate-800 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-all duration-300 shadow-2xl animate-in zoom-in duration-300"
            title={lang === "ar" ? "إلغاء وإغلاق" : "Cancel & Close"}
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}
