// src/lib/api.js

// ✅ Base URL: ưu tiên ENV, nếu không có thì
// - Dev (localhost) -> dùng http://127.0.0.1:8000/api
// - Prod -> fallback Render của bạn
const DEFAULT_DEV = "http://127.0.0.1:8000/api";
const DEFAULT_PROD = "https://vytaifashionstore-production.up.railway.app/api";

export const API_BASE =
  import.meta.env.VITE_API_URL ||
  (location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? DEFAULT_DEV
    : DEFAULT_PROD);

/** Ghép base + path an toàn */
export function join(path) {
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Token helpers */
export function getToken() {
  return localStorage.getItem("token");
}
export function setToken(token) {
  if (!token) localStorage.removeItem("token");
  else localStorage.setItem("token", token);
}

/** Headers mặc định; nếu auth=true sẽ thêm Bearer token.
 *  Tự động bỏ Content-Type khi dùng FormData. */
export function buildHeaders({ auth = false, headers = {}, isFormData = false } = {}) {
  const base = isFormData ? {} : { "Content-Type": "application/json" };
  const out = {
    Accept: "application/json",
    ...base,
    ...headers,
  };
  if (auth) {
    const token = getToken();
    if (token) out.Authorization = `Bearer ${token}`;
  }
  return out;
}

/** Parse body tuỳ kiểu */
function normalizeBody(body) {
  if (body === undefined || body === null) return undefined;
  if (typeof body === "string") return body;
  if (body instanceof FormData) return body;
  return JSON.stringify(body);
}

/** Parse response → JSON/Text, ném lỗi có thông tin rõ ràng. */
async function handleResponse(res, { auth }) {
  if (res.ok) {
    if (res.status === 204) return null;
    const ct = res.headers.get("Content-Type") || "";
    if (ct.includes("application/json")) return res.json();
    return res.text();
  }

  // != 2xx
  let errorBody = "";
  try {
    const ct = res.headers.get("Content-Type") || "";
    errorBody = ct.includes("application/json")
      ? JSON.stringify(await res.json())
      : await res.text();
  } catch {}

  // Bắn sự kiện 401 để App có thể redirect /login
  if (res.status === 401 && auth) {
    window.dispatchEvent(new CustomEvent("auth:unauthorized"));
  }

  const err = new Error(`API ${res.status} ${res.statusText}${errorBody ? ` - ${errorBody}` : ""}`);
  err.status = res.status;
  err.body = errorBody;
  throw err;
}

/** Tạo query string từ object (hỗ trợ array) */
function buildQuery(query) {
  if (!query || typeof query !== "object") return "";
  const qs = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) v.forEach((val) => qs.append(k, String(val)));
    else qs.append(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

/**
 * Request tổng quát:
 *  - auth: tự thêm Bearer
 *  - timeout: mặc định 20s
 *  - FormData: tự bỏ Content-Type
 *  - query: object -> ?a=1&b=2
 */
export async function request(
  path,
  {
    method = "GET",
    auth = false,
    body,
    headers,
    query,           // { page: 1, per_page: 12 } hoặc { id: [1,2] }
    timeout = 20000, // ms
    signal,          // AbortSignal (tuỳ chọn)
    ...opts
  } = {}
) {
  let url = join(path) + buildQuery(query);

  const isFormData = body instanceof FormData;
  const init = {
    method,
    headers: buildHeaders({ auth, headers, isFormData }),
    body: normalizeBody(body),
    ...opts,
  };

  // Timeout bằng AbortController
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(new DOMException("Timeout", "AbortError")), timeout);
  // kết hợp signal bên ngoài (nếu có)
  const onAbort = () => ac.abort();
  if (signal) {
    if (signal.aborted) onAbort();
    else signal.addEventListener("abort", onAbort, { once: true });
  }

  try {
    const res = await fetch(url, { ...init, signal: ac.signal });
    return await handleResponse(res, { auth });
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener("abort", onAbort);
  }
}

/** Helpers ngắn gọn */
export const apiGet    = (path, opts = {})       => request(path, { method: "GET",    ...opts });
export const apiPost   = (path, body, opts = {}) => request(path, { method: "POST",   body, ...opts });
export const apiPut    = (path, body, opts = {}) => request(path, { method: "PUT",    body, ...opts });
export const apiPatch  = (path, body, opts = {}) => request(path, { method: "PATCH",  body, ...opts });
export const apiDelete = (path, opts = {})       => request(path, { method: "DELETE", ...opts });

/** Upload nhanh bằng FormData (ví dụ tạo sản phẩm có ảnh) */
export const apiUpload = (path, formData, opts = {}) =>
  request(path, { method: "POST", body: formData, ...opts });

/** Đăng ký/unregister listener 401 (dùng trong App.jsx) */
export function onUnauthorized(handler) {
  window.addEventListener("auth:unauthorized", handler);
  return () => window.removeEventListener("auth:unauthorized", handler);
}

/**
 * Gợi ý dùng trong App.jsx:
 *
 * import { onUnauthorized } from "@/lib/api";
 * const navigate = useNavigate();
 * useEffect(() => {
 *   const off = onUnauthorized(() => navigate("/login"));
 *   return off;
 * }, [navigate]);
 */
