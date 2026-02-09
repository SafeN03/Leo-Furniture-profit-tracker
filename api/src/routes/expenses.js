const express = require("express");
const { z } = require("zod");
const pool = require("../db/pool");
const { requireAuth } = require("../middleware/auth");
const { asyncWrap } = require("./_async");

const router = express.Router();

const ExpenseCreate = z.object({
  item_id: z.number().int(),
  type: z.enum(["shipping", "platform_fee", "supplies", "tax", "other"]),
  amount: z.number().positive()
});

router.post("/", requireAuth, asyncWrap(async (req, res) => {
  const body = ExpenseCreate.parse(req.body);

  const item = await pool.query(
    "SELECT id FROM items WHERE id=$1 AND user_id=$2",
    [body.item_id, req.user.id]
  );
  if (!item.rows[0]) return res.status(404).json({ error: "Item not found" });

  const result = await pool.query(
    "INSERT INTO expenses(item_id,type,amount) VALUES($1,$2,$3) RETURNING *",
    [body.item_id, body.type, body.amount]
  );

  return res.status(201).json({ expense: result.rows[0] });
}));

module.exports = router;
