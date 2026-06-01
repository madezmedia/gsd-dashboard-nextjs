"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, RefreshCw, Settings2, Terminal as TerminalIcon, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { acmiCall } from "@/lib/acmi-client";

interface TranscribedLine {
  id: string;
  timestamp: string;
  speaker: "AGENT" | "USER" | "SYSTEM";
  text: string;
  correlationId: string;
}

const DEFAULT_LOGS: TranscribedLine[] = [
  {
    id: "log-1",
    timestamp: "11:40:02",
    speaker: "SYSTEM",
    text: "ACMI Voice channel proxy online. Binding to Deepgram Nova-2 cluster...",
    correlationId: "voiceInit-1716910802000",
  },
  {
    id: "log-2",
    timestamp: "11:40:05",
    speaker: "AGENT",
    text: "ACMI Fleet Agent Bentley standing by. Voice streaming channels synchronized.",
    correlationId: "agentReady-1716910805000",
  },
];

interface CopilotResponseParams {
  query: string;
  groqApiKey: string;
  addSystemLog: (msg: string) => void;
  stopSpeaking: () => void;
  setTranscripts: React.Dispatch<React.SetStateAction<TranscribedLine[]>>;
  queueSpeech: (text: string) => void;
}

async function triggerCopilotResponseOutside({
  query,
  groqApiKey,
  addSystemLog,
  stopSpeaking,
  setTranscripts,
  queueSpeech,
}: CopilotResponseParams) {
  addSystemLog("Posting speech payload to Next.js LLM edge router...");
  stopSpeaking();

  // Emit live voice query event to the ACMI Super Bus
  try {
    await acmiCall("acmi_event", {
      namespace: "thread",
      id: "agent-coordination",
      source: "user:admin",
      kind: "voice-input",
      summary: `[voice-input] User spoke query: "${query}"`,
      correlationId: `voiceInput-${Date.now()}`,
    });
  } catch (e) {
    console.error("Bus emit error:", e);
  }

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-groq-api-key": groqApiKey,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: query }],
      }),
    });

    if (!res.ok) {
      addSystemLog("ERROR: Next.js Copilot router returned connection error.");
      return;
    }

    if (!res.body) {
      addSystemLog("ERROR: Response stream returned null.");
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let fullResponseText = "";
    let sentenceBuffer = "";

    // Add placeholder agent line
    const agentTs = Date.now();
    const time = new Date().toTimeString().split(" ")[0];
    setTranscripts((prev) => [
      ...prev,
      {
        id: `agt-${agentTs}`,
        timestamp: time,
        speaker: "AGENT",
        text: "",
        correlationId: `voiceAgent-${agentTs}`,
      },
    ]);

    while (!done) {
      const { value, done: isDone } = await reader.read();
      done = isDone;
      if (value) {
        const text = decoder.decode(value);
        fullResponseText = fullResponseText + text;
        sentenceBuffer = sentenceBuffer + text;

        // Update typewriter console UI text in real-time
        setTranscripts((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last && last.speaker === "AGENT") {
            last.text = fullResponseText;
          }
          return copy;
        });

        // Match complete sentences using lookbehind for sentence dividers
        const sentences = sentenceBuffer.split(/(?<=[.?!])\s+/);
        if (sentences.length > 1) {
          const completeSentences = sentences.slice(0, -1);
          sentenceBuffer = sentences[sentences.length - 1] || "";

          for (const s of completeSentences) {
            const cleanSentence = s.trim();
            if (cleanSentence) {
              queueSpeech(cleanSentence);
            }
          }
        }
      }
    }

    // Output remaining sentence buffer
    if (sentenceBuffer.trim()) {
      queueSpeech(sentenceBuffer.trim());
    }

    // Emit complete agent response event to the ACMI Super Bus
    try {
      await acmiCall("acmi_event", {
        namespace: "thread",
        id: "agent-coordination",
        source: "agent:bentley",
        kind: "voice-output",
        summary: `[voice-output] Agent responded: "${fullResponseText}"`,
        correlationId: `voiceOutput-${Date.now()}`,
      });
    } catch (e) {
      console.error("Bus emit error:", e);
    }
  } catch (err) {
    console.error("Copilot streaming error:", err);
    addSystemLog("ERROR: Failed to fetch copilot response stream.");
  }
}

