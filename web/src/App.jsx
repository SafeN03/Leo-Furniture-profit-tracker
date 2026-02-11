import { useEffect, useMemo, useState } from "react";
import { api } from "./api";

const CATEGORIES = ["Living Room", "Dining Room", "Bedrooms", "Mattresses", "Rugs"];

const THEME = {
  bg0: "#05070B",
  bg1: "#0B1020",
  panel: "rgba(14, 18, 28, 0.78)",
  panel2: "rgba(10, 14, 22, 0.92)",
  border: "rgba(255,255,255,0.08)",
  border2: "rgba(59,130,246,0.25)", // blue
  text: "rgba(255,255,255,0.92)",
  text2: "rgba(255,255,255,0.72)",
  blue: "#2563EB",
  blue2: "#60A5FA",
  red: "#DC2626",
  red2: "#FB7185",
  green: "#22C55E",
  shadow: "0 18px 60px rgba(0,0,0,0.55)",
  glowBlue: "0 0 0 1px rgba(37,99,235,0.25), 0 0 24px rgba(37,99,235,0.22)",
  glowRed: "0 0 0 1px rgba(220,38,38,0.25), 0 0 24px rgba(220,38,38,0.16)",
};

function money(v) {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return `$${n.toFixed(2).replace(/\.00$/, ".00")}`;
}

