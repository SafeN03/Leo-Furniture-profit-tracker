require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { errorHandler } = require("./middleware/error");

const authRoutes = require("./routes/auth");
const itemsRoutes = require("./routes/items");
const expensesRoutes = require("./routes/expenses");
const analyticsRoutes = require("./routes/analytics");

const app = express();

app.use(express.json());
const allowed = (process.env.CORS_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: function (origin, cb) {
    if (!origin) return cb(null, true); 
    if (allowed.length === 0) return cb(null, true); 
    if (allowed.includes(origin)) return cb(null, true);
    return cb(new Error("CORS blocked"), false);
  }
}));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/items", itemsRoutes);
app.use("/expenses", expensesRoutes);
app.use("/analytics", analyticsRoutes);

app.use(errorHandler);

module.exports = app;
