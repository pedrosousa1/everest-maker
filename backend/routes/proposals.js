// routes/proposals.js — async via dbHelpers
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { query, queryOne, run } = require("../dbHelpers");
const { verifyToken } = require("../auth");

const router = express.Router();
router.use(verifyToken);

async function getWeddingId(userId) {
  const w = await queryOne("SELECT id FROM weddings WHERE user_id = ?", [
    userId,
  ]);
  return w?.id || null;
}

function toFrontend(p) {
  return {
    id: p.id,
    weddingId: p.wedding_id,
    vendorName: p.vendor_name,
    vendorId: p.vendor_id || undefined,
    category: p.category,
    value: p.value,
    status: p.status,
    notes: p.notes || undefined,
    budgetItemId: p.budget_item_id || undefined,
    ratingPrice: p.rating_price ?? undefined,
    ratingTrust: p.rating_trust ?? undefined,
    ratingQuality: p.rating_quality ?? undefined,
    ratingService: p.rating_service ?? undefined,
    createdAt: p.created_at,
  };
}

router.get("/", async (req, res) => {
  try {
    const weddingId = await getWeddingId(req.userId);
    if (!weddingId) return res.json([]);
    const proposals = await query(
      "SELECT * FROM proposals WHERE wedding_id = ? ORDER BY created_at ASC",
      [weddingId],
    );
    res.json(proposals.map(toFrontend));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar propostas." });
  }
});

router.post("/", async (req, res) => {
  try {
    const weddingId = await getWeddingId(req.userId);
    if (!weddingId)
      return res.status(400).json({ error: "Configure primeiro o casamento." });

    const {
      vendorName,
      vendorId,
      category,
      value,
      status,
      notes,
      budgetItemId,
      ratingPrice,
      ratingTrust,
      ratingQuality,
      ratingService,
    } = req.body;
    if (!vendorName || value == null)
      return res
        .status(400)
        .json({ error: "Fornecedor e valor sao obrigatorios." });

    const id = uuidv4();
    const now = new Date().toISOString();
    await run(
      `INSERT INTO proposals (
        id, wedding_id, vendor_name, vendor_id, category, value, 
        status, notes, budget_item_id, rating_price, rating_trust, rating_quality, rating_service, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        weddingId,
        vendorName,
        vendorId || null,
        category || "",
        value,
        status || "negociando",
        notes || null,
        budgetItemId || null,
        ratingPrice ?? null,
        ratingTrust ?? null,
        ratingQuality ?? null,
        ratingService ?? null,
        now,
      ],
    );
    res
      .status(201)
      .json(
        toFrontend(
          await queryOne("SELECT * FROM proposals WHERE id = ?", [id]),
        ),
      );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar proposta." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const weddingId = await getWeddingId(req.userId);
    const proposal = await queryOne(
      "SELECT * FROM proposals WHERE id = ? AND wedding_id = ?",
      [req.params.id, weddingId],
    );
    if (!proposal)
      return res.status(404).json({ error: "Proposta nao encontrada." });

    const {
      vendorName,
      vendorId,
      category,
      value,
      status,
      notes,
      budgetItemId,
      ratingPrice,
      ratingTrust,
      ratingQuality,
      ratingService,
    } = req.body;
    await run(
      `UPDATE proposals SET 
        vendor_name = ?, vendor_id = ?, category = ?, value = ?, 
        status = ?, notes = ?, budget_item_id = ?,
        rating_price = ?, rating_trust = ?, rating_quality = ?, rating_service = ? 
      WHERE id = ?`,
      [
        vendorName ?? proposal.vendor_name,
        vendorId !== undefined ? vendorId : proposal.vendor_id,
        category ?? proposal.category,
        value ?? proposal.value,
        status ?? proposal.status,
        notes !== undefined ? notes : proposal.notes,
        budgetItemId !== undefined ? budgetItemId : proposal.budget_item_id,
        ratingPrice !== undefined ? ratingPrice : proposal.rating_price,
        ratingTrust !== undefined ? ratingTrust : proposal.rating_trust,
        ratingQuality !== undefined ? ratingQuality : proposal.rating_quality,
        ratingService !== undefined ? ratingService : proposal.rating_service,
        req.params.id,
      ],
    );
    res.json(
      toFrontend(
        await queryOne("SELECT * FROM proposals WHERE id = ?", [req.params.id]),
      ),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar proposta." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const weddingId = await getWeddingId(req.userId);
    const proposal = await queryOne(
      "SELECT * FROM proposals WHERE id = ? AND wedding_id = ?",
      [req.params.id, weddingId],
    );
    if (!proposal)
      return res.status(404).json({ error: "Proposta nao encontrada." });
    await run("DELETE FROM proposals WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao remover proposta." });
  }
});

module.exports = router;
