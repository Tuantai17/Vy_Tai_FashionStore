import { getCustomerToken, clearCustomerSession } from "../../utils/authStorage";

const handleLogout = async () => {
  const token = getCustomerToken();

  try {
    if (token) {
      await fetch("http://127.0.0.1:8000/api/logout", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).then((res) => res.json().catch(() => ({}))).catch(() => {});
    }
  } catch (err) {
    console.error("Logout request failed:", err);
  } finally {
    clearCustomerSession();
    window.location.href = "/login";
  }
};

export default handleLogout;
