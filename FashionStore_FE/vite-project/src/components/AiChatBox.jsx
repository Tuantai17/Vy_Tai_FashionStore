// src/components/AiChatBox.jsx
import { useEffect, useRef, useState } from "react";

const API_BASE = "http://127.0.0.1:8000/api";

// Các chế độ có sẵn (mục để chọn)
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
      "Bạn là trợ lý bán hàng. Hỏi nhu cầu, ngân sách, size, màu, chất liệu; sau đó gợi ý 3 sản phẩm phù hợp (nói chung chung, KHÔNG bịa dữ liệu tồn kho).",
  },
  {
    id: "order",
    label: "CSKH / Tra cứu đơn",
    system:
      "Bạn hỗ trợ khách tra cứu/tư vấn đơn hàng. KHÔNG bịa thông tin đơn; hướng dẫn khách vào trang 'Tài khoản -> Đơn hàng' để xem chi tiết. Nếu khách đưa mã đơn, yêu cầu thêm email/sđt để xác thực.",
  },
];

export default function AiChatBox({ startOpen = false }) {
  const [open, setOpen] = useState(startOpen);
  const [mode, setMode] = useState(() => localStorage.getItem("ai_chat_mode") || "general");
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("ai_chat_messages");
    return saved
      ? JSON.parse(saved)
      : [{ role: "assistant", content: "Xin chào 👋 Mình có thể giúp gì cho bạn?" }];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("ai_chat_messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("ai_chat_mode", mode);
  }, [mode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  async function sendMessage(e) {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text) return;

    const userMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Lấy system theo chế độ đã chọn
    const sys = MODES.find((m) => m.id === mode)?.system ?? MODES[0].system;

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: sys,
          messages: [...messages, userMsg],
        }),
      });
      const data = await res.json();
      const aiText = data?.message ?? "Xin lỗi, mình chưa nhận được phản hồi.";
      setMessages((prev) => [...prev, { role: "assistant", content: aiText }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Có lỗi khi gọi AI. Vui lòng thử lại." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([{ role: "assistant", content: "Đã xoá lịch sử. Bạn hỏi gì tiếp nhé!" }]);
    localStorage.removeItem("ai_chat_messages");
  }

  return (
    <>
      {/* Nút tròn nổi mở/đóng chat */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 rounded-full shadow-lg px-4 py-3 bg-blue-600 text-white hover:bg-blue-700"
        title="AI Chat"
        aria-label="AI Chat"
      >
        {open ? "✖" : "AI"}
      </button>

      {/* Hộp chat */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-96 h-[70vh] max-h-[600px] bg-white border shadow-xl rounded-2xl flex flex-col">
          <div className="px-4 py-3 border-b flex items-center justify-between gap-2">
            <div className="font-semibold">AI Chat</div>

            {/* Mục chọn chế độ */}
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="border rounded-lg px-2 py-1 text-sm"
              title="Chọn chế độ"
            >
              {MODES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="text-sm text-gray-500 hover:text-red-600"
                title="Xoá lịch sử chat"
              >
                Clear
              </button>
              <button onClick={() => setOpen(false)} className="text-lg leading-none">
                ×
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 bg-gray-50 space-y-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] p-3 rounded-2xl shadow ${
                  m.role === "user" ? "ml-auto bg-blue-600 text-white" : "mr-auto bg-white"
                }`}
              >
                <pre className="whitespace-pre-wrap break-words font-sans">{m.content}</pre>
              </div>
            ))}
            {loading && (
              <div className="mr-auto bg-white p-3 rounded-2xl shadow text-gray-500">Đang soạn…</div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={sendMessage} className="p-3 border-t flex gap-2">
            <input
              className="flex-1 border rounded-xl px-3 py-2 focus:outline-none focus:ring ring-blue-300"
              placeholder="Nhập câu hỏi…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50"
            >
              Gửi
            </button>
          </form>
        </div>
      )}
    </>
  );
}