export default function VoiceClient() {
  const [status, setStatus] = useState<"idle" | "connecting" | "active">("idle");
  const [model, setModel] = useState("nova-2-conversational");
  const [suppression, setSuppression] = useState(true);
  const [language, setLanguage] = useState("en-US");
  const [transcripts, setTranscripts] = useState<TranscribedLine[]>(DEFAULT_LOGS);
  const [micInput, setMicInput] = useState(0);

  // API Credentials validation state
  const [keysLoaded, setKeysLoaded] = useState(false);
  const [keysMissing, setKeysMissing] = useState({ groq: false, deepgram: false });
  const [deepgramApiKey, setDeepgramApiKey] = useState("");
  const [groqApiKey, setGroqApiKey] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Speech Queue Refs for Sentence-by-Sentence TTS
  const speakQueueRef = useRef<string[]>([]);
  const speakingRef = useRef<boolean>(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Auto-scroll logic for transcription window
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  // Read keys from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      const gKey = localStorage.getItem("groq_api_key") || "";
      const dKey = localStorage.getItem("deepgram_api_key") || "";
      const timer = setTimeout(() => {
        setGroqApiKey(gKey);
        setDeepgramApiKey(dKey);
        setKeysMissing({
          groq: !gKey,
          deepgram: !dKey,
        });
        setKeysLoaded(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  // WebSpeech Synthesis Queue Handlers
  const speakNext = () => {
    if (!synthRef.current || speakQueueRef.current.length === 0) {
      speakingRef.current = false;
      return;
    }
    speakingRef.current = true;
    const sentence = speakQueueRef.current.shift();
    if (!sentence) {
      speakNext();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(sentence);
    const voices = synthRef.current.getVoices();
    const preferredVoice =
      voices.find((v) => v.lang.startsWith("en") && v.name.includes("Google")) ||
      voices.find((v) => v.lang.startsWith("en"));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    utterance.onend = () => {
      speakNext();
    };
    utterance.onerror = () => {
      speakNext();
    };
    synthRef.current.speak(utterance);
  };

  const queueSpeech = (text: string) => {
    speakQueueRef.current.push(text);
    if (!speakingRef.current) {
      speakNext();
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    speakQueueRef.current = [];
    speakingRef.current = false;
  };

  // Toggle Live Voice Stream (Deepgram WS & MediaRecorder API)
  const handleToggleFeed = async () => {
    if (status === "active") {
      cleanupAudio();
      setStatus("idle");
      addSystemLog("Voice streaming stream closed by user.");
      return;
    }

    if (keysMissing.deepgram || keysMissing.groq) {
      alert("Please configure your Groq and Deepgram Cognition Keys in Settings before establishing a live voice feed.");
      addSystemLog("ERROR: API key credentials missing. Open Settings panel to provide credentials.");
      return;
    }

    setStatus("connecting");
    addSystemLog("Establishing connection to Deepgram WS Endpoint...");

    try {
      const wsUrl = `wss://api.deepgram.com/v1/listen?model=${model}&language=${language}&smart_format=true&interim_results=true`;
      const ws = new WebSocket(wsUrl, ["token", deepgramApiKey]);
      wsRef.current = ws;

      ws.onopen = async () => {
        addSystemLog("Deepgram socket handshake complete. Requesting physical mic stream...");
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;

          const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;

          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyserRef.current = analyser;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          // Configure MediaRecorder for live streaming slices
          let mimeType = "audio/webm";
          if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
            mimeType = "audio/webm;codecs=opus";
          } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
            mimeType = "audio/ogg;codecs=opus";
          }

          const recorder = new MediaRecorder(stream, { mimeType });
          mediaRecorderRef.current = recorder;

          recorder.ondataavailable = (event) => {
            if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
              ws.send(event.data);
            }
          };

          // Chunks sliced every 250ms
          recorder.start(250);

          setStatus("active");
          addSystemLog("Microphone stream locked. Live Voice Dispatch channels active (Nova-2 pipeline).");
        } catch (err) {
          console.error("Microphone hardware error:", err);
          addSystemLog("ERROR: Failed to allocate hardware microphone stream. Access denied.");
          setStatus("idle");
          ws.close();
        }
      };

      let accumulatedUserTranscript = "";

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          const transcriptText = data.channel?.alternatives?.[0]?.transcript;
          if (!transcriptText) return;

          const isFinal = data.is_final;
          if (isFinal) {
            addUserTranscript(transcriptText);
            accumulatedUserTranscript += " " + transcriptText;

            // Trigger Copilot when speech is complete (speech_final parameter indicates pauses)
            if (data.speech_final) {
              const query = accumulatedUserTranscript.trim();
              accumulatedUserTranscript = "";
              if (query.length > 2) {
                await triggerCopilotResponse(query);
              }
            }
          }
        } catch (e) {
          console.error("Socket transcript error:", e);
        }
      };

      ws.onerror = (e) => {
        console.error("WS general error:", e);
        addSystemLog("ERROR: Deepgram WebSocket network layer error occurred.");
      };

      ws.onclose = () => {
        addSystemLog("WebSocket connection closed. System idling.");
        setStatus("idle");
      };
    } catch (err) {
      console.error("WS creation error:", err);
      addSystemLog("ERROR: Connection failed. Check network routing.");
      setStatus("idle");
    }
  };

  const triggerCopilotResponse = async (query: string) => {
    await triggerCopilotResponseOutside({
      query,
      groqApiKey,
      addSystemLog,
      stopSpeaking,
      setTranscripts,
      queueSpeech,
    });
  };

  const cleanupAudio = () => {
    stopSpeaking();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  useEffect(() => {
    return () => cleanupAudio();
  }, []);

  const addSystemLog = (text: string) => {
    const time = new Date().toTimeString().split(" ")[0];
    const ts = Date.now();
    setTranscripts((prev) => [
      ...prev,
      {
        id: `sys-${ts}`,
        timestamp: time,
        speaker: "SYSTEM",
        text,
        correlationId: `voiceSys-${ts}`,
      },
    ]);
  };

  const addUserTranscript = (text: string) => {
    const time = new Date().toTimeString().split(" ")[0];
    const ts = Date.now();
    setTranscripts((prev) => [
      ...prev,
      {
        id: `usr-${ts}`,
        timestamp: time,
        speaker: "USER",
        text,
        correlationId: `voiceUser-${ts}`,
      },
    ]);
  };

  const addAgentTranscript = (text: string) => {
    const time = new Date().toTimeString().split(" ")[0];
    const ts = Date.now();
    setTranscripts((prev) => [
      ...prev,
      {
        id: `agt-${ts}`,
        timestamp: time,
        speaker: "AGENT",
        text,
        correlationId: `voiceAgent-${ts}`,
      },
    ]);
  };

  // Waveform render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = "rgba(26, 26, 26, 0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(26, 26, 26, 0.1)";
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (status === "active") {
        let bufferLength = 0;
        let dataArray = new Uint8Array(0);

        if (analyserRef.current) {
          const analyser = analyserRef.current;
          bufferLength = analyser.frequencyBinCount;
          dataArray = new Uint8Array(bufferLength);
          analyser.getByteTimeDomainData(dataArray);

          ctx.lineWidth = 1.5;
          ctx.strokeStyle = "#2d4a3e";
          ctx.beginPath();

          const sliceWidth = width / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * height) / 2;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }

            x += sliceWidth;
          }

          ctx.lineTo(width, height / 2);
          ctx.stroke();

          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += Math.abs(dataArray[i] - 128);
          }
          setMicInput(Math.min(100, Math.floor(sum * 2)));
        } else {
          phase += 0.08;
          ctx.lineWidth = 1.5;

          const waves = [
            { amp: 35, freq: 0.015, color: "rgba(45, 74, 62, 0.95)", speed: 1 },
            { amp: 20, freq: 0.03, color: "rgba(45, 74, 62, 0.4)", speed: -0.7 },
            { amp: 10, freq: 0.05, color: "rgba(196, 144, 58, 0.5)", speed: 1.5 },
          ];

          waves.forEach((w) => {
            ctx.strokeStyle = w.color;
            ctx.beginPath();

            for (let x = 0; x < width; x++) {
              const env = Math.sin((x / width) * Math.PI);
              const y = height / 2 + Math.sin(x * w.freq + phase * w.speed) * w.amp * env;

              if (x === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            }
            ctx.stroke();
          });

          setMicInput(30 + Math.floor(Math.sin(phase) * 15) + Math.floor(Math.random() * 5));
        }
      } else if (status === "connecting") {
        phase += 0.15;
        ctx.fillStyle = "rgba(45, 74, 62, 0.15)";
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = "#2d4a3e";
        ctx.lineWidth = 1;
        ctx.font = "10px monospace";
        ctx.fillStyle = "#2d4a3e";
        ctx.textAlign = "center";
        ctx.fillText("CONNECTING DEEPGRAM CLUSTER SOCKET...", width / 2, height / 2 + 3);

        ctx.beginPath();
        const centerLineY = height / 2 + Math.sin(phase) * 10;
        ctx.moveTo(0, centerLineY);
        ctx.lineTo(width, centerLineY);
        ctx.stroke();
        setMicInput(10);
      } else {
        ctx.strokeStyle = "rgba(26, 26, 26, 0.15)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        ctx.font = "9px monospace";
        ctx.fillStyle = "rgba(26, 26, 26, 0.4)";
        ctx.textAlign = "center";
        ctx.fillText("[AUDIO STREAM INTERFACE IDLE]", width / 2, height / 2 + 15);
        setMicInput(0);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [status]);

  return (
    <div className="space-y-6">
      {/* Editorial Title Block */}
      <div className="flex items-start justify-between border-b border-[#1a1a1a]/15 pb-4">
        <div className="space-y-1">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#2d4a3e] font-bold">
            Layer 6 Command Surface: Phase 4
          </span>
          <h1 className="text-2xl font-bold tracking-tight uppercase font-mono text-[#1a1a1a]">
            Deepgram Voice Chat
          </h1>
          <p className="text-xs font-mono text-[#1a1a1a]/60">
            Real-time streaming agent console with responsive audio processing & correlation trace telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase bg-[#f4f2eb] px-3 py-1 border border-[#1a1a1a]/10">
          <Activity
            className={cn(
              "h-3 w-3",
              status === "active" && "text-[#2d4a3e] animate-pulse",
              status === "connecting" && "text-[#c4903a] animate-spin"
            )}
          />
          <span>STATUS: [{status}]</span>
        </div>
      </div>

      {/* Premium Cognition Warning Banner */}
      {keysLoaded && (keysMissing.groq || keysMissing.deepgram) && (
        <div className="border border-[#c4903a]/30 bg-[#faf9f5] p-3 text-xs font-mono text-[#c4903a] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-[#c4903a] rounded-none" />
            <span>
              [WARN] Cognition Keys Missing: {keysMissing.groq && "Groq API Key (LLM Copilot)"}{" "}
              {keysMissing.groq && keysMissing.deepgram && " & "}{" "}
              {keysMissing.deepgram && "Deepgram API Key (Voice listen)"}.
            </span>
          </div>
          <a
            href="/settings"
            className="text-[10px] uppercase font-bold tracking-wider underline hover:text-[#c4903a]/80"
          >
            Configure Cognition Keys &rarr;
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Visualizer & Stream controller */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border border-[#1a1a1a]/15 bg-[#f4f2eb] p-5 rounded-none flex flex-col justify-between h-[360px] relative">
            
            <div className="flex items-center justify-between border-b border-[#1a1a1a]/10 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "h-2 w-2 rounded-none",
                  status === "active" ? "bg-[#2d4a3e] animate-pulse" : status === "connecting" ? "bg-[#c4903a]" : "bg-[#1a1a1a]/20"
                )} />
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#1a1a1a]">
                  {status === "active" ? "[REC] LIVE AUDIO CONSOLE" : "[OFFLINE] VOICE CONSOLE"}
                </span>
              </div>
              <span className="font-mono text-[9px] text-[#1a1a1a]/50">
                BUFF_SIZE: 256 | LATENCY: &lt;15ms
              </span>
            </div>

            <div className="flex-1 bg-[#faf9f5] border border-[#1a1a1a]/10 p-1 mb-4 overflow-hidden relative">
              <canvas 
                ref={canvasRef} 
                className="w-full h-full block bg-[#faf9f5]"
                width={600} 
                height={200}
              />
              
              {status === "active" && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 font-mono text-[9px] text-[#1a1a1a]/50">
                  <span>INPUT GAIN:</span>
                  <div className="w-16 h-1.5 bg-[#1a1a1a]/10 relative border border-[#1a1a1a]/5">
                    <div 
                      className="h-full bg-[#2d4a3e] transition-all duration-75"
                      style={{ width: `${micInput}%` }}
                    />
                  </div>
                  <span>{micInput}%</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleFeed}
                className={cn(
                  "flex-1 font-mono text-xs font-bold py-2.5 px-4 rounded-none transition-all duration-150 border flex items-center justify-center gap-2",
                  status === "active" 
                    ? "bg-[#c4903a] text-[#faf9f5] border-[#c4903a] hover:bg-[#c4903a]/90"
                    : status === "connecting"
                    ? "bg-[#f4f2eb] text-[#c4903a] border-[#c4903a]/30 cursor-not-allowed"
                    : "bg-[#2d4a3e] text-[#faf9f5] border-[#2d4a3e] hover:bg-[#2d4a3e]/90 shadow-sm"
                )}
                disabled={status === "connecting"}
              >
                {status === "active" ? (
                  <>
                    <MicOff className="h-4 w-4 shrink-0" />
                    CLOSE VOICE STREAM
                  </>
                ) : status === "connecting" ? (
                  <>
                    <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
                    SECURE SIGNALS MATRIX...
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 shrink-0 animate-pulse" />
                    ESTABLISH VOICE FEED
                  </>
                )}
              </button>

              <div className="bg-[#faf9f5] border border-[#1a1a1a]/10 px-3 py-2 font-mono text-[10px] text-[#1a1a1a]/60">
                PORT: <span className="text-[#1a1a1a] font-bold">48443 (WSS)</span>
              </div>
            </div>
          </div>

          <div className="border border-[#1a1a1a]/15 bg-[#f4f2eb] p-4 rounded-none">
            <h3 className="font-mono text-xs font-bold border-b border-[#1a1a1a]/10 pb-2 mb-3 uppercase text-[#1a1a1a] flex items-center gap-2">
              <Settings2 className="h-3.5 w-3.5 text-[#2d4a3e]" />
              Deepgram Streaming Parameters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-[#1a1a1a]/50">Transcribing Engine</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-[#faf9f5] border border-[#1a1a1a]/10 p-2 text-xs font-mono outline-none rounded-none focus:border-[#1a1a1a]/40 text-[#1a1a1a]"
                >
                  <option value="nova-2-conversational">Nova-2 Conversational (Standard)</option>
                  <option value="nova-2-enhanced">Nova-2 Voice Dispatch (High Speed)</option>
                  <option value="base-general">Deepgram Multi-Agent Base</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-[#1a1a1a]/50">Target Language Code</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-[#faf9f5] border border-[#1a1a1a]/10 p-2 text-xs font-mono outline-none rounded-none focus:border-[#1a1a1a]/40 text-[#1a1a1a]"
                >
                  <option value="en-US">English (en-US)</option>
                  <option value="es-ES">Spanish (es-ES)</option>
                  <option value="de-DE">German (de-DE)</option>
                </select>
              </div>
              <div className="md:col-span-2 flex items-center justify-between pt-1 border-t border-[#1a1a1a]/5">
                <span className="text-[11px] text-[#1a1a1a]/60">Intelligent Noise Gate Suppression</span>
                <button
                  onClick={() => setSuppression(!suppression)}
                  className={cn(
                    "px-3 py-1 border font-bold text-[10px] rounded-none transition-all duration-150 uppercase",
                    suppression 
                      ? "bg-[#2d4a3e] text-[#faf9f5] border-[#2d4a3e]" 
                      : "bg-[#faf9f5] text-[#1a1a1a]/40 border-[#1a1a1a]/15 hover:border-[#1a1a1a]/30"
                  )}
                >
                  [{suppression ? "ON" : "OFF"}]
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Scrolling transcribing console */}
        <div className="lg:col-span-5 space-y-4">
          <div className="border border-[#1a1a1a]/15 bg-[#f4f2eb] p-4 rounded-none flex flex-col justify-between h-[498px]">
            <div className="flex items-center justify-between border-b border-[#1a1a1a]/10 pb-2 mb-3">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-[#1a1a1a]">
                <TerminalIcon className="h-3.5 w-3.5 text-[#2d4a3e]" />
                Live Transcription Feed
              </div>
              <span className="font-mono text-[9px] uppercase tracking-wider bg-[#faf9f5] px-1.5 py-0.5 border border-[#1a1a1a]/10 text-[#1a1a1a]/60">
                Telemetry ACTIVE
              </span>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 bg-[#1a1a1a] text-[#faf9f5] p-3 font-mono text-xs overflow-y-auto space-y-3.5 rounded-none scrollbar-thin max-h-[400px] border border-[#1a1a1a]/30"
            >
              {transcripts.map((t) => {
                let colorClass = "text-amber-400";
                if (t.speaker === "AGENT") colorClass = "text-[#2ed573]";
                if (t.speaker === "SYSTEM") colorClass = "text-cyan-400/80";

                return (
                  <div key={t.id} className="space-y-1 border-b border-[#faf9f5]/5 pb-2.5 last:border-0 last:pb-0">
                    <div className="flex justify-between text-[10px] opacity-40">
                      <span>[{t.timestamp}] SPEAKER: {t.speaker}</span>
                      <span className="text-[8px] truncate max-w-[120px]">{t.correlationId}</span>
                    </div>
                    <p className={cn("leading-relaxed break-words", colorClass)}>
                      {t.speaker === "USER" ? "> " : ""}
                      {t.text}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-[#1a1a1a]/10 pt-3 mt-3 font-mono text-[10px] text-[#1a1a1a]/40 uppercase flex justify-between">
              <span>ACM_CORRELATION: COMMS_V1.1</span>
              <span>LINES TRACKED: {transcripts.length}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
