// import { Outlet } from "react-router-dom";
// import AdminSidebar from "../components/AdminSidebar";
// import AdminHeader from "../components/AdminHeader";

// const layoutStyle = {
//   display: "grid",
//   gridTemplateColumns: "260px 1fr",
//   gridTemplateRows: "60px 1fr",
//   height: "100vh",
//   background: "#f7f8fa",
// };

// export default function AdminLayout() {
//   return (
//     <div style={layoutStyle}>
//       <aside style={{ gridRow: "1 / span 2", borderRight: "1px solid #eee", background: "#fff" }}>
//         <AdminSidebar />
//       </aside>

//       <header style={{ gridColumn: 2, background: "#fff", borderBottom: "1px solid #eee" }}>
//         <AdminHeader />
//       </header>

//       <main style={{ padding: 16, overflow: "auto" }}>
//         <Outlet />
//       </main>
//     </div>
//   );
// }




import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";

const layoutStyle = {
  display: "grid",
  gridTemplateColumns: "260px 1fr",
  gridTemplateRows: "60px 1fr",
  height: "100vh",
  background: "transparent", // để lộ background bầu trời phía sau
  position: "relative",
  zIndex: 1,
};

// tạo vài đèn lồng với khác nhau về vị trí/tốc độ
const lanternsConfig = [
  { left: "5%",  size: 42, delay: 0,   dur: 22 },
  { left: "15%", size: 36, delay: 3,   dur: 26 },
  { left: "25%", size: 50, delay: 6,   dur: 28 },
  { left: "35%", size: 40, delay: 1.5, dur: 24 },
  { left: "48%", size: 34, delay: 4,   dur: 25 },
  { left: "60%", size: 46, delay: 2,   dur: 27 },
  { left: "72%", size: 38, delay: 7,   dur: 23 },
  { left: "82%", size: 44, delay: 9,   dur: 29 },
  { left: "90%", size: 32, delay: 11,  dur: 21 },
];

export default function AdminLayout() {
  return (
    <>
      {/* NỀN BẦU TRỜI + SAO + TRĂNG + ĐÈN LỒNG */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
          // bầu trời đêm + gradient mịn
          background:
            "radial-gradient(1200px 800px at 70% -10%, rgba(255,255,255,0.15), rgba(255,255,255,0) 40%), linear-gradient(180deg, #081226 0%, #0b1631 40%, #0b1736 60%, #0a1531 100%)",
        }}
      >
        {/* lớp sao lấp lánh */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,.9) 40%, transparent 41%), radial-gradient(1.5px 1.5px at 60% 70%, rgba(255,255,255,.8) 40%, transparent 41%), radial-gradient(1.7px 1.7px at 80% 20%, rgba(255,255,255,.75) 40%, transparent 41%), radial-gradient(1.2px 1.2px at 35% 80%, rgba(255,255,255,.85) 40%, transparent 41%)",
            backgroundRepeat: "repeat",
            backgroundSize: "400px 300px, 380px 280px, 420px 320px, 360px 260px",
            animation: "twinkle 6s linear infinite",
            opacity: 0.8,
          }}
        />

        {/* TRĂNG */}
        <div
          style={{
            position: "absolute",
            right: 32,
            top: 24,
            width: 110,
            height: 110,
            borderRadius: "50%",
            boxShadow:
              "0 0 30px 8px rgba(255, 248, 180, .55), 0 0 80px 10px rgba(255, 240, 150, .35)",
            background:
              "radial-gradient(closest-side, #ffeaa7 0%, #ffd56b 40%, #ffcc4d 60%, #f7b733 80%, #f7b733 100%)",
            filter: "saturate(105%)",
            opacity: 0.95,
          }}
        />

        {/* ĐÈN LỒNG bay lên (CSS thuần) */}
        {lanternsConfig.map((l, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: l.left,
              bottom: -150,
              width: l.size,
              height: l.size * 1.25,
              transform: "translateX(-50%)",
              // thân đèn
              background:
                "linear-gradient(180deg, #ff9f43 0%, #ff6b6b 60%, #e84118 100%)",
              borderRadius: "18px 18px 22px 22px",
              boxShadow:
                "0 0 14px rgba(255,120,60,.55), inset 0 0 20px rgba(255,255,255,.25)",
              animation: `floatUp ${l.dur}s linear ${l.delay}s infinite`,
              opacity: 0.95,
            }}
          >
            {/* miệng đèn */}
            <i
              style={{
                position: "absolute",
                top: -6,
                left: "50%",
                transform: "translateX(-50%)",
                width: l.size * 0.7,
                height: 8,
                borderRadius: 6,
                background:
                  "linear-gradient(90deg, rgba(0,0,0,.35), rgba(255,255,255,.25), rgba(0,0,0,.35))",
                display: "block",
              }}
            />
            {/* ánh đèn */}
            <b
              style={{
                position: "absolute",
                bottom: 10,
                left: "50%",
                transform: "translateX(-50%)",
                width: l.size * 0.45,
                height: l.size * 0.45,
                borderRadius: "50%",
                background:
                  "radial-gradient(closest-side, rgba(255,225,120,.95), rgba(255,174,66,.75) 60%, rgba(255,140,66,.25) 100%)",
                boxShadow:
                  "0 0 18px 6px rgba(255,180,72,.55), 0 0 40px 10px rgba(255,120,60,.25)",
                filter: "blur(0.2px)",
                display: "block",
              }}
            />
            {/* dây đèn */}
            <em
              style={{
                position: "absolute",
                bottom: -14,
                left: "50%",
                transform: "translateX(-50%)",
                width: 2,
                height: 16,
                background: "rgba(255,220,120,.7)",
                display: "block",
              }}
            />
          </span>
        ))}
      </div>

      {/* KHUNG ADMIN GIỮ NGUYÊN CẤU TRÚC */}
      <div style={layoutStyle}>
        <aside
          style={{
            gridRow: "1 / span 2",
            borderRight: "1px solid #e9edf3",
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(6px)",
          }}
        >
          <AdminSidebar />
        </aside>

        <header
          style={{
            gridColumn: 2,
            background: "rgba(255,255,255,0.85)",
            borderBottom: "1px solid #e9edf3",
            backdropFilter: "blur(6px)",
          }}
        >
          <AdminHeader />
        </header>

        <main
          style={{
            padding: 16,
            overflow: "auto",
            // thẻ nội dung sáng, bay trên nền
            background: "transparent",
            position: "relative",
            zIndex: 2,
          }}
        >
          <Outlet />
        </main>
      </div>

      {/* CSS keyframes cho sao và đèn lồng */}
      <style>{`
        @keyframes twinkle {
          0%   { opacity: .85; transform: translateY(0px); }
          50%  { opacity: 1;   transform: translateY(-0.8px); }
          100% { opacity: .85; transform: translateY(0px); }
        }
        @keyframes floatUp {
          0% {
            transform: translate(-50%, 0) rotate(0deg);
            opacity: .0;
          }
          5% { opacity: .95; }
          50% { transform: translate(-50%, -50vh) rotate(2deg); }
          100% {
            transform: translate(-50%, -110vh) rotate(-2deg);
            opacity: .2;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          span { animation-duration: 0s !important; }
        }
      `}</style>
    </>
  );
}
