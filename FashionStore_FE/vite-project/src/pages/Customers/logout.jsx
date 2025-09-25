const handleLogout = async () => {
  const token = localStorage.getItem("token");

  try {
    if (token) {
      // Gọi API logout để xoá token trong server
      const res = await fetch("http://127.0.0.1:8000/api/logout", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // gửi token
        },
      });

      // Log kết quả để debug (không bắt buộc)
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.warn("Logout API error:", data);
      }
    }
  } catch (err) {
    console.error("Logout request failed:", err);
  } finally {
    // ✅ Xoá localStorage bất kể API có thành công hay không
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // ✅ Chuyển về trang login
    window.location.href = "/login";
  }
};
