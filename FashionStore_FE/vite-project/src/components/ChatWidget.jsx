// src/components/ChatWidget.jsx
import { useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

/**
 * Props:
 *  - floating: boolean  -> hiện nút tròn nổi góc phải + panel
 *  - open, onOpenChange -> nếu muốn điều khiển từ ngoài
 *  - title: string      -> tiêu đề hộp chat
 */
export default function ChatWidget({
  floating = false,
  open: openProp,
  onOpenChange,
  title = "Trợ lý FashionStore (Gemini)",
}) {
  // ---- state & helper ----
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = (v) => (onOpenChange ? onOpenChange(v) : setInternalOpen(v));

  const [messages, setMessages] = useState(() => {
    // lấy lịch sử ngắn nếu có
    try {
      const raw = localStorage.getItem("fs_chat_history");
      const arr = raw ? JSON.parse(raw) : null;
      if (Array.isArray(arr) && arr.length) return arr;
    } catch {}
    return [{ role: "assistant", content: "Xin chào 👋 Mình là trợ lý AI. Bạn cần tư vấn gì ạ?" }];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [badge, setBadge] = useState(1); // chấm đỏ trên nút

  const bottomRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, loading]);

  // ESC để đóng
  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  // Lưu lịch sử mỗi khi thay đổi
  useEffect(() => {
    try {
      localStorage.setItem("fs_chat_history", JSON.stringify(messages.slice(-12))); // giữ 12 turns gần nhất
    } catch {}
  }, [messages]);

  // ---- send message with stream + fallback ----
  async function sendMessage(e) {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || loading) return;

    setBadge(0); // đã mở chat
    const history = [...messages, { role: "user", content: text }];
    setMessages(history);
    setInput("");
    setLoading(true);

    // chỗ đổ text stream
    let acc = "";
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    try {
      // 1) thử stream trước
      const res = await fetch(`${API_BASE}/api/chat-gemini/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) throw new Error("stream-failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        // SSE: từng dòng "data: ..."
        chunk.split("\n").forEach((line) => {
          if (!line.startsWith("data: ")) return;
          const payload = line.slice(6);
          if (payload === "[DONE]") return;
          acc += payload;
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: "assistant", content: acc };
            return copy;
          });
        });
      }

      // stream xong mà vẫn rỗng => fallback
      if (!acc.trim()) throw new Error("empty-stream");
    } catch (err) {
      // 2) fallback non-stream
      try {
        const res2 = await fetch(`${API_BASE}/api/chat-gemini`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });
        const json = await res2.json();
        const text2 =
          json && typeof json.reply === "string" && json.reply.trim()
            ? json.reply
            : "Xin lỗi, hệ thống đang bận. Vui lòng thử lại.";

        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: text2 };
          return copy;
        });
      } catch {
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            role: "assistant",
            content: "Xin lỗi, hệ thống đang bận. Vui lòng thử lại.",
          };
          return copy;
        });
      }
    } finally {
      setLoading(false);
    }
  }

  // ---- UI: Floating button ----
  const FloatingButton = (
    <button
      onClick={() => setOpen(!open)}
      aria-label="Mở trợ lý"
      title="Trợ lý"
      style={{
        position: "fixed",
        right: 24,
        bottom: 24,
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: "none",
        background: "linear-gradient(135deg, #f472b6 0%, #8b5cf6 100%)",
        color: "#fff",
        boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
        cursor: "pointer",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22,
        transition: "transform .2s ease, box-shadow .2s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.07)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      💬
      {badge > 0 && (
        <span
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            width: 20,
            height: 20,
            background: "#ef4444",
            color: "#fff",
            borderRadius: "50%",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 0 2px #fff",
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );

  // ---- UI: Panel ----
  const Panel = (
    <div
      style={{
        position: "fixed",
        right: 24,
        bottom: 92,
        width: 360,
        maxWidth: "calc(100vw - 40px)",
        height: 480,
        maxHeight: "calc(100vh - 140px)",
        transform: open ? "translateY(0) scale(1)" : "translateY(16px) scale(0.98)",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        transition: "all .18s ease",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 24px 60px rgba(0,0,0,.22)",
        overflow: "hidden",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 12px",
          background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontWeight: 700 }}>🧠 {title}</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => window.open("/chatbot", "_self")} title="Mở toàn trang" style={iconBtn}>
            ⛶
          </button>
          <button onClick={() => setOpen(false)} title="Đóng" style={iconBtn}>
            ✕
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 12,
          background: "#fafafa",
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                maxWidth: "85%",
                whiteSpace: "pre-wrap",
                padding: "9px 12px",
                borderRadius: 12,
                background: m.role === "user" ? "#4f46e5" : "#fff",
                color: m.role === "user" ? "#fff" : "#111",
                border: m.role === "user" ? "none" : "1px solid #eee",
                boxShadow: m.role === "user" ? "none" : "0 1px 4px rgba(0,0,0,.04)",
                lineHeight: 1.45,
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div style={{ fontSize: 12, opacity: 0.6 }}>Đang soạn trả lời…</div>}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form onSubmit={sendMessage} style={{ padding: 10, borderTop: "1px solid #eee", background: "#fff" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập câu hỏi… (Shift+Enter xuống dòng)"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            rows={1}
            style={{
              flex: 1,
              resize: "none",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              padding: "10px 12px",
              outline: "none",
              fontSize: 14,
              background: "#fff",
            }}
          />
          <button
            disabled={loading || !input.trim()}
            title="Gửi"
            style={{
              minWidth: 44,
              padding: "0 14px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)",
              color: "#fff",
              fontWeight: 700,
              cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              opacity: loading || !input.trim() ? 0.6 : 1,
              transition: "transform .15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            ➤
          </button>
        </div>
        <div style={{ marginTop: 6, fontSize: 11, opacity: 0.6 }}>*Trợ lý cung cấp gợi ý tham khảo.</div>
      </form>
    </div>
  );

  return (
    <>
      {floating && FloatingButton}
      {Panel}
    </>
  );
}

const iconBtn = {
  height: 28,
  minWidth: 28,
  borderRadius: 8,
  border: "none",
  background: "rgba(255,255,255,.25)",
  color: "#fff",
  cursor: "pointer",
  fontSize: 14,
};
