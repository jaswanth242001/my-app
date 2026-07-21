import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import "./ChatbotWidget.css";

const HISTORY_LIMIT = 50;
const MAX_MESSAGE_LENGTH = 1000;
const THEME_STORAGE_KEY = "noteflow:chat-theme";
const VOICE_OUTPUT_STORAGE_KEY = "noteflow:chat-voice-output";

const SpeechRecognitionImpl =
  typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
const speechSynthesisSupported = typeof window !== "undefined" && "speechSynthesis" in window;

// Known female-voice names across Chrome/Edge/Safari/Windows speech engines.
// Voice lists don't expose a gender field, so we match on name as a heuristic.
const FEMALE_VOICE_HINTS = [
  "female",
  "zira",
  "samantha",
  "victoria",
  "karen",
  "moira",
  "tessa",
  "susan",
  "allison",
  "ava",
  "serena",
  "fiona",
  "kate",
  "amelie",
  "salli",
  "joanna",
  "kendra",
  "kimberly",
  "ivy",
  "sonia",
  "libby",
  "olivia",
  "emma",
  "hazel",
  "aria",
  "jenny",
];

let cachedVoices = [];

function refreshVoiceCache() {
  cachedVoices = window.speechSynthesis.getVoices();
}

if (speechSynthesisSupported) {
  refreshVoiceCache();
  window.speechSynthesis.addEventListener("voiceschanged", refreshVoiceCache);
}

function pickFemaleVoice(lang) {
  if (!cachedVoices.length) return null;
  const langPrefix = lang.split("-")[0].toLowerCase();
  const matchesLang = (voice) => voice.lang?.toLowerCase().startsWith(langPrefix);
  const isFemaleHint = (voice) =>
    FEMALE_VOICE_HINTS.some((hint) => voice.name.toLowerCase().includes(hint));

  return (
    cachedVoices.find((voice) => matchesLang(voice) && isFemaleHint(voice)) ||
    cachedVoices.find((voice) => isFemaleHint(voice)) ||
    cachedVoices.find((voice) => matchesLang(voice)) ||
    null
  );
}

