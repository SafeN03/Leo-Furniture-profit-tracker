const express = require("express");
const { z } = require("zod");
const pool = require("../db/pool");
const { requireAuth } = require("../middleware/auth");
const { asyncWrap } = require("./_async");

const router = express.Router();

const ItemCreate = z.object({
  item_number: z.string().min(1),
  title: z.string().min(1),
  category: z.enum(["Living Room", "Dining Room", "Bedrooms", "Mattresses", "Rugs"]),
  cost: z.number().nonnegative(),
  in_store: z.boolean(),
  sold_price: z.number().nonnegative().optional(),
  delivery_price: z.number().nonnegative().optional()
});


router.get("/", requireAuth, asyncWrap(async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM items WHERE user_id=$1 ORDER BY created_at DESC",
    [req.user.id]
  );
  return res.json({ items: result.rows });
}));

router.post("/", requireAuth, asyncWrap(async (req, res) => {
  const body = ItemCreate.parse(req.body);

  // If sold, sold_price is required
  if (!body.in_store && (body.sold_price === undefined || body.sold_price === null)) {
    return res.status(400).json({ error: "sold_price is required when item is sold" });
  }

  const result = await pool.query(
    `INSERT INTO items(
      user_id,
      item_number,
      title,
      category,
      purchase_price,
      sold_price,
      in_store,
      delivery_price,
      status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *`,
    [
      req.user.id,
      body.item_number,
      body.title,
      body.category,
      body.cost,
      body.in_store ? null : (body.sold_price ?? 0),
      body.in_store,
      body.in_store ? 0 : (body.delivery_price ?? 0),
      body.in_store ? "in_store" : "sold"
    ]
  );

  return res.status(201).json({ item: result.rows[0] });
}));


const ItemUpdate = z.object({
  status: z.enum(["listed", "sold", "shipped", "returned"]).optional(),
  sold_price: z.number().nonnegative().optional()
});

router.patch("/:id", requireAuth, asyncWrap(async (req, res) => {
  const id = Number(req.params.id);
  const patch = ItemUpdate.parse(req.body);

  const fields = [];
  const vals = [];
  let i = 1;

  for (const [k, v] of Object.entries(patch)) {
    fields.push(`${k}=$${i++}`);
    vals.push(v);
  }
  if (!fields.length) return res.status(400).json({ error: "No fields" });

  vals.push(id, req.user.id);

  const result = await pool.query(
    `UPDATE items SET ${fields.join(", ")}
     WHERE id=$${i++} AND user_id=$${i}
     RETURNING *`,
    vals
  );

  if (!result.rows[0]) return res.status(404).json({ error: "Not found" });
  return res.json({ item: result.rows[0] });
}));

router.delete("/:id", requireAuth, asyncWrap(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  const result = await pool.query(
    "DELETE FROM items WHERE id=$1 AND user_id=$2 RETURNING id",
    [id, req.user.id]
  );

  if (!result.rows[0]) return res.status(404).json({ error: "Not found" });
  return res.json({ ok: true });
}));


module.exports = router;
