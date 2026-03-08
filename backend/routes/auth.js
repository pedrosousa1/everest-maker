// routes/auth.js — async via dbHelpers
const express = require("express");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { queryOne, run } = require("../dbHelpers");
const { signToken, verifyToken } = require("../auth");

const router = express.Router();

function userToFrontend(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    partnerName: u.partner_name || undefined,
    createdAt: u.created_at,
  };
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, partnerName } = req.body;
    if (!name || !email || !password)
      return res
        .status(400)
        .json({ error: "Nome, e-mail e senha sao obrigatorios." });
    if (password.length < 6)
      return res
        .status(400)
        .json({ error: "A senha deve ter pelo menos 6 caracteres." });

    const existing = await queryOne("SELECT id FROM users WHERE email = ?", [
      email.toLowerCase().trim(),
    ]);
    if (existing)
      return res.status(409).json({ error: "Este e-mail ja esta cadastrado." });

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const now = new Date().toISOString();

    await run(
      "INSERT INTO users (id, name, email, password_hash, partner_name, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [
        userId,
        name.trim(),
        email.toLowerCase().trim(),
        passwordHash,
        partnerName?.trim() || null,
        now,
      ],
    );

    res.status(201).json({
      token: signToken({ userId }),
      user: {
        id: userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        partnerName: partnerName?.trim() || undefined,
        createdAt: now,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Erro interno ao criar conta." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ error: "E-mail e senha sao obrigatorios." });

    const user = await queryOne("SELECT * FROM users WHERE email = ?", [
      email.toLowerCase().trim(),
    ]);
    if (!user)
      return res.status(401).json({ error: "E-mail ou senha incorretos." });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ error: "E-mail ou senha incorretos." });

    res.json({
      token: signToken({ userId: user.id }),
      user: userToFrontend(user),
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Erro interno ao fazer login." });
  }
});

router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await queryOne(
      "SELECT id, name, email, partner_name, created_at FROM users WHERE id = ?",
      [req.userId],
    );
    if (!user)
      return res.status(404).json({ error: "Usuario nao encontrado." });
    res.json(userToFrontend(user));
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Erro interno." });
  }
});

router.put("/me", verifyToken, async (req, res) => {
  try {
    const { name, partnerName, currentPassword, newPassword } = req.body;
    const user = await queryOne("SELECT * FROM users WHERE id = ?", [
      req.userId,
    ]);
    if (!user)
      return res.status(404).json({ error: "Usuario nao encontrado." });

    let passwordHash = user.password_hash;
    if (newPassword) {
      if (!currentPassword)
        return res
          .status(400)
          .json({ error: "Informe a senha atual para alterar." });
      const valid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!valid)
        return res.status(401).json({ error: "Senha atual incorreta." });
      if (newPassword.length < 6)
        return res
          .status(400)
          .json({ error: "A nova senha deve ter pelo menos 6 caracteres." });
      passwordHash = await bcrypt.hash(newPassword, 10);
    }

    await run(
      "UPDATE users SET name = ?, partner_name = ?, password_hash = ? WHERE id = ?",
      [
        name?.trim() || user.name,
        partnerName?.trim() || null,
        passwordHash,
        req.userId,
      ],
    );

    const updated = await queryOne(
      "SELECT id, name, email, partner_name, created_at FROM users WHERE id = ?",
      [req.userId],
    );
    res.json(userToFrontend(updated));
  } catch (err) {
    console.error("Update me error:", err);
    res.status(500).json({ error: "Erro interno ao atualizar perfil." });
  }
});

module.exports = router;
