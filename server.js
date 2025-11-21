const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔹 Allow JSON
app.use(express.json());

// 🔹 CORS – update this:
const allowedOrigins = [
  "http://localhost:5500",                               // VS Code Live Server or similar
  "http://127.0.0.1:5500",
  "https://jeevrasayan.github.io",                       // GitHub Pages root
  "https://jeevrasayan.github.io/your-frontend-repo",    // optional: specific project path
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS: " + origin));
    },
  })
);

// 🔹 Data file path
const DATA_FILE = path.join(__dirname, "data", "readings.json");

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const data = JSON.parse(raw || "[]");
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Failed to read data file:", err);
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

// ---- API ROUTES ----

// Health check
app.get("/", (req, res) => {
  res.type("text/plain").send("Health Tracker API is running.");
});

// Get all readings
app.get("/api/readings", (req, res) => {
  const entries = readData();
  res.json(entries);
});

// Add a reading
app.post("/api/readings", (req, res) => {
  const body = req.body || {};

  if (!body.date || !body.systolic || !body.diastolic) {
    return res.status(400).json({ error: "date, systolic, diastolic are required" });
  }

  const entries = readData();

  const newEntry = {
    id: body.id ?? Date.now(),
    date: body.date,
    time: body.time || "",
    systolic: body.systolic,
    diastolic: body.diastolic,
    heartRate: body.heartRate ?? null,
    totalChol: body.totalChol ?? null,
    hdl: body.hdl ?? null,
    ldl: body.ldl ?? null,
    trig: body.trig ?? null,
  };

  entries.push(newEntry);
  writeData(entries);

  res.status(201).json(newEntry);
});

// Delete a reading
app.delete("/api/readings/:id", (req, res) => {
  const id = Number(req.params.id);
  const entries = readData();
  const idx = entries.findIndex((e) => e.id === id);

  if (idx === -1) {
    return res.status(404).json({ error: "Entry not found" });
  }

  const removed = entries.splice(idx, 1)[0];
  writeData(entries);

  res.json({ deleted: removed.id });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
