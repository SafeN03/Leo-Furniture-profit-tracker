const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const pool = require("../db/pool");
const { asyncWrap } = require("./_async");

const router = express.Router();

const RegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6)
});

router.post("/register", asyncWrap(async (req, res) => {
  const { name, email, password } = RegisterSchema.parse(req.body);
  const password_hash = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      "INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id,name,email,role",
      [name, email.toLowerCase(), password_hash]
    );
    return res.status(201).json({ user: result.rows[0] });
  } catch (e) {
    if (String(e).includes("duplicate key")) {
      return res.status(409).json({ error: "Email already used" });
    }
    throw e;
  }
}));

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

router.post("/login", asyncWrap(async (req, res) => {
  const { email, password } = LoginSchema.parse(req.body);

  const result = await pool.query("SELECT * FROM users WHERE email=$1", [email.toLowerCase()]);
  const user = result.rows[0];
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.json({ token });
}));

module.exports = router;
