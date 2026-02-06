const { sql } = require("@vercel/postgres");

const MAX_LIMIT = 25;

function normalizeName(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3);
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS scores (
      id SERIAL PRIMARY KEY,
      name VARCHAR(3) NOT NULL,
      score INTEGER NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS scores_score_idx ON scores (score DESC);`;
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");

  try {
    await ensureTable();
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "db_init_failed" }));
    return;
  }

  if (req.method === "GET") {
    const limit = Math.max(1, Math.min(MAX_LIMIT, Number(req.query?.limit || MAX_LIMIT)));
    try {
      const { rows } = await sql`
        SELECT name, score
        FROM scores
        ORDER BY score DESC, created_at ASC
        LIMIT ${limit};
      `;
      res.statusCode = 200;
      res.end(JSON.stringify({ scores: rows }));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: "db_read_failed" }));
    }
    return;
  }

  if (req.method === "POST") {
    let body = {};
    try {
      body = await readJson(req);
    } catch {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "invalid_json" }));
      return;
    }
    const name = normalizeName(body.name);
    const score = Number(body.score);
    if (name.length !== 3 || !Number.isFinite(score) || score < 0) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "invalid_payload" }));
      return;
    }
    try {
      await sql`INSERT INTO scores (name, score) VALUES (${name}, ${Math.floor(score)})`;
      res.statusCode = 200;
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: "db_write_failed" }));
    }
    return;
  }

  res.statusCode = 405;
  res.end(JSON.stringify({ error: "method_not_allowed" }));
};
