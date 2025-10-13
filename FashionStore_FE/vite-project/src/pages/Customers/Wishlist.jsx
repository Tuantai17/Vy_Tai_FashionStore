// // src/pages/Customers/Wishlist.jsx
// import { useEffect, useState } from "react";
// const API_BASE = "http://127.0.0.1:8000/api";

// export default function Wishlist() {
//   const [items, setItems] = useState([]);
//   const token =
//     localStorage.getItem("token") || localStorage.getItem("authToken") || "";

//   useEffect(() => {
//     if (!token) return;
//     fetch(`${API_BASE}/wishlist`, {
//       headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
//     })
//       .then((r) => r.json())
//       .then(setItems)
//       .catch(console.error);
//   }, [token]);

//   if (!token) {
//     return <div>Vui lòng <a href="/login" className="underline">đăng nhập</a> để xem danh sách yêu thích.</div>;
//   }

//   return (
//     <div>
//       <h2 className="text-xl font-semibold mb-3">❤️ Danh sách yêu thích</h2>
//       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
//         {items.map((it) => (
//           <div key={it.id} className="border rounded-lg p-3">
//             <img className="w-full aspect-square object-cover rounded" src={it.product?.thumbnail_url || it.product?.thumbnail} alt={it.product?.name} />
//             <div className="mt-2 font-medium">{it.product?.name}</div>
//           </div>
//         ))}
//         {!items.length && <div className="text-gray-600 col-span-full">Chưa có sản phẩm yêu thích.</div>}
//       </div>
//     </div>
//   );
// }