function safeNumber(s) {
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function Btn({ children, variant = "blue", ...props }) {
  const base = {
    border: "1px solid transparent",
    borderRadius: 10,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700,
    letterSpacing: 0.2,
    transition: "transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease",
    userSelect: "none",
  };

  const styles =
    variant === "red"
      ? {
          background: `linear-gradient(180deg, ${THEME.red2}, ${THEME.red})`,
          boxShadow: THEME.glowRed,
          color: "white",
        }
      : variant === "ghost"
      ? {
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${THEME.border}`,
          color: THEME.text,
        }
      : {
          background: `linear-gradient(180deg, ${THEME.blue2}, ${THEME.blue})`,
          boxShadow: THEME.glowBlue,
          color: "white",
        };

  return (
    <button
      {...props}
      style={{
        ...base,
        ...styles,
        ...props.style,
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "scale(0.99)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {children}
    </button>
  );
}

function Card({ title, value, accent = "blue" }) {
  const glow = accent === "red" ? THEME.glowRed : THEME.glowBlue;
  const border = accent === "red" ? "rgba(220,38,38,0.35)" : "rgba(37,99,235,0.35)";
  return (
    <div
      style={{
        background: THEME.panel2,
        border: `1px solid ${border}`,
        borderRadius: 14,
        padding: 14,
        boxShadow: glow,
        minWidth: 180,
      }}
    >
      <div style={{ color: THEME.text2, fontSize: 12 }}>{title}</div>
      <div style={{ color: THEME.text, fontSize: 20, fontWeight: 900, marginTop: 6 }}>{value}</div>
    </div>
  );
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.68)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: THEME.panel2,
          border: `1px solid ${THEME.border2}`,
          borderRadius: 16,
          boxShadow: THEME.shadow,
          padding: 16,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: THEME.text }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: `1px solid ${THEME.border}`,
              color: THEME.text2,
              borderRadius: 10,
              padding: "6px 10px",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
        <div style={{ marginTop: 12 }}>{children}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [email, setEmail] = useState("safe@test.com");
  const [password, setPassword] = useState("password123");

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("inventory"); // inventory | sold | all

  // Add Item form
  const [showAdd, setShowAdd] = useState(true);
  const [itemNumber, setItemNumber] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [cost, setCost] = useState("");
  const [inStore, setInStore] = useState(true);
  const [soldPrice, setSoldPrice] = useState("");
  const [deliveryCost, setDeliveryCost] = useState("");

  // Mark sold modal
  const [sellOpen, setSellOpen] = useState(false);
  const [sellItem, setSellItem] = useState(null);
  const [sellPrice, setSellPrice] = useState("");
  const [sellDelivery, setSellDelivery] = useState("");

  async function refresh(t = token) {
    const [itemsRes, sumRes] = await Promise.all([
      api("/items", { token: t }),
      api("/analytics/summary", { token: t }),
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
        body: { email, password },
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

  const filteredItems = useMemo(() => {
    if (tab === "all") return items;
    if (tab === "sold") return items.filter((it) => it.in_store === false);
    return items.filter((it) => it.in_store !== false);
  }, [items, tab]);

  const computed = useMemo(() => {
    const sold = items.filter((it) => it.in_store === false);
    const inStock = items.filter((it) => it.in_store !== false);
    return {
      totalItems: items.length,
      soldItems: sold.length,
      inStock: inStock.length,
    };
  }, [items]);

  async function addItem(e) {
    e.preventDefault();
    setErr("");

    if (!itemNumber.trim()) return setErr("Item Number is required");
    if (!title.trim()) return setErr("Item Name is required");

    const nCost = safeNumber(cost);
    if (!Number.isFinite(nCost) || nCost < 0) return setErr("Cost must be a valid number");

    if (!inStore) {
      const nSold = safeNumber(soldPrice);
      const nDel = safeNumber(deliveryCost);
      if (!Number.isFinite(nSold) || nSold < 0) return setErr("Sold Price is required for sold items");
      if (!Number.isFinite(nDel) || nDel < 0) return setErr("Delivery Cost is required for sold items");
    }

    try {
      const body = {
        item_number: itemNumber.trim(),
        title: title.trim(),
        category,
        cost: nCost,
        in_store: inStore,
      };

      if (!inStore) {
        body.sold_price = safeNumber(soldPrice);
        body.delivery_price = safeNumber(deliveryCost);
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

  function openSell(it) {
    setSellItem(it);
    setSellPrice("");
    setSellDelivery("");
    setSellOpen(true);
  }

  async function confirmSell() {
    if (!sellItem) return;
    setErr("");

    const nSold = safeNumber(sellPrice);
    const nDel = safeNumber(sellDelivery);

    if (!Number.isFinite(nSold) || nSold < 0) return setErr("Enter a valid Sold Price");
    if (!Number.isFinite(nDel) || nDel < 0) return setErr("Enter a valid Delivery Cost");

    try {
      await api(`/items/${sellItem.id}`, {
        method: "PATCH",
        token,
        body: {
          in_store: false,
          sold_price: nSold,
          delivery_price: nDel,
          status: "sold",
        },
      });
      setSellOpen(false);
      setSellItem(null);
      await refresh(token);
    } catch (e2) {
      setErr(e2.message);
    }
  }

  // ---------------- LOGIN UI (mockup-like) ----------------
  if (!token) {
    return (
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 18,
          color: THEME.text,
          fontFamily: "system-ui",
          background: `
            radial-gradient(1200px 600px at 10% 10%, rgba(37,99,235,0.25), transparent 60%),
            radial-gradient(1000px 600px at 90% 30%, rgba(220,38,38,0.18), transparent 60%),
            linear-gradient(180deg, ${THEME.bg1}, ${THEME.bg0})
          `,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* “blurred showroom” vibe (no image needed) */}
        <div
          style={{
            position: "absolute",
            inset: -40,
            background:
              "linear-gradient(120deg, rgba(255,255,255,0.04), transparent 35%), radial-gradient(800px 500px at 55% 65%, rgba(255,255,255,0.06), transparent 60%)",
            filter: "blur(10px)",
            opacity: 0.9,
            pointerEvents: "none",
          }}
        />

        <div style={{ width: "100%", maxWidth: 520, position: "relative" }}>
          {/* Logo */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `linear-gradient(180deg, ${THEME.red2}, ${THEME.red})`,
                  boxShadow: THEME.glowRed,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 22,
                  fontWeight: 900,
                }}
              >
                L
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 0.6 }}>
                  LEO <span style={{ color: THEME.blue2 }}>Furniture</span>
                </div>
                <div style={{ color: THEME.text2, fontSize: 12 }}>Profit Tracker</div>
              </div>
            </div>
          </div>

          {/* Login card */}
          <div
            style={{
              background: THEME.panel,
              border: `1px solid ${THEME.border}`,
              borderRadius: 18,
              boxShadow: THEME.shadow,
              padding: 18,
              backdropFilter: "blur(10px)",
            }}
          >
            <div style={{ textAlign: "center", fontSize: 20, fontWeight: 900, marginBottom: 10 }}>
              Welcome Back!
            </div>

            <div
              style={{
                height: 1,
                background: "linear-gradient(90deg, transparent, rgba(96,165,250,0.35), transparent)",
                marginBottom: 14,
              }}
            />

            <form onSubmit={login} style={{ display: "grid", gap: 12 }}>
              <input
                style={{
                  width: "100%",
                  padding: 12,
                  boxSizing: "border-box",
                  borderRadius: 12,
                  border: `1px solid ${THEME.border}`,
                  background: "rgba(0,0,0,0.35)",
                  color: THEME.text,
                  outline: "none",
                }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
              />

              <input
                style={{
                  width: "100%",
                  padding: 12,
                  boxSizing: "border-box",
                  borderRadius: 12,
                  border: `1px solid ${THEME.border}`,
                  background: "rgba(0,0,0,0.35)",
                  color: THEME.text,
                  outline: "none",
                }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                type="password"
              />

              <Btn type="submit" variant="red" style={{ width: "100%", padding: "12px 14px", fontSize: 16 }}>
                Login
              </Btn>

              {err ? (
                <div style={{ color: THEME.red2, fontWeight: 700, textAlign: "center" }}>{err}</div>
              ) : null}
            </form>
          </div>

          <div style={{ marginTop: 14, textAlign: "center", color: THEME.text2, fontSize: 12 }}>
            © {new Date().getFullYear()} Leo Furniture
          </div>
        </div>
      </div>
    );
  }

  // ---------------- APP UI (mockup-like) ----------------
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        padding: 18,
        fontFamily: "system-ui",
        color: THEME.text,
        background: `
          radial-gradient(1200px 600px at 10% 10%, rgba(37,99,235,0.20), transparent 60%),
          radial-gradient(1000px 600px at 90% 30%, rgba(220,38,38,0.14), transparent 60%),
          linear-gradient(180deg, ${THEME.bg1}, ${THEME.bg0})
        `,
      }}
    >
      <div style={{ width: "100%", maxWidth: 1120 }}>
        {/* Top bar */}
        <div
          style={{
            background: THEME.panel2,
            border: `1px solid ${THEME.border}`,
            borderRadius: 16,
            padding: 14,
            boxShadow: THEME.shadow,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: `linear-gradient(180deg, ${THEME.red2}, ${THEME.red})`,
                boxShadow: THEME.glowRed,
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
              }}
            >
              L
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 0.4 }}>
                LEO <span style={{ color: THEME.blue2 }}>Furniture</span> Profit Tracker
              </div>
              <div style={{ fontSize: 12, color: THEME.text2 }}>Inventory • Sales • Profit</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ color: THEME.text2, fontSize: 12 }}>Welcome, Safe</div>
            <Btn variant="blue" onClick={logout} style={{ padding: "10px 12px" }}>
              Logout
            </Btn>
          </div>
        </div>

        {/* Tabs + Add button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              background: THEME.panel2,
              border: `1px solid ${THEME.border}`,
              borderRadius: 14,
              padding: 8,
            }}
          >
            {[
              { key: "inventory", label: "Inventory" },
              { key: "sold", label: "Sold Items" },
              { key: "all", label: "All Items" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid transparent",
                  cursor: "pointer",
                  background: tab === t.key ? "rgba(37,99,235,0.18)" : "transparent",
                  color: tab === t.key ? THEME.text : THEME.text2,
                  boxShadow: tab === t.key ? THEME.glowBlue : "none",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Btn
            variant="blue"
            onClick={() => setShowAdd((v) => !v)}
            style={{ minWidth: 160 }}
          >
            {showAdd ? "Hide Add Form" : "Add New Item"}
          </Btn>
        </div>

        {/* Summary */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 10 }}>Profit Summary</div>

          {summary ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
              <Card title="Gross Sales" value={money(summary.gross_sales)} accent="blue" />
              <Card title="Total Cost" value={money(summary.total_cost)} accent="blue" />
              <Card title="Total Delivery (Cost)" value={money(summary.total_delivery)} accent="red" />
              <Card title="Net Profit" value={money(summary.net_profit)} accent={Number(summary.net_profit) >= 0 ? "blue" : "red"} />
            </div>
          ) : (
            <div style={{ color: THEME.text2 }}>Loading summary...</div>
          )}
        </div>

        {/* Add Item form */}
        {showAdd ? (
          <div
            style={{
              marginTop: 14,
              background: THEME.panel2,
              border: `1px solid ${THEME.border}`,
              borderRadius: 16,
              padding: 14,
              boxShadow: THEME.shadow,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 900 }}>Add Item</div>
              <div style={{ color: THEME.text2, fontSize: 12 }}>All items are assumed Brand New.</div>
            </div>

            <form onSubmit={addItem} style={{ display: "grid", gap: 10, marginTop: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>
                <input
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: `1px solid ${THEME.border}`,
                    background: "rgba(0,0,0,0.35)",
                    color: THEME.text,
                    outline: "none",
                  }}
                  value={itemNumber}
                  onChange={(e) => setItemNumber(e.target.value)}
                  placeholder="Item Number (required)"
                />

                <input
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: `1px solid ${THEME.border}`,
                    background: "rgba(0,0,0,0.35)",
                    color: THEME.text,
                    outline: "none",
                  }}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Item Name / Title (required)"
                />

                <select
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: `1px solid ${THEME.border}`,
                    background: "rgba(0,0,0,0.35)",
                    color: THEME.text,
                    outline: "none",
                  }}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <input
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: `1px solid ${THEME.border}`,
                    background: "rgba(0,0,0,0.35)",
                    color: THEME.text,
                    outline: "none",
                  }}
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="Cost (what you paid)"
                  inputMode="decimal"
                />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 10, color: THEME.text2 }}>
                <input
                  type="checkbox"
                  checked={!inStore}
                  onChange={(e) => setInStore(!e.target.checked)}
                />
                Mark as Sold (asks Sold Price + Delivery Cost)
              </label>

              {!inStore ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>
                  <input
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      border: `1px solid ${THEME.border}`,
                      background: "rgba(0,0,0,0.35)",
                      color: THEME.text,
                      outline: "none",
                    }}
                    value={soldPrice}
                    onChange={(e) => setSoldPrice(e.target.value)}
                    placeholder="Sold Price"
                    inputMode="decimal"
                  />
                  <input
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      border: `1px solid ${THEME.border}`,
                      background: "rgba(0,0,0,0.35)",
                      color: THEME.text,
                      outline: "none",
                    }}
                    value={deliveryCost}
                    onChange={(e) => setDeliveryCost(e.target.value)}
                    placeholder="Delivery Cost (your expense)"
                    inputMode="decimal"
                  />
                </div>
              ) : null}

              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <Btn type="submit" variant="blue">
                  Add Item
                </Btn>
                {err ? <div style={{ color: THEME.red2, fontWeight: 800 }}>{err}</div> : null}
              </div>
            </form>
          </div>
        ) : null}

        {/* Inventory table */}
        <div style={{ marginTop: 14, background: THEME.panel2, border: `1px solid ${THEME.border}`, borderRadius: 16, boxShadow: THEME.shadow }}>
          <div style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 900 }}>
              {tab === "inventory" ? "Inventory" : tab === "sold" ? "Sold Items" : "All Items"}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ padding: "8px 10px", borderRadius: 12, border: `1px solid ${THEME.border2}`, boxShadow: THEME.glowBlue }}>
                <span style={{ color: THEME.text2 }}>Total Items: </span>
                <b>{computed.totalItems}</b>
              </div>
              <div style={{ padding: "8px 10px", borderRadius: 12, border: `1px solid rgba(220,38,38,0.30)`, boxShadow: THEME.glowRed }}>
                <span style={{ color: THEME.text2 }}>Sold: </span>
                <b>{computed.soldItems}</b>
              </div>
              <div style={{ padding: "8px 10px", borderRadius: 12, border: `1px solid ${THEME.border2}`, boxShadow: THEME.glowBlue }}>
                <span style={{ color: THEME.text2 }}>In Store: </span>
                <b>{computed.inStock}</b>
              </div>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                  {["Item #", "Name", "Category", "Status", "Cost", "Sold", "Delivery", "Profit", "Actions"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: 12,
                        borderBottom: `1px solid ${THEME.border}`,
                        color: THEME.text2,
                        fontSize: 12,
                        letterSpacing: 0.4,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((it) => {
                  const isSold = it.in_store === false;
                  const sold = Number(it.sold_price ?? 0);
                  const c = Number(it.purchase_price ?? 0);
                  const del = Number(it.delivery_price ?? 0);
                  const profit = isSold ? sold - c - del : null;

                  return (
                    <tr key={it.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
                      <td style={{ padding: 12, color: THEME.text }}>{it.item_number || "-"}</td>
                      <td style={{ padding: 12, color: THEME.text, fontWeight: 700 }}>{it.title}</td>
                      <td style={{ padding: 12, color: THEME.text2 }}>{it.category || "-"}</td>
                      <td style={{ padding: 12, color: isSold ? THEME.red2 : THEME.green, fontWeight: 800 }}>
                        {isSold ? "Sold" : "In Store"}
                      </td>
                      <td style={{ padding: 12, color: THEME.text2 }}>{money(it.purchase_price)}</td>
                      <td style={{ padding: 12, color: THEME.text2 }}>{it.sold_price ? money(it.sold_price) : "-"}</td>
                      <td style={{ padding: 12, color: THEME.text2 }}>{it.delivery_price ? money(it.delivery_price) : "-"}</td>
                      <td style={{ padding: 12, color: profit === null ? THEME.text2 : profit >= 0 ? THEME.green : THEME.red2, fontWeight: 900 }}>
                        {profit === null ? "-" : money(profit)}
                      </td>
                      <td style={{ padding: 12 }}>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          {!isSold ? (
                            <Btn variant="red" onClick={() => openSell(it)} style={{ padding: "10px 12px" }}>
                              Mark Sold
                            </Btn>
                          ) : (
                            <Btn variant="ghost" disabled style={{ opacity: 0.65, cursor: "not-allowed" }}>
                              Sold
                            </Btn>
                          )}

                          <Btn variant="ghost" onClick={() => deleteItem(it.id)} style={{ padding: "10px 12px" }}>
                            Delete
                          </Btn>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: 18, color: THEME.text2 }}>
                      No items in this view yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {err ? (
            <div style={{ padding: 14, color: THEME.red2, fontWeight: 900 }}>{err}</div>
          ) : null}
        </div>

        {/* Sell modal */}
        <Modal
          open={sellOpen}
          title={`Mark Sold — ${sellItem?.title || ""}`}
          onClose={() => {
            setSellOpen(false);
            setSellItem(null);
          }}
        >
          <div style={{ color: THEME.text2, fontSize: 12, marginBottom: 10 }}>
            Enter the final sale price and delivery cost (delivery is treated as an expense).
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <input
              style={{
                padding: 12,
                borderRadius: 12,
                border: `1px solid ${THEME.border}`,
                background: "rgba(0,0,0,0.35)",
                color: THEME.text,
                outline: "none",
              }}
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              placeholder="Sold Price"
              inputMode="decimal"
            />
            <input
              style={{
                padding: 12,
                borderRadius: 12,
                border: `1px solid ${THEME.border}`,
                background: "rgba(0,0,0,0.35)",
                color: THEME.text,
                outline: "none",
              }}
              value={sellDelivery}
              onChange={(e) => setSellDelivery(e.target.value)}
              placeholder="Delivery Cost"
              inputMode="decimal"
            />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
              <Btn variant="red" onClick={confirmSell}>
                Confirm Sold
              </Btn>
              <Btn
                variant="ghost"
                onClick={() => {
                  setSellOpen(false);
                  setSellItem(null);
                }}
              >
                Cancel
              </Btn>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
