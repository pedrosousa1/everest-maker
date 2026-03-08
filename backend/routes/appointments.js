// routes/appointments.js — async via dbHelpers
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

function toFrontend(a) {
  return {
    id: a.id,
    weddingId: a.wedding_id,
    title: a.title,
    type: a.type,
    date: a.date,
    time: a.time,
    location: a.location || undefined,
    notes: a.notes || undefined,
    completed: a.completed === 1 || a.completed === true,
    createdAt: a.created_at,
  };
}

router.get("/", async (req, res) => {
  try {
    const weddingId = await getWeddingId(req.userId);
    if (!weddingId) return res.json([]);
    const apts = await query(
      "SELECT * FROM appointments WHERE wedding_id = ? ORDER BY date ASC, time ASC",
      [weddingId],
    );
    res.json(apts.map(toFrontend));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar compromissos." });
  }
});

router.post("/", async (req, res) => {
  try {
    const weddingId = await getWeddingId(req.userId);
    if (!weddingId)
      return res.status(400).json({ error: "Configure primeiro o casamento." });

    const { title, type, date, time, location, notes } = req.body;
    if (!title || !date || !time)
      return res
        .status(400)
        .json({ error: "Titulo, data e horario sao obrigatorios." });

    const id = uuidv4();
    const now = new Date().toISOString();
    await run(
      "INSERT INTO appointments (id, wedding_id, title, type, date, time, location, notes, completed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)",
      [
        id,
        weddingId,
        title,
        type || "Reuniao",
        date,
        time,
        location || null,
        notes || null,
        now,
      ],
    );
    res
      .status(201)
      .json(
        toFrontend(
          await queryOne("SELECT * FROM appointments WHERE id = ?", [id]),
        ),
      );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar compromisso." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const weddingId = await getWeddingId(req.userId);
    const apt = await queryOne(
      "SELECT * FROM appointments WHERE id = ? AND wedding_id = ?",
      [req.params.id, weddingId],
    );
    if (!apt)
      return res.status(404).json({ error: "Compromisso nao encontrado." });

    const { title, type, date, time, location, notes, completed } = req.body;
    const completedVal =
      completed !== undefined ? (completed ? 1 : 0) : apt.completed ? 1 : 0;
    await run(
      "UPDATE appointments SET title = ?, type = ?, date = ?, time = ?, location = ?, notes = ?, completed = ? WHERE id = ?",
      [
        title ?? apt.title,
        type ?? apt.type,
        date ?? apt.date,
        time ?? apt.time,
        location !== undefined ? location : apt.location,
        notes !== undefined ? notes : apt.notes,
        completedVal,
        req.params.id,
      ],
    );
    res.json(
      toFrontend(
        await queryOne("SELECT * FROM appointments WHERE id = ?", [
          req.params.id,
        ]),
      ),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar compromisso." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const weddingId = await getWeddingId(req.userId);
    const apt = await queryOne(
      "SELECT * FROM appointments WHERE id = ? AND wedding_id = ?",
      [req.params.id, weddingId],
    );
    if (!apt)
      return res.status(404).json({ error: "Compromisso nao encontrado." });
    await run("DELETE FROM appointments WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao remover compromisso." });
  }
});

module.exports = router;
