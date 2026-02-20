import express from "express";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;
const distPath = path.join(__dirname, "dist");

// Fichiers statiques (assets avec cache long)
app.use(
  "/assets",
  express.static(path.join(distPath, "assets"), {
    maxAge: "1y",
    immutable: true,
  })
);

// Autres fichiers statiques (favicon, robots.txt, etc.)
app.use(express.static(distPath, { maxAge: "1h" }));

// SPA fallback : toutes les routes renvoient index.html
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
