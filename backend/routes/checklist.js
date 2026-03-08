// routes/checklist.js — async via dbHelpers
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

function toFrontend(item) {
  return {
    id: item.id,
    title: item.title,
    monthsBefore: item.months_before,
    completed: item.completed === 1 || item.completed === true,
    isCustom: item.is_custom === 1 || item.is_custom === true,
  };
}

const ORDER = "ORDER BY months_before DESC, is_custom ASC, created_at ASC";

router.get("/", async (req, res) => {
  try {
    const weddingId = await getWeddingId(req.userId);
    if (!weddingId) return res.json([]);
    const items = await query(
      `SELECT * FROM checklist_items WHERE wedding_id = ? ${ORDER}`,
      [weddingId],
    );
    res.json(items.map(toFrontend));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar checklist." });
  }
});

router.put("/", async (req, res) => {
  try {
    const weddingId = await getWeddingId(req.userId);
    if (!weddingId)
      return res.status(400).json({ error: "Configure primeiro o casamento." });

    const { items } = req.body;
    if (!Array.isArray(items))
      return res.status(400).json({ error: "Items deve ser um array." });

    const now = new Date().toISOString();
    // Deleta e recria (simples e confiavel)
    await run("DELETE FROM checklist_items WHERE wedding_id = ?", [weddingId]);
    for (const item of items) {
      await run(
        "INSERT INTO checklist_items (id, wedding_id, title, months_before, completed, is_custom, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          item.id || uuidv4(),
          weddingId,
          item.title,
          item.monthsBefore ?? 0,
          item.completed ? 1 : 0,
          item.isCustom ? 1 : 0,
          now,
        ],
      );
    }
    const saved = await query(
      `SELECT * FROM checklist_items WHERE wedding_id = ? ${ORDER}`,
      [weddingId],
    );
    res.json(saved.map(toFrontend));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao salvar checklist." });
  }
});

router.post("/", async (req, res) => {
  try {
    const weddingId = await getWeddingId(req.userId);
    if (!weddingId)
      return res.status(400).json({ error: "Configure primeiro o casamento." });

    const { title, monthsBefore } = req.body;
    if (!title) return res.status(400).json({ error: "Titulo e obrigatorio." });

    const id = uuidv4();
    const now = new Date().toISOString();
    await run(
      "INSERT INTO checklist_items (id, wedding_id, title, months_before, completed, is_custom, created_at) VALUES (?, ?, ?, ?, 0, 1, ?)",
      [id, weddingId, title, monthsBefore ?? 0, now],
    );
    res
      .status(201)
      .json(
        toFrontend(
          await queryOne("SELECT * FROM checklist_items WHERE id = ?", [id]),
        ),
      );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao adicionar item." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const weddingId = await getWeddingId(req.userId);
    const item = await queryOne(
      "SELECT * FROM checklist_items WHERE id = ? AND wedding_id = ?",
      [req.params.id, weddingId],
    );
    if (!item) return res.status(404).json({ error: "Item nao encontrado." });
    await run("DELETE FROM checklist_items WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao remover item." });
  }
});

module.exports = router;
