const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, "data", "readings.json");

// CORS: allow your GitHub Pages origin + localhost for testing
const allowedOrigins = [
  "http://localhost:5500", // or whatever you use locally for the HTML
  "http://127.0.0.1:5500",
  "https://YOUR_GITHUB_USERNAME.github.io" // <-- change to your user site domain
];

app.use(
  cors({
    origin: function (origin, cb) {
      if (!origin) return cb(null, true); // allow curl / Postman
      if (allowedOrigins.some((o) => origin.startsWith(o))) {
        return cb(null, true);
      }
      return cb(null, false);
    }
  })
);

app.use(express.json());

// Ensure data file exists
async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

async function readAllReadings() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAllReadings(readings) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(readings, null, 2), "utf8");
}

// POST /api/readings → add one
app.post("/api/readings", async (req, res) => {
  try {
    const {
      date,
      time,
      systolic,
      diastolic,
      heartRate,
      totalChol,
      hdl,
      ldl,
      trig,
      creatinine
    } = req.body || {};

    if (!date || systolic == null || diastolic == null) {
      return res.status(400).json({
        error: "date, systolic, and diastolic are required"
      });
    }

    const newEntry = {
      id: Date.now(),
      date,
      time: time || "",
      systolic: systolic != null ? Number(systolic) : null,
      diastolic: diastolic != null ? Number(diastolic) : null,
      heartRate: heartRate != null ? Number(heartRate) : null,
      totalChol: totalChol != null ? Number(totalChol) : null,
      hdl: hdl != null ? Number(hdl) : null,
      ldl: ldl != null ? Number(ldl) : null,
      trig: trig != null ? Number(trig) : null,
      creatinine: creatinine != null ? Number(creatinine) : null
    };

    const readings = await readAllReadings();
    readings.push(newEntry);
    // sort by date+time
    readings.sort((a, b) => {
      const kA = `${a.date || ""} ${a.time || ""}`;
      const kB = `${b.date || ""} ${b.time || ""}`;
      return kA.localeCompare(kB);
    });
    await writeAllReadings(readings);

    res.status(201).json({ ok: true, entry: newEntry });
  } catch (err) {
    console.error("Error in POST /api/readings", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/readings → list all
app.get("/api/readings", async (req, res) => {
  try {
    const readings = await readAllReadings();
    res.json(readings);
  } catch (err) {
    console.error("Error in GET /api/readings", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/", (req, res) => {
  res.send("Health Tracker API is running.");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
