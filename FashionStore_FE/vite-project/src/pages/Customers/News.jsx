import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000";

export default function News() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [params, setParams] = useSearchParams();

  const page = Number(params.get("page") || 1);
  const q = params.get("q") || "";
  const source = params.get("source") || "";

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const url = new URL(`${API_BASE}/api/news`);
        url.searchParams.set("page", page);
        if (q) url.searchParams.set("q", q);
        if (source) url.searchParams.set("source", source);
        const res = await fetch(url);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        setItems(data.data || []);
        setMeta(data);
      } catch {
        setErr("Không tải được tin tức.");
      } finally {
        setLoading(false);
      }
    })();
  }, [page, q, source]);

  const onSearch = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    params.set("q", f.get("q") || "");
    params.set("page", "1");
    setParams(params, { replace: true });
  };

  return (
    <div style={{maxWidth:1100, margin:"0 auto", padding:20}}>
      <h1 style={{fontSize:28, fontWeight:800, marginBottom:16}}>Tin tức thời trang</h1>

      <form onSubmit={onSearch} style={{display:"flex", gap:12, marginBottom:20}}>
        <input name="q" defaultValue={q} placeholder="Tìm bài viết, nguồn…"
               style={{flex:1, padding:10, border:"1px solid #ddd", borderRadius:6}} />
        <button type="submit" style={{padding:"10px 16px", borderRadius:6, background:"#000", color:"#fff", border:"none"}}>
          Tìm kiếm
        </button>
      </form>

      {err && <div style={{color:"red"}}>{err}</div>}
      {loading ? <div>Đang tải…</div> : items.length === 0 ? (
        <div>Chưa có bài viết.</div>
      ) : (
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16}}>
          {items.map(a => (
            <Link key={a.id} to={`/news/${a.slug}`} style={{textDecoration:"none", color:"inherit"}}>
              <article style={{background:"#fff", border:"1px solid #eee", borderRadius:10, overflow:"hidden"}}>
                <div style={{aspectRatio:"16/9", background:"#fafafa"}}>
                  <img src={a.image_url || "https://placehold.co/600x400?text=Fashion"}
                       alt={a.title} style={{width:"100%", height:"100%", objectFit:"cover"}} />
                </div>
                <div style={{padding:12}}>
                  <div style={{fontSize:12, color:"#888", marginBottom:6}}>
                    {a.source} • {a.published_at ? new Date(a.published_at).toLocaleDateString("vi-VN") : ""}
                  </div>
                  <h3 style={{fontSize:16, fontWeight:700, color:"#000", marginBottom:6}}>{a.title}</h3>
                  <p style={{fontSize:14, color:"#555"}}>
                    {a.summary?.slice(0,120) ?? ""}{(a.summary?.length||0) > 120 ? "…" : ""}
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}

      {!!meta && meta.last_page > 1 && (
        <div style={{display:"flex", gap:8, justifyContent:"center", marginTop:20}}>
          {Array.from({length: meta.last_page}, (_,i)=>i+1).map(p => (
            <button key={p}
              onClick={() => { params.set("page", String(p)); setParams(params, {replace:true}); }}
              style={{
                padding:"8px 12px", border:"1px solid #ddd", borderRadius:6,
                background:p===meta.current_page?"#000":"#fff",
                color:p===meta.current_page?"#fff":"#000", cursor:"pointer"
              }}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
