import { useRef, useState } from "react";
import { getCustomerToken as getToken } from "../utils/authStorage";

// Robust API base resolver: prefer absolute URL in dev to avoid proxy 404/405
function resolveApiBase() {
  const envUrl = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "";
  if (envUrl && /^https?:\/\//i.test(envUrl)) return envUrl.replace(/\/$/, "");
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && window.location.port === "5173") {
    return "http://127.0.0.1:8000/api"; // direct to Laravel during local dev
  }
  return envUrl || "/api"; // use proxy or relative path otherwise
}
const API_BASE = resolveApiBase();

export default function ChatWidget({ open: controlledOpen, onOpenChange, hideButton = false }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Xin chào! Mình là FashionBot, trợ lý ảo của FashionStore. Mình có thể giúp gì cho bạn?" },
  ]);
  const abortRef = useRef(null);

  const normalize = (arr) =>
    (arr || [])
      .filter((m) => m && typeof m.role === "string" && typeof m.content === "string" && ["user","assistant","system"].includes(m.role))
      .slice(-20);

  const system = {
    role: "system",
    content:
      "Bạn là Trợ lý Ảo 'FashionBot' của cửa hàng thời trang FashionStore. Trả lời thân thiện, chuyên nghiệp; hỗ trợ sản phẩm, đơn hàng (mức hướng dẫn), chính sách và gợi ý phong cách.",
  };

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");

    const userMsg = { role: "user", content: text };
    const history = normalize([system, ...messages, userMsg]);
    setMessages((m) => [...m, userMsg, { role: "assistant", content: "" }]);

    try {
      if (abortRef.current) try { abortRef.current.abort(); } catch {}
      const controller = new AbortController();
      abortRef.current = controller;

      const params = new URLSearchParams({ message: text });
      const res = await fetch(`${API_BASE}/chat/stream?${params.toString()}`, {
        method: "GET",
        headers: {
          Accept: "text/event-stream",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        mode: "cors",
        signal: controller.signal,
      });

      if (!res.ok || !res.body) return fallback(text);

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const parts = acc.split("\n\n");
        acc = parts.pop() || "";
        for (const p of parts) {
          if (!p.startsWith("data:")) continue;
          const jsonStr = p.replace(/^data:\s*/, "");
          if (jsonStr === "[DONE]") continue;
          try {
            const evt = JSON.parse(jsonStr);
            const text = evt?.output_text ?? evt?.delta ?? evt?.data ?? "";
            if (!text) continue;
            setMessages((m) => {
              const copy = m.slice();
              const last = copy[copy.length - 1];
              if (last && last.role === "assistant") last.content += text;
              return copy;
            });
          } catch {}
        }
      }
    } catch (e) {
      console.error("widget stream error", e);
      await fallback(text);
    }
  }

  async function fallback(text) {
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ message: text }),
        mode: "cors",
      });
      const data = await res.json().catch(() => ({}));
      const reply = res.ok ? (data.reply || "") : (data?.message || "Xin lỗi, có lỗi xảy ra.");
      setMessages((m) => {
        const copy = m.slice();
        const last = copy[copy.length - 1];
        if (last && last.role === "assistant") last.content = reply;
        return copy;
      });
    } catch (e) {
      setMessages((m) => {
        const copy = m.slice();
        const last = copy[copy.length - 1];
        if (last && last.role === "assistant") last.content = "Xin lỗi, không kết nối được máy chủ chat.";
        return copy;
      });
    }
  }

  return (
    <>
      {/* Optional internal toggle button; can be hidden to control from parent */}
      {!hideButton && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="fixed right-5 bottom-24 z-[60] h-12 w-12 rounded-full shadow-xl bg-pink-600 hover:bg-pink-700 text-white flex items-center justify-center"
          title="Mở trợ lý mini"
          aria-label="Mini Chat"
        >
          {open ? "×" : "💬"}
        </button>
      )}

      {/* Mini panel */}
      {open && (
        <div className="fixed right-5 bottom-[110px] z-[60] w-80 h-[58vh] max-h-[520px] bg-white border shadow-2xl rounded-2xl flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b text-sm font-semibold">FashionBot • Mini</div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`max-w-[85%] p-2 rounded-2xl shadow ${m.role === 'user' ? 'ml-auto bg-pink-600 text-white' : 'mr-auto bg-white'}`}>
                <pre className="whitespace-pre-wrap break-words font-sans text-sm">{m.content}</pre>
              </div>
            ))}
          </div>
          <div className="p-2 border-t flex gap-2">
            <input
              className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring ring-pink-300"
              placeholder="Nhập câu hỏi…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <button onClick={send} className="px-3 py-2 rounded-xl bg-pink-600 text-white">Gửi</button>
          </div>
        </div>
      )}
    </>
  );
}
