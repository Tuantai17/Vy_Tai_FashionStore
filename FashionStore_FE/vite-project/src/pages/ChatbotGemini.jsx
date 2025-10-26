import { useState, useRef, useEffect } from "react";

export default function ChatbotGemini() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Chào bạn! Mình là trợ lý AI của FashionStore. Bạn cần tư vấn gì ạ?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const scrollBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollBottom, [messages, loading]);

  // 👇 HÀM NÀY chính là phần bạn dán ở trên
  async function sendMessage(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    // Khởi tạo chỗ để đổ dần text stream
    let acc = "";
    setMessages(m => [...m, { role: "assistant", content: "" }]);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/chat-gemini/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next })
      });

      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        // Mỗi chunk theo dạng SSE: 'data: ...\n\n'
        chunk.split("\n").forEach(line => {
          if (line.startsWith("data: ")) {
            const payload = line.slice(6);
            if (payload === "[DONE]") return;
            acc += payload;
            // Cập nhật message assistant cuối
            setMessages(m => {
              const copy = [...m];
              copy[copy.length - 1] = { role: "assistant", content: acc };
              return copy;
            });
          }
        });
      }
    } catch (err) {
      console.error(err);
      setMessages(m => [...m, { role: "assistant", content: "Xin lỗi, hệ thống đang bận. Vui lòng thử lại." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 h-[calc(100vh-120px)] flex flex-col">
      <h1 className="text-2xl font-semibold mb-3">AI Trợ lý (Gemini)</h1>

      <div className="flex-1 overflow-y-auto border rounded-xl p-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <div className={`inline-block px-3 py-2 rounded-2xl
              ${m.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-left text-sm opacity-70">Đang soạn trả lời…</div>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Hỏi về sản phẩm, size, đổi trả…"
          className="flex-1 border rounded-xl px-4 py-2 outline-none"
        />
        <button disabled={loading} className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50">
          Gửi
        </button>
      </form>
      <p className="text-xs mt-2 opacity-60">
        *Trợ lý chỉ cung cấp gợi ý. Vui lòng kiểm tra thông tin trước khi đặt hàng.
      </p>
    </div>
  );
}
