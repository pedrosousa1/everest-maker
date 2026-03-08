// routes/budget.js — async via dbHelpers
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

function toFrontend(i) {
  return {
    id: i.id,
    weddingId: i.wedding_id,
    category: i.category,
    description: i.description,
    amount: i.amount,
    paidAmount: i.paid_amount,
    createdAt: i.created_at,
  };
}

router.get("/", async (req, res) => {
  try {
    const weddingId = await getWeddingId(req.userId);
    if (!weddingId) return res.json([]);
    const items = await query(
      "SELECT * FROM budget_items WHERE wedding_id = ? ORDER BY created_at ASC",
      [weddingId],
    );
    res.json(items.map(toFrontend));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar orcamento." });
  }
});

router.post("/", async (req, res) => {
  try {
    const weddingId = await getWeddingId(req.userId);
    if (!weddingId)
      return res.status(400).json({ error: "Configure primeiro o casamento." });

    const { category, description, amount, paidAmount } = req.body;
    if (!description || amount == null)
      return res
        .status(400)
        .json({ error: "Descricao e valor sao obrigatorios." });

    const id = uuidv4();
    const now = new Date().toISOString();
    await run(
      "INSERT INTO budget_items (id, wedding_id, category, description, amount, paid_amount, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        weddingId,
        category || "",
        description,
        amount,
        paidAmount || 0,
        now,
      ],
    );
    res
      .status(201)
      .json(
        toFrontend(
          await queryOne("SELECT * FROM budget_items WHERE id = ?", [id]),
        ),
      );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar item." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const weddingId = await getWeddingId(req.userId);
    const item = await queryOne(
      "SELECT * FROM budget_items WHERE id = ? AND wedding_id = ?",
      [req.params.id, weddingId],
    );
    if (!item) return res.status(404).json({ error: "Item nao encontrado." });

    const { category, description, amount, paidAmount } = req.body;
    await run(
      "UPDATE budget_items SET category = ?, description = ?, amount = ?, paid_amount = ? WHERE id = ?",
      [
        category ?? item.category,
        description ?? item.description,
        amount ?? item.amount,
        paidAmount ?? item.paid_amount,
        req.params.id,
      ],
    );
    res.json(
      toFrontend(
        await queryOne("SELECT * FROM budget_items WHERE id = ?", [
          req.params.id,
        ]),
      ),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar item." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const weddingId = await getWeddingId(req.userId);
    const item = await queryOne(
      "SELECT * FROM budget_items WHERE id = ? AND wedding_id = ?",
      [req.params.id, weddingId],
    );
    if (!item) return res.status(404).json({ error: "Item nao encontrado." });
    await run("DELETE FROM budget_items WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao remover item." });
  }
});

module.exports = router;
