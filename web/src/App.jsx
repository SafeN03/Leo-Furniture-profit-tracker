import { useEffect, useState } from "react";
import { api } from "./api";

const CATEGORIES = ["Living Room", "Dining Room", "Bedrooms", "Mattresses", "Rugs"];

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [email, setEmail] = useState("safe@test.com");
  const [password, setPassword] = useState("password123");

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [err, setErr] = useState("");

  // Leo Furniture Add Item form
  const [itemNumber, setItemNumber] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [cost, setCost] = useState("");
  const [inStore, setInStore] = useState(true);
  const [soldPrice, setSoldPrice] = useState("");
  const [deliveryCost, setDeliveryCost] = useState("");

  async function refresh(t = token) {
    const [itemsRes, sumRes] = await Promise.all([
      api("/items", { token: t }),
      api("/analytics/summary", { token: t })
    ]);
    setItems(itemsRes.items || []);
    setSummary(sumRes);
  }

  async function login(e) {
    e.preventDefault();
    setErr("");
    try {
      const res = await api("/auth/login", {
        method: "POST",
        body: { email, password }
      });
      localStorage.setItem("token", res.token);
      setToken(res.token);
      await refresh(res.token);
    } catch (e2) {
      setErr(e2.message);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    setToken("");
    setItems([]);
    setSummary(null);
    setErr("");
  }

  useEffect(() => {
    if (token) refresh(token).catch(() => logout());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addItem(e) {
    e.preventDefault();
    setErr("");

    if (!itemNumber.trim()) return setErr("Item Number is required");
    if (!title.trim()) return setErr("Title is required");
    if (cost === "" || Number(cost) < 0) return setErr("Cost must be a valid number");

    if (!inStore) {
      if (soldPrice === "" || Number(soldPrice) < 0) return setErr("Sold price is required for sold items");
      if (deliveryCost === "" || Number(deliveryCost) < 0) return setErr("Delivery cost is required for sold items");
    }

    try {
      const body = {
        item_number: itemNumber.trim(),
        title: title.trim(),
        category,
        cost: Number(cost),
        in_store: inStore
      };

      if (!inStore) {
        body.sold_price = Number(soldPrice);
        body.delivery_price = Number(deliveryCost);
      }

      await api("/items", { method: "POST", token, body });

      setItemNumber("");
      setTitle("");
      setCost("");
      setInStore(true);
      setSoldPrice("");
      setDeliveryCost("");

      await refresh(token);
    } catch (e2) {
      setErr(e2.message);
    }
  }

  async function deleteItem(id) {
    const ok = window.confirm("Delete this item? This cannot be undone.");
    if (!ok) return;

    setErr("");
    try {
      await api(`/items/${id}`, { method: "DELETE", token });
      await refresh(token);
    } catch (e2) {
      setErr(e2.message);
    }
  }

  // ---------- UI ----------
  if (!token) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          fontFamily: "system-ui"
        }}
      >
        <div style={{ width: "100%", maxWidth: 420 }}>
          <h2 style={{ marginTop: 0 }}>Leo Furniture Profit Tracker</h2>

          <form onSubmit={login}>
            <div style={{ marginBottom: 8 }}>
              <input
                style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email"
              />
            </div>

            <div style={{ marginBottom: 8 }}>
              <input
                style={{ width: "100%", padding: 10, boxSizing: "border-box" }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                type="password"
              />
            </div>

            <button style={{ padding: 10, width: "100%" }} type="submit">
              Login
            </button>

            {err ? <p style={{ color: "crimson" }}>{err}</p> : null}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        padding: 16,
        fontFamily: "system-ui"
      }}
    >
      <div style={{ width: "100%", maxWidth: 980 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0 }}>Leo Furniture Profit Tracker</h2>
          <button onClick={logout}>Logout</button>
        </div>

        <h3>Profit Summary</h3>
        {summary ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
              <div>Gross Sales</div>
              <b>${summary.gross_sales}</b>
            </div>
            <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
              <div>Total Cost</div>
              <b>${summary.total_cost}</b>
            </div>
            <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
              <div>Total Delivery (Cost)</div>
              <b>${summary.total_delivery}</b>
            </div>
            <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
              <div>Net Profit</div>
              <b>${summary.net_profit}</b>
            </div>
          </div>
        ) : (
          <p>Loading summary...</p>
        )}

        <h3 style={{ marginTop: 24 }}>Add Item</h3>
        <form onSubmit={addItem} style={{ display: "grid", gap: 10, border: "1px solid #ddd", padding: 12, borderRadius: 10 }}>
          <input
            style={{ padding: 10, boxSizing: "border-box" }}
            value={itemNumber}
            onChange={(e) => setItemNumber(e.target.value)}
            placeholder="Item Number (required)"
          />

          <input
            style={{ padding: 10, boxSizing: "border-box" }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Item Name / Title (required)"
          />

          <select style={{ padding: 10, boxSizing: "border-box" }} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <input
            style={{ padding: 10, boxSizing: "border-box" }}
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="Cost (what you paid)"
            inputMode="decimal"
          />

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={!inStore} onChange={(e) => setInStore(!e.target.checked)} />
            Mark as Sold (if checked, we’ll ask sold price + delivery cost)
          </label>

          {!inStore ? (
            <>
              <input
                style={{ padding: 10, boxSizing: "border-box" }}
                value={soldPrice}
                onChange={(e) => setSoldPrice(e.target.value)}
                placeholder="Sold Price"
                inputMode="decimal"
              />
              <input
                style={{ padding: 10, boxSizing: "border-box" }}
                value={deliveryCost}
                onChange={(e) => setDeliveryCost(e.target.value)}
                placeholder="Delivery Cost (your expense)"
                inputMode="decimal"
              />
            </>
          ) : null}

          <button style={{ padding: 10 }} type="submit">
            Add Item
          </button>

          {err ? <p style={{ color: "crimson", margin: 0 }}>{err}</p> : null}
        </form>

        <h3 style={{ marginTop: 24 }}>Inventory</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Item #</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Name</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Category</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Status</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Cost</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Sold</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Delivery</th>
                <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: 8 }}>Delete</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{it.item_number || "-"}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{it.title}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{it.category || "-"}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{it.in_store === false ? "Sold" : "In Store"}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>${it.purchase_price}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{it.sold_price ? `$${it.sold_price}` : "-"}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{it.delivery_price ? `$${it.delivery_price}` : "-"}</td>
                  <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>
                    <button onClick={() => deleteItem(it.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ marginTop: 18, color: "#555" }}>
          Note: All items are assumed <b>Brand New</b>.
        </p>

        {err ? <p style={{ color: "crimson" }}>{err}</p> : null}
      </div>
    </div>
  );
}