function speak(text) {
  if (!text || !speechSynthesisSupported) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  const femaleVoice = pickFemaleVoice(utterance.lang);
  if (femaleVoice) utterance.voice = femaleVoice;
  window.speechSynthesis.speak(utterance);
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Converts { message, response, createdAt } history records into a flat,
// chronologically sorted list of individual chat bubbles.
function historyToMessages(history) {
  const messages = [];
  history.forEach((entry) => {
    const createdAt = entry.createdAt ?? new Date().toISOString();
    if (entry.message) {
      messages.push({ id: createId(), role: "user", text: entry.message, createdAt });
    }
    if (entry.response) {
      messages.push({ id: createId(), role: "bot", text: entry.response, createdAt });
    }
  });
  return messages
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .slice(-HISTORY_LIMIT);
}

function readCache(storageKey) {
  try {
    const cached = localStorage.getItem(storageKey);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

// Fetches and normalizes chat history. Has no side effects of its own so it is
// safe to call from both an Effect (via .then/.catch) and event handlers.
async function fetchHistory(token) {
  const data = await api.get("/chat/history", token);
  const list = Array.isArray(data) ? data : Array.isArray(data?.history) ? data.history : [];
  return historyToMessages(list);
}

function ChatbotWidget() {
  const { token, user } = useAuth();
  const storageKey = `noteflow:chat-history:${user?.id ?? user?.email ?? "guest"}`;

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) || "light";
    } catch {
      return "light";
    }
  });

  const [messages, setMessages] = useState(() => readCache(storageKey));
  const [inputValue, setInputValue] = useState("");
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(() => {
    try {
      return localStorage.getItem(VOICE_OUTPUT_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const loadingHistory = isOpen && !historyLoaded && !historyError;

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fabRef = useRef(null);
  const lastFailedMessageRef = useRef("");
  const recognitionRef = useRef(null);
  const transcriptRef = useRef("");

  const persist = useCallback(
    (next) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(next.slice(-HISTORY_LIMIT)));
      } catch {
        // Ignore storage errors (quota exceeded, private browsing, etc.)
      }
    },
    [storageKey]
  );

  // Fetch chat history from the server once, the first time the widget is opened.
  useEffect(() => {
    if (!isOpen || historyLoaded) return undefined;

    let ignore = false;
    fetchHistory(token)
      .then((normalized) => {
        if (ignore) return;
        setMessages(normalized);
        persist(normalized);
        setHistoryLoaded(true);
      })
      .catch((err) => {
        if (!ignore) setHistoryError(err.message || "Could not load chat history.");
      });

    return () => {
      ignore = true;
    };
  }, [isOpen, historyLoaded, token, persist]);

  const handleRetryHistory = () => {
    setHistoryError("");
    fetchHistory(token)
      .then((normalized) => {
        setMessages(normalized);
        persist(normalized);
        setHistoryLoaded(true);
      })
      .catch((err) => {
        setHistoryError(err.message || "Could not load chat history.");
      });
  };

  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, sending, isMinimized]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // Ignore storage errors.
      }
      return next;
    });
  };

  const openWidget = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const closeWidget = () => {
    setIsOpen(false);
    setIsMinimized(false);
    recognitionRef.current?.stop();
    if (speechSynthesisSupported) window.speechSynthesis.cancel();
    fabRef.current?.focus();
  };

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setSendError("");
      const userMessage = { id: createId(), role: "user", text: trimmed, createdAt: new Date().toISOString() };
      setMessages((prev) => {
        const next = [...prev, userMessage].slice(-HISTORY_LIMIT);
        persist(next);
        return next;
      });
      setSending(true);

      try {
        const data = await api.post("/chat/message", { message: trimmed }, token);
        const botMessage = {
          id: createId(),
          role: "bot",
          text: data?.response ?? "",
          createdAt: data?.createdAt ?? new Date().toISOString(),
        };
        setMessages((prev) => {
          const next = [...prev, botMessage].slice(-HISTORY_LIMIT);
          persist(next);
          return next;
        });
        lastFailedMessageRef.current = "";
        if (voiceOutputEnabled) speak(botMessage.text);
      } catch (err) {
        lastFailedMessageRef.current = trimmed;
        setSendError(err.message || "Failed to send message. Please try again.");
      } finally {
        setSending(false);
      }
    },
    [token, persist, voiceOutputEnabled]
  );

  const handleSend = () => {
    if (!inputValue.trim() || sending) return;
    const text = inputValue;
    setInputValue("");
    sendMessage(text);
  };

  const handleRetrySend = () => {
    if (lastFailedMessageRef.current) {
      sendMessage(lastFailedMessageRef.current);
    }
  };

  // Set up the speech recognition instance once and wire its callbacks. State
  // updates happen inside the recognition's own event callbacks (an external
  // system subscription), not synchronously in the effect body.
  useEffect(() => {
    if (!SpeechRecognitionImpl) return undefined;

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      transcriptRef.current = transcript;
      setInputValue(transcript);
    };

    recognition.onerror = (event) => {
      setVoiceError(
        event.error === "not-allowed" ? "Microphone access was denied." : "Voice input error. Please try again."
      );
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      const finalTranscript = transcriptRef.current.trim();
      transcriptRef.current = "";
      if (finalTranscript) {
        setInputValue("");
        sendMessage(finalTranscript);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [sendMessage]);

  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      return;
    }

    setVoiceError("");
    setInputValue("");
    transcriptRef.current = "";
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      // start() throws if recognition is already active; safe to ignore.
    }
  };

  const toggleVoiceOutput = () => {
    setVoiceOutputEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(VOICE_OUTPUT_STORAGE_KEY, String(next));
      } catch {
        // Ignore storage errors.
      }
      if (!next && speechSynthesisSupported) window.speechSynthesis.cancel();
      return next;
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleWidgetKeyDown = (e) => {
    if (e.key === "Escape") {
      closeWidget();
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        ref={fabRef}
        className="chat-fab"
        onClick={openWidget}
        aria-label="Open notes assistant chat"
      >
        <span aria-hidden="true">💬</span>
      </button>
    );
  }

  return (
    <div
      className={`chatbot-widget${isMinimized ? " minimized" : ""}`}
      data-theme={theme}
      role="dialog"
      aria-label="Notes assistant chat"
      aria-modal="false"
      onKeyDown={handleWidgetKeyDown}
    >
      <header className="chatbot-header">
        <div className="chatbot-title">
          <span className="chatbot-avatar" aria-hidden="true">
            🤖
          </span>
          <div>
            <p className="chatbot-name">Notes Assistant</p>
            {!isMinimized && (
              <p className="chatbot-status">
                {isListening ? "Listening..." : sending ? "Typing..." : "Online"}
              </p>
            )}
          </div>
        </div>
        <div className="chatbot-controls">
          {speechSynthesisSupported && (
            <button
              type="button"
              onClick={toggleVoiceOutput}
              aria-pressed={voiceOutputEnabled}
              aria-label={voiceOutputEnabled ? "Turn off spoken replies" : "Turn on spoken replies"}
              title={voiceOutputEnabled ? "Spoken replies on" : "Spoken replies off"}
            >
              {voiceOutputEnabled ? "🔊" : "🔇"}
            </button>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            title="Toggle theme"
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          <button
            type="button"
            onClick={() => setIsMinimized((m) => !m)}
            aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
            title={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? "▢" : "—"}
          </button>
          <button type="button" onClick={closeWidget} aria-label="Close chat" title="Close">
            ✕
          </button>
        </div>
      </header>

      {!isMinimized && (
        <>
          <div
            className="chatbot-messages"
            role="log"
            aria-live="polite"
            aria-busy={loadingHistory || sending}
          >
            {loadingHistory && messages.length === 0 && (
              <p className="chatbot-info">Loading conversation...</p>
            )}
            {!loadingHistory && messages.length === 0 && !historyError && (
              <p className="chatbot-info">Ask me anything about your notes!</p>
            )}

            {historyError && (
              <div className="chatbot-error" role="alert">
                <p>{historyError}</p>
                <button type="button" onClick={handleRetryHistory}>
                  Retry
                </button>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`chat-bubble-row ${msg.role}`}>
                <div className={`chat-bubble ${msg.role}`}>
                  <p className="chat-bubble-text">{msg.text}</p>
                  <div className="chat-bubble-footer">
                    <span className="chat-bubble-time">{formatTime(msg.createdAt)}</span>
                    {msg.role === "bot" && speechSynthesisSupported && (
                      <button
                        type="button"
                        className="chat-bubble-listen"
                        onClick={() => speak(msg.text)}
                        aria-label="Listen to this reply"
                        title="Listen to this reply"
                      >
                        🔊
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {sending && (
              <div className="chat-bubble-row bot">
                <div className="chat-bubble bot typing-indicator" aria-label="Assistant is typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            {sendError && (
              <div className="chatbot-error" role="alert">
                <p>{sendError}</p>
                <button type="button" onClick={handleRetrySend}>
                  Retry
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form
            className="chatbot-input-area"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <label htmlFor="chatbot-input" className="sr-only">
              Type your message
            </label>
            {voiceError && (
              <p className="chatbot-voice-error" role="alert">
                {voiceError}
              </p>
            )}
            <div className="chatbot-input-row">
              <textarea
                id="chatbot-input"
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening..." : "Type a message..."}
                rows={1}
                maxLength={MAX_MESSAGE_LENGTH}
                disabled={sending || isListening}
                aria-label="Chat message"
              />
              {SpeechRecognitionImpl && (
                <button
                  type="button"
                  className={`chatbot-mic${isListening ? " listening" : ""}`}
                  onClick={toggleListening}
                  disabled={sending}
                  aria-pressed={isListening}
                  aria-label={isListening ? "Stop voice input" : "Start voice input"}
                  title={isListening ? "Stop voice input" : "Start voice input"}
                >
                  {isListening ? "⏹️" : "🎤"}
                </button>
              )}
            </div>
            <div className="chatbot-input-footer">
              <span className="chatbot-char-count">
                {inputValue.length}/{MAX_MESSAGE_LENGTH}
              </span>
              <button type="submit" disabled={sending || !inputValue.trim()} aria-label="Send message">
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

export default ChatbotWidget;
