const express = require("express");
const pool = require("../db/pool");
const { requireAuth } = require("../middleware/auth");
const { asyncWrap } = require("./_async");

const router = express.Router();

/**
 * Leo Furniture Profit Summary
 * Delivery is treated as a COST (expense), not revenue.
 *
 * gross_sales = sum(sold_price) for sold items
 * total_cost = sum(purchase_price) for ALL items (in store + sold)
 * total_delivery = sum(delivery_price) for sold items
 * net_profit = gross_sales - total_cost - total_delivery
 */
router.get(
  "/summary",
  requireAuth,
  asyncWrap(async (req, res) => {
    // Sales only come from sold items
    const salesRes = await pool.query(
      "SELECT COALESCE(SUM(sold_price), 0) AS gross_sales FROM items WHERE user_id=$1 AND in_store=false",
      [req.user.id]
    );

    // Cost is what you paid for inventory (all items)
    const costRes = await pool.query(
      "SELECT COALESCE(SUM(purchase_price), 0) AS total_cost FROM items WHERE user_id=$1",
      [req.user.id]
    );

    // Delivery is an expense for sold items only
    const deliveryRes = await pool.query(
      "SELECT COALESCE(SUM(delivery_price), 0) AS total_delivery FROM items WHERE user_id=$1 AND in_store=false",
      [req.user.id]
    );

    const gross_sales = Number(salesRes.rows[0].gross_sales);
    const total_cost = Number(costRes.rows[0].total_cost);
    const total_delivery = Number(deliveryRes.rows[0].total_delivery);

    const net_profit = gross_sales - total_cost - total_delivery;

    return res.json({ gross_sales, total_cost, total_delivery, net_profit });
  })
);

module.exports = router;
