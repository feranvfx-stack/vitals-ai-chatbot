import { useState, useRef, useEffect } from "react";
import { marked } from "marked";
import { sendMessage } from "../services/groq";

const STORAGE_KEY = "vitals_chat_messages";

function loadMessages() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];
  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

export default function ChatPanel({ hidden }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(loadMessages);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage = { id: Date.now(), role: "user", text: trimmed };
    const historyForRequest = messages;

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const reply = await sendMessage(historyForRequest, trimmed);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "ai", text: reply },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "ai",
          text: `⚠️ ${err.message || "Something went wrong reaching Groq."}`,
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => setInput(e.target.value);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleClear = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <main className={`care-panel ${hidden ? "hidden" : ""}`} id="care-panel-chat">
      <div className="messages" id="messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <p>Ask about symptoms, fitness, or wellness to get started.</p>
          </div>
        )}

        {messages.map((msg) =>
          msg.role === "ai" ? (
            <div
              key={msg.id}
              className={`msg ai ${msg.isError ? "error" : ""}`}
            >
              <div
                className="prose"
                dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) }}
              />
            </div>
          ) : (
            <div key={msg.id} className="msg user">
              {msg.text}
            </div>
          )
        )}

        {isLoading && (
          <div className="msg ai">
            <div className="typing">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
      <form className="composer" id="composer" onSubmit={handleSubmit}>
        {messages.length > 0 && (
          <button type="button" className="clear-btn" onClick={handleClear}>
            Clear
          </button>
        )}
        <textarea
          id="input"
          rows="1"
          placeholder="Ask about symptoms, fitness, or wellness"
          aria-label="Message"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
        <button
          type="submit"
          id="send"
          aria-label="Send message"
          disabled={!input.trim() || isLoading}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="18"
            height="18"
          >
            <path d="M5 12h14" />
            <path d="M13 6l6 6-6 6" />
          </svg>
        </button>
      </form>
    </main>
  );
}
