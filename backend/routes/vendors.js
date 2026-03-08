// ════════════════════════════════════
// routes/vendors.js
// CRUD de fornecedores (com ratings)
// ════════════════════════════════════

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../db");
const { verifyToken } = require("../auth");

const router = express.Router();
router.use(verifyToken);

function getWeddingId(userId) {
  const w = db.prepare("SELECT id FROM weddings WHERE user_id = ?").get(userId);
  return w?.id || null;
}

function toFrontend(v) {
  return {
    id: v.id,
    weddingId: v.wedding_id,
    name: v.name,
    category: v.category,
    value: v.value || undefined,
    phone: v.phone || undefined,
    email: v.email || undefined,
    instagram: v.instagram || undefined,
    notes: v.notes || undefined,
    budgetItemId: v.budget_item_id || undefined,
    ratingPrice: v.rating_price ?? undefined,
    ratingTrust: v.rating_trust ?? undefined,
    ratingQuality: v.rating_quality ?? undefined,
    ratingService: v.rating_service ?? undefined,
    createdAt: v.created_at,
  };
}

// ── Listar todos ──────────────────────
router.get("/", (req, res) => {
  try {
    const weddingId = getWeddingId(req.userId);
    if (!weddingId) return res.json([]);

    const vendors = db
      .prepare(
        "SELECT * FROM vendors WHERE wedding_id = ? ORDER BY created_at ASC",
      )
      .all(weddingId);
    res.json(vendors.map(toFrontend));
  } catch (err) {
    console.error("Get vendors error:", err);
    res.status(500).json({ error: "Erro ao buscar fornecedores." });
  }
});

// ── Criar fornecedor ──────────────────
router.post("/", (req, res) => {
  try {
    const weddingId = getWeddingId(req.userId);
    if (!weddingId) {
      return res.status(400).json({ error: "Configure primeiro o casamento." });
    }

    const {
      name,
      category,
      value,
      phone,
      email,
      instagram,
      notes,
      budgetItemId,
      ratingPrice,
      ratingTrust,
      ratingQuality,
      ratingService,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Nome e obrigatorio." });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      `
      INSERT INTO vendors
        (id, wedding_id, name, category, value, phone, email, instagram, notes,
         budget_item_id, rating_price, rating_trust, rating_quality, rating_service, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    ).run(
      id,
      weddingId,
      name,
      category || "",
      value || null,
      phone || null,
      email || null,
      instagram || null,
      notes || null,
      budgetItemId || null,
      ratingPrice ?? null,
      ratingTrust ?? null,
      ratingQuality ?? null,
      ratingService ?? null,
      now,
    );

    const vendor = db.prepare("SELECT * FROM vendors WHERE id = ?").get(id);
    res.status(201).json(toFrontend(vendor));
  } catch (err) {
    console.error("Create vendor error:", err);
    res.status(500).json({ error: "Erro ao criar fornecedor." });
  }
});

// ── Atualizar fornecedor ──────────────
router.put("/:id", (req, res) => {
  try {
    const weddingId = getWeddingId(req.userId);
    const vendor = db
      .prepare("SELECT * FROM vendors WHERE id = ? AND wedding_id = ?")
      .get(req.params.id, weddingId);
    if (!vendor) {
      return res.status(404).json({ error: "Fornecedor nao encontrado." });
    }

    const {
      name,
      category,
      value,
      phone,
      email,
      instagram,
      notes,
      budgetItemId,
      ratingPrice,
      ratingTrust,
      ratingQuality,
      ratingService,
    } = req.body;

    db.prepare(
      `
      UPDATE vendors SET
        name = ?, category = ?, value = ?, phone = ?, email = ?,
        instagram = ?, notes = ?, budget_item_id = ?,
        rating_price = ?, rating_trust = ?, rating_quality = ?, rating_service = ?
      WHERE id = ?
    `,
    ).run(
      name ?? vendor.name,
      category ?? vendor.category,
      value !== undefined ? value : vendor.value,
      phone !== undefined ? phone : vendor.phone,
      email !== undefined ? email : vendor.email,
      instagram !== undefined ? instagram : vendor.instagram,
      notes !== undefined ? notes : vendor.notes,
      budgetItemId !== undefined ? budgetItemId : vendor.budget_item_id,
      ratingPrice !== undefined ? ratingPrice : vendor.rating_price,
      ratingTrust !== undefined ? ratingTrust : vendor.rating_trust,
      ratingQuality !== undefined ? ratingQuality : vendor.rating_quality,
      ratingService !== undefined ? ratingService : vendor.rating_service,
      req.params.id,
    );

    const updated = db
      .prepare("SELECT * FROM vendors WHERE id = ?")
      .get(req.params.id);
    res.json(toFrontend(updated));
  } catch (err) {
    console.error("Update vendor error:", err);
    res.status(500).json({ error: "Erro ao atualizar fornecedor." });
  }
});

// ── Deletar fornecedor ────────────────
router.delete("/:id", (req, res) => {
  try {
    const weddingId = getWeddingId(req.userId);
    const vendor = db
      .prepare("SELECT * FROM vendors WHERE id = ? AND wedding_id = ?")
      .get(req.params.id, weddingId);
    if (!vendor) {
      return res.status(404).json({ error: "Fornecedor nao encontrado." });
    }

    db.prepare("DELETE FROM vendors WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete vendor error:", err);
    res.status(500).json({ error: "Erro ao remover fornecedor." });
  }
});

module.exports = router;
