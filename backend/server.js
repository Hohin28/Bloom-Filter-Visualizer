import express from "express";
import cors from "cors";
import { execFile } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const BLOOM_EXE = path.join(__dirname, "bloom.exe");

function runBloom(args, res) {
  execFile(BLOOM_EXE, args, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({
        error: `Command failed: ${BLOOM_EXE} ${args.join(" ")}`,
        details: stderr || error.message
      });
    }

    try {
      const data = JSON.parse(stdout);
      return res.json(data);
    } catch (e) {
      return res.status(500).json({
        error: "Invalid JSON from bloom.exe",
        raw: stdout
      });
    }
  });
}

app.post("/init", (req, res) => {
  const size = Number(req.body.size);
  const k = Number(req.body.k);

  if (!size || !k) {
    return res.status(400).json({ error: "size and k are required" });
  }

  runBloom(["init", String(size), String(k)], res);
});

app.post("/insert", (req, res) => {
  const word = req.body.word;
  runBloom(["insert", word], res);
});

app.post("/search", (req, res) => {
  const word = req.body.word;
  runBloom(["search", word], res);
});

app.get("/status", (req, res) => {
  runBloom(["status"], res);
});

app.listen(5000, () => {
  console.log("Backend running at http://localhost:5000");
});
