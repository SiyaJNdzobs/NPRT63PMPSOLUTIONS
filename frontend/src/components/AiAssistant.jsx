import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Sparkles, X, Send, Mic, MicOff, Volume2, VolumeX,
  MessageSquare, User as UserIcon, Loader2, Globe, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const LANGUAGES = [
  { code: "English", label: "English", voiceLang: "en-ZA" },
  { code: "isiZulu", label: "isiZulu", voiceLang: "zu-ZA" },
  { code: "isiXhosa", label: "isiXhosa", voiceLang: "xh-ZA" },
  { code: "Sesotho", label: "Sesotho", voiceLang: "st-ZA" },
  { code: "Setswana", label: "Setswana", voiceLang: "tn-ZA" },
  { code: "Afrikaans", label: "Afrikaans", voiceLang: "af-ZA" },
];

export function AiAssistant() {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState("English");
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [messages, setMessages] = useState([]);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Must NOT be shown on the public link shared with next of kin (/t/:registration)
  const isPublicSharePage = location.pathname.startsWith("/t/");
  if (isPublicSharePage) {
    return null;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    const greeting = user?.full_name
      ? `Hello ${user.full_name}! 👋 I am your E-RANK Smart Assistant. How can I assist you with ranks, routes, fares, or safe taxi operations today?`
      : "Hello! 👋 I am your E-RANK Smart Assistant. Ask me about ranks, routes, fares, or say 'Hi' to introduce yourself!";

    setMessages([
      {
        id: "welcome",
        sender: "bot",
        text: greeting,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, [user?.full_name]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      const langMap = {
        English: "en-ZA",
        Afrikaans: "af-ZA",
        isiZulu: "zu-ZA",
        isiXhosa: "xh-ZA",
        Sesotho: "st-ZA",
        Setswana: "tn-ZA",
      };
      recognition.lang = langMap[language] || "en-ZA";

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage(transcript);
          sendMessage(transcript);
        }
      };
      recognition.onerror = (e) => {
        console.warn("Speech recognition error:", e);
        setIsListening(false);
        toast.error("Could not capture speech. Please check microphone permissions.");
      };
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, [language]);

  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const cleanText = text.replace(/[*_#•]/g, "").replace(/https?:\/\/\S+/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);

    const langObj = LANGUAGES.find((l) => l.code === language);
    if (langObj) {
      utterance.lang = langObj.voiceLang;
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find((v) => v.lang.startsWith(utterance.lang.slice(0, 2)));
    if (matchedVoice) utterance.voice = matchedVoice;

    window.speechSynthesis.speak(utterance);
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
      toast.info("Voice recognition is not supported in this browser. Please type your message.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Could not start recognition", err);
      }
    }
  };

  const sendMessage = async (overrideText) => {
    const text = (overrideText || inputMessage).trim();
    if (!text || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      const { data } = await api.post("/public/ai/assistant", {
        message: text,
        language,
        user_name: user?.full_name || null,
      });

      const botReply = data.reply || "I am currently unable to process your request. Please liaise with the rank marshal.";
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: botReply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);

      if (voiceEnabled) {
        speakText(botReply);
      }
    } catch (e) {
      const errReply = "An error occurred connecting to E-RANK AI. Please check your network or consult the rank marshal.";
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: errReply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setMessages([
      {
        id: "cleared-welcome",
        sender: "bot",
        text: user?.full_name
          ? `Chat reset. How can I help you today, ${user.full_name}?`
          : "Chat reset. Ask me anything about ranks, routes, fares, or say 'Hi'!",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-gradient-to-r from-primary to-amber-400 text-black font-extrabold px-4 py-3 rounded-full shadow-2xl hover:scale-105 transition-all duration-200 border border-amber-300 group"
          data-testid="ai-assistant-trigger"
          title="Open E-RANK AI Assistant"
        >
          <div className="relative">
            <MessageSquare size={22} className="fill-black/15" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-700"></span>
            </span>
          </div>
          <span className="text-sm tracking-tight">AI Assistant</span>
        </button>
      )}

      {isOpen && (
        <div
          className="fixed bottom-4 right-4 z-50 w-[95vw] sm:w-[410px] h-[580px] max-h-[85vh] bg-[#121721] border-2 border-[#263144] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white animate-in slide-in-from-bottom-5"
          data-testid="ai-assistant-window"
        >
          <div className="bg-[#181F2C] border-b border-[#263144] p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm font-heading">E-RANK AI</h3>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[9px] py-0 px-1.5">
                    Live Data
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400">Ranks · Fares · Multi-lingual Voice</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setVoiceEnabled((v) => !v)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  voiceEnabled ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10" : "border-slate-700 text-slate-500 hover:bg-slate-800"
                }`}
                title={voiceEnabled ? "Voice readout enabled" : "Voice readout muted"}
                data-testid="toggle-voice-btn"
              >
                {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <button
                onClick={clearChat}
                className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Reset conversation"
              >
                <RotateCcw size={15} />
              </button>
              <button
                onClick={() => {
                  if (window.speechSynthesis) window.speechSynthesis.cancel();
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close assistant"
                data-testid="close-ai-assistant-btn"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="bg-[#0A0D14] border-b border-[#263144] px-3 py-1.5 flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1 text-[11px]">
              <Globe size={12} className="text-primary" /> Language:
            </span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-[#181F2C] border border-[#263144] text-slate-200 text-xs rounded px-2 py-1 outline-none font-medium"
              data-testid="ai-language-select"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-sm">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "bot" && (
                  <div className="h-7 w-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={15} />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 shadow-md ${
                    m.sender === "user"
                      ? "bg-primary text-black font-medium rounded-tr-none"
                      : "bg-[#181F2C] border border-[#263144] text-slate-100 rounded-tl-none leading-relaxed"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-xs sm:text-sm">{m.text}</p>
                  <div className="flex items-center justify-between gap-3 mt-1 text-[10px] opacity-70">
                    <span>{m.time}</span>
                    {m.sender === "bot" && (
                      <button
                        onClick={() => speakText(m.text)}
                        className="hover:text-primary transition-colors flex items-center gap-1"
                        title="Listen to this reply"
                      >
                        <Volume2 size={11} /> Listen
                      </button>
                    )}
                  </div>
                </div>
                {m.sender === "user" && (
                  <div className="h-7 w-7 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <UserIcon size={15} />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs pl-2">
                <Loader2 size={14} className="animate-spin text-primary" />
                <span>E-RANK AI is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-[#181F2C] border-t border-[#263144] p-3 space-y-2">
            {isListening && (
              <div className="flex items-center justify-center gap-2 text-xs text-red-400 font-semibold animate-pulse">
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                <span>Listening to your voice... speak clearly</span>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={isListening ? "Listening..." : "Ask fare, route, or rank..."}
                disabled={loading}
                className="h-10 bg-[#0A0D14] border-[#263144] text-white text-xs font-medium focus-visible:ring-1 focus-visible:ring-primary"
                data-testid="ai-assistant-input"
              />
              <Button
                type="button"
                onClick={toggleMic}
                variant="outline"
                className={`h-10 w-10 p-0 shrink-0 border rounded-xl transition-all ${
                  isListening
                    ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse"
                    : "border-[#263144] hover:bg-[#20293A] text-slate-300"
                }`}
                title={isListening ? "Stop listening" : "Tap to speak (Web Speech)"}
                data-testid="ai-assistant-mic-btn"
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </Button>
              <Button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="h-10 w-10 p-0 bg-primary hover:bg-primary/90 text-black shrink-0 rounded-xl"
                data-testid="ai-assistant-send-btn"
              >
                <Send size={16} />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
