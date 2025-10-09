import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000";

export default function NewsDetail() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(`${API_BASE}/api/news/${slug}`);
        if (!res.ok) throw new Error("HTTP " + res.status);
        setData(await res.json());
      } catch {
        setErr("Không tải được bài viết.");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) return <div style={{padding:20}}>Đang tải…</div>;
  if (err) return <div style={{padding:20, color:"red"}}>{err}</div>;
  if (!data) return null;

  return (
    <div style={{maxWidth:860, margin:"0 auto", padding:20}}>
      <Link to="/news" style={{color:"#666", textDecoration:"none"}}>← Quay lại danh sách</Link>
      <h1 style={{fontSize:28, fontWeight:800, margin:"12px 0"}}>{data.title}</h1>
      <div style={{fontSize:13, color:"#888"}}>
        {data.source} • {data.published_at ? new Date(data.published_at).toLocaleString("vi-VN") : ""}
        {data.author ? ` • ${data.author}` : ""}
      </div>
      {data.image_url && (
        <div style={{margin:"16px 0"}}>
          <img src={data.image_url} alt={data.title} style={{width:"100%", borderRadius:8}} />
        </div>
      )}
      <div style={{fontSize:16, color:"#333", lineHeight:1.8}}
           dangerouslySetInnerHTML={{__html: data.content_html || (data.summary || "")}} />
      <a href={data.url} target="_blank" rel="noreferrer"
         style={{display:"inline-block", marginTop:16, color:"#0a7", textDecoration:"underline"}}>
        Đọc bản gốc
      </a>
    </div>
  );
}
