// src/components/InlineAiChatWidget.jsx
import { useEffect, useRef, useState } from "react";

const API_BASE = "http://127.0.0.1:8000/api";

// Các chế độ để chọn
const MODES = [
  {
    id: "general",
    label: "Chat tổng hợp",
    system:
      "Bạn là trợ lý thân thiện, lịch sự, trả lời ngắn gọn bằng tiếng Việt. Khi chưa đủ thông tin thì hỏi lại.",
  },
  {
    id: "shopping",
    label: "Tư vấn mua hàng",
    system:
      "Bạn là trợ lý bán hàng. Hỏi nhu cầu, ngân sách, size, màu, chất liệu; sau đó gợi ý 2-3 hướng phù hợp (không bịa tồn kho).",
  },
  {
    id: "order",
    label: "CSKH / Tra cứu đơn",
    system:
      "Bạn hỗ trợ khách tra cứu/tư vấn đơn hàng. KHÔNG bịa thông tin; hướng dẫn khách vào trang 'Tài khoản -> Đơn hàng' để xem chi tiết. Nếu khách đưa mã đơn, yêu cầu thêm email/sđt để xác thực.",
  },
];

// helper: lưu/đọc an toàn từ localStorage
function loadLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function saveLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export default function InlineAiChatWidget({ buttonLabel = "💬 Trợ lý AI" }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(() => localStorage.getItem("ai_chat_mode") || "general");
  const [messages, setMessages] = useState(() =>
    loadLS("ai_chat_inline_messages", [
      { role: "assistant", content: "Xin chào 👋 Mình có thể giúp gì cho bạn?" },
    ])
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState("");

  const panelRef = useRef(null);
  const wrapRef = useRef(null);
  const bottomRef = useRef(null);
  const abortRef = useRef(null);

  // persist messages & mode
  useEffect(() => saveLS("ai_chat_inline_messages", messages), [messages]);
  useEffect(() => localStorage.setItem("ai_chat_mode", mode), [mode]);

  // autoscroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, open]);

  // Click ra ngoài để đóng
  useEffect(() => {
    function handleClickOutside(e) {
      if (!open) return;
      const p = panelRef.current;
      const w = wrapRef.current;
      if (p && w && !p.contains(e.target) && !w.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function sendMessage(e) {
    if (e?.preventDefault) e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setLastError("");
    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const sys = MODES.find((m) => m.id === mode)?.system ?? MODES[0].system;

    // Chuẩn bị AbortController + timeout 20s
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {}
    }
    const controller = new AbortController();
    abortRef.current = controller;
    const timer = setTimeout(() => controller.abort("Request timeout"), 20000);

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          system: sys,
          messages: [...messages, userMsg],
        }),
      });

      // log dev
      console.log("[AI] request:", res.url, res.type, res.status, res.statusText);

      const rawText = await res.text(); // đọc text 1 lần
      let data = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        // giữ nguyên data = null, sẽ xử lý phía dưới
      }

      // HTTP lỗi?
     // sau khi parse data ở nhánh !res.ok
if (!res.ok) {
  let serverDetail = '';
  try {
    const parsed = JSON.parse(rawText);
    if (parsed?.detail) serverDetail = `\nDETAIL: ${parsed.detail.slice(0, 800)}`;
  } catch {}
  throw new Error(`HTTP ${res.status} ${res.statusText} — ${rawText.slice(0, 500)}${serverDetail}`);
}


      // Backend báo ok:false?
      if (data && data.ok === false) {
        throw new Error(data.message || "Backend báo lỗi không xác định.");
      }

      const aiText =
        (data && (data.message || data.reply || data.content)) ||
        "Xin lỗi, mình chưa nhận được phản hồi.";
      setMessages((prev) => [...prev, { role: "assistant", content: aiText }]);
    } catch (err) {
      console.error("[AI] error:", err);
      // Thông báo lỗi thân thiện + chi tiết dev
      let niceMessage = "Có lỗi khi gọi AI. Vui lòng thử lại.";
      const s = String(err?.message || err);
      // gợi ý cụ thể khi thiếu GEMINI_API_KEY
      if (s.includes("GEMINI_API_KEY") || s.includes("Thi\u1ebfu GEMINI_API_KEY")) {
        niceMessage =
          "Backend thiếu GEMINI_API_KEY trong .env. Thêm GEMINI_API_KEY vào .env và chạy `php artisan config:clear` rồi thử lại.";
      } else if (s.includes("timeout") || s.includes("aborted")) {
        niceMessage = "Kết nối chậm / timeout. Thử gửi lại giúp mình nhé.";
      }
      setLastError(s);
      setMessages((prev) => [...prev, { role: "assistant", content: niceMessage }]);
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([{ role: "assistant", content: "Đã xoá lịch sử. Bạn hỏi gì tiếp nhé!" }]);
    try {
      localStorage.removeItem("ai_chat_inline_messages");
    } catch {}
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading) sendMessage();
    }
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* NÚT: đặt ở cạnh phải */}
      <button
        ref={wrapRef}
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid #d1d5db",
          background: "#fff",
          cursor: "pointer",
          fontWeight: 600,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
        title="Mở trợ lý AI"
      >
        {buttonLabel}
      </button>

      {/* PANEL: xổ ra thành cửa sổ nhỏ */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: "absolute",
            right: 0,
            bottom: "56px", // mở lên phía trên nút
            width: 380,
            height: 480,
            zIndex: 20,
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            background: "#fff",
            boxShadow: "0 12px 24px rgba(0,0,0,0.12)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid #eee",
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "space-between",
            }}
          >
            <strong>AI Chat</strong>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              style={{ border: "1px solid #ddd", borderRadius: 8, padding: "4px 6px", fontSize: 13 }}
              title="Chọn chế độ"
            >
              {MODES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={clearChat} style={{ fontSize: 12, color: "#666" }}>
                Clear
              </button>
              <button onClick={() => setOpen(false)} style={{ fontSize: 18, lineHeight: 1 }}>
                ×
              </button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: 12, background: "#f9fafb" }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  maxWidth: "85%",
                  padding: "10px 12px",
                  borderRadius: 14,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  margin: "6px 0",
                  marginLeft: m.role === "user" ? "auto" : 0,
                  color: m.role === "user" ? "#fff" : "#111",
                  background: m.role === "user" ? "#2563eb" : "#fff",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div
                style={{
                  maxWidth: "85%",
                  padding: "10px 12px",
                  borderRadius: 14,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  margin: "6px 0",
                  background: "#fff",
                  color: "#666",
                }}
              >
                Đang soạn…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Footer: lỗi dev */}
          {lastError && (
            <div
              style={{
                padding: "6px 10px",
                borderTop: "1px dashed #f59e0b",
                background: "#fffbeb",
                color: "#92400e",
                fontSize: 12,
                maxHeight: 72,
                overflow: "auto",
              }}
              title="Chi tiết lỗi dành cho dev"
            >
              {lastError}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={sendMessage}
            style={{
              borderTop: "1px solid #eee",
              display: "flex",
              gap: 8,
              padding: 10,
              background: "#fff",
            }}
          >
            <textarea
              placeholder="Nhập câu hỏi… (Enter để gửi, Shift+Enter xuống dòng)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={2}
              style={{
                flex: 1,
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: "10px 12px",
                outline: "none",
                resize: "none",
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                border: "none",
                borderRadius: 10,
                padding: "10px 14px",
                background: loading ? "#93c5fd" : "#2563eb",
                color: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
            >
              Gửi
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
