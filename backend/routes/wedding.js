// routes/wedding.js — async via dbHelpers
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { queryOne, run } = require("../dbHelpers");
const { verifyToken } = require("../auth");

const router = express.Router();
router.use(verifyToken);

function toFrontend(w) {
  if (!w) return null;
  return {
    id: w.id,
    coupleName: w.couple_name,
    weddingDate: w.wedding_date,
    venueName: w.venue_name || undefined,
    totalBudget: w.total_budget,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  };
}

router.get("/", async (req, res) => {
  try {
    const w = await queryOne("SELECT * FROM weddings WHERE user_id = ?", [
      req.userId,
    ]);
    res.json(toFrontend(w));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar casamento." });
  }
});

router.post("/", async (req, res) => {
  try {
    const existing = await queryOne(
      "SELECT id FROM weddings WHERE user_id = ?",
      [req.userId],
    );
    if (existing)
      return res
        .status(409)
        .json({ error: "Ja tem um casamento. Use PUT para atualizar." });

    const { coupleName, weddingDate, venueName, totalBudget } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    await run(
      "INSERT INTO weddings (id, user_id, couple_name, wedding_date, venue_name, total_budget, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        req.userId,
        coupleName || "",
        weddingDate || null,
        venueName || null,
        totalBudget || 0,
        now,
        now,
      ],
    );
    res
      .status(201)
      .json(
        toFrontend(await queryOne("SELECT * FROM weddings WHERE id = ?", [id])),
      );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar casamento." });
  }
});

router.put("/", async (req, res) => {
  try {
    const existing = await queryOne(
      "SELECT * FROM weddings WHERE user_id = ?",
      [req.userId],
    );
    if (!existing)
      return res
        .status(404)
        .json({ error: "Casamento nao encontrado. Use POST." });

    const { coupleName, weddingDate, venueName, totalBudget } = req.body;
    const now = new Date().toISOString();

    await run(
      "UPDATE weddings SET couple_name = ?, wedding_date = ?, venue_name = ?, total_budget = ?, updated_at = ? WHERE user_id = ?",
      [
        coupleName ?? existing.couple_name,
        weddingDate ?? existing.wedding_date,
        venueName ?? existing.venue_name,
        totalBudget ?? existing.total_budget,
        now,
        req.userId,
      ],
    );
    res.json(
      toFrontend(
        await queryOne("SELECT * FROM weddings WHERE user_id = ?", [
          req.userId,
        ]),
      ),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar casamento." });
  }
});

module.exports = router;
