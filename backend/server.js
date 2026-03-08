// ════════════════════════════════════
// server.js — Entry point do backend
// Everest Wedding Planner API
// ════════════════════════════════════

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middlewares globais ────────────────
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  }),
);
app.use(express.json());

// ── Health Check ──────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Everest API rodando!",
    timestamp: new Date().toISOString(),
  });
});

// ── Rotas ─────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api/wedding", require("./routes/wedding"));
app.use("/api/budget-items", require("./routes/budget"));
app.use("/api/vendors", require("./routes/vendors"));
app.use("/api/proposals", require("./routes/proposals"));
app.use("/api/appointments", require("./routes/appointments"));
app.use("/api/checklist", require("./routes/checklist"));

// ── 404 handler ───────────────────────
app.use((req, res) => {
  res
    .status(404)
    .json({ error: `Rota não encontrada: ${req.method} ${req.path}` });
});

// ── Error handler ─────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Erro interno do servidor." });
});

// ── Start ─────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏔️  Everest API rodando em http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});
