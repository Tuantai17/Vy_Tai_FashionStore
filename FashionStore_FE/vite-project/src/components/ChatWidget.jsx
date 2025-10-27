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
  const [products, setProducts] = useState([]);
  const [signals, setSignals] = useState({});

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

  // ---- XÓA LỊCH SỬ (reset) ----
  function clearChatHistory() {
    if (!confirm("Bạn chắc chắn muốn xóa toàn bộ lịch sử cuộc trò chuyện này?")) return;

    const hello = { role: "assistant", content: "Xin chào 👋 Mình là trợ lý AI. Bạn cần tư vấn gì ạ?" };
    setMessages([hello]);
    setProducts([]);
    setSignals({});
    setInput("");

    try {
      localStorage.removeItem("fs_chat_history");
    } catch {}
  }

  // ---- send message with stream + fallback ----
  async function sendMessage(e, overrideText) {
    e?.preventDefault?.();
    const text = (typeof overrideText === 'string' ? overrideText : input).trim();
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

      // read stream (handled in robust JSON-aware loop below)
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        // SSE: từng dòng "data: ..."
        chunk.split("\n").forEach((line) => {
          if (!line.startsWith("data: ")) return;
          const payload = line.slice(6).trim();
          if (!payload || payload === "[DONE]") return;

          // Try parse JSON. The backend may send partial JSON increments
          let obj = null;
          try {
            obj = JSON.parse(payload);
          } catch (e) {
            // not JSON: treat as plain text chunk
          }

          if (obj) {
            // meta message (signals/products)
            if (obj.type === 'meta') {
              if (Array.isArray(obj.products)) setProducts(obj.products);
              if (obj.signals) setSignals(obj.signals);
              return;
            }

            // Some providers send { delta: 'text' } or { text: '...' } or nested content
            let piece = '';
            if (typeof obj.delta === 'string') piece = obj.delta;
            else if (typeof obj.text === 'string') piece = obj.text;
            else if (obj.candidate && obj.candidate.content && Array.isArray(obj.candidate.content.parts)) {
              // try extract text from candidate parts
              piece = obj.candidate.content.parts.map(p => p.text || '').join('');
            } else if (typeof obj.content === 'string') {
              piece = obj.content;
            }

            if (piece) {
              acc += piece;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: 'assistant', content: acc };
                return copy;
              });
              return;
            }

            // fallback: if JSON has products/signals fields
            if (Array.isArray(obj.products)) setProducts(obj.products);
            if (obj.signals) setSignals(obj.signals);
          } else {
            // plain text payload
            acc += payload;
            setMessages((m) => {
              const copy = [...m];
              copy[copy.length - 1] = { role: "assistant", content: acc };
              return copy;
            });
          }
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
        // Nếu backend trả về danh sách products, thêm message tóm tắt để FE hiển thị
        if (json && Array.isArray(json.products) && json.products.length) {
          setProducts(json.products);
        }
        if (json && json.signals) {
          setSignals(json.signals);
        }
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
          <button
            onClick={clearChatHistory}
            disabled={loading}
            title="Xóa lịch sử"
            style={{
              ...iconBtn,
              background: "rgba(239,68,68,.25)",
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            🗑
          </button>
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
        {/* Products area (from backend signals/products) */}
        {products && products.length > 0 && (
          <div style={{ marginTop: 8, padding: 8, background: '#fff', borderRadius: 10, border: '1px solid #eee' }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Gợi ý sản phẩm</div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
              {products.slice(0, 6).map((p, idx) => (
                <div key={idx} style={{ minWidth: 160, border: '1px solid #f0f0f0', borderRadius: 8, padding: 8, background: '#fff' }}>
                  <div style={{ height: 90, background: '#f8f8f8', borderRadius: 6, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {p.thumbnail ? <img src={p.thumbnail} alt={p.name} style={{ maxWidth: '100%', maxHeight: '100%' }} /> : <div style={{ fontSize: 12, color: '#999' }}>No image</div>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>{new Intl.NumberFormat('vi-VN').format(p.price)}đ</div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                    <button onClick={() => window.open(`/products/${p.id}`, '_self')} style={{ flex: 1, padding: '6px 8px', borderRadius: 8, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer' }}>Xem</button>
                    <button onClick={() => sendMessage(null, `Cho tôi xem chi tiết ${p.name} (id: ${p.id})`)} style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid #eee', background: '#fff', cursor: 'pointer' }}>Hỏi</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick suggestion chips based on signals */}
            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(signals?.keywords || []).slice(0, 4).map((kw, i) => (
                <button key={i} onClick={() => sendMessage(null, `Cho tôi xem sản phẩm trong danh mục: ${kw}`)} style={{ padding: '6px 10px', borderRadius: 20, border: '1px solid #eee', background: '#f3f4f6', cursor: 'pointer', fontSize: 12 }}>{kw}</button>
              ))}
              {signals && signals.budget && (
                <button onClick={() => sendMessage(null, `Cho tôi xem sản phẩm trong mức giá ${new Intl.NumberFormat('vi-VN').format(signals.budget)}đ`)} style={{ padding: '6px 10px', borderRadius: 20, border: '1px solid #eee', background: '#fef3c7', cursor: 'pointer', fontSize: 12 }}>Ngân sách: {new Intl.NumberFormat('vi-VN').format(signals.budget)}đ</button>
              )}
            </div>
          </div>
        )}

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
