import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";

import adminRouter from "./routes/admin.routes.js";
import authRouter from "./routes/auth.routes.js";
import filesRouter from "./routes/files.routes.js";

const app = express();

app.disable("x-powered-by");

app.use(helmet());

const corsOrigin = process.env.CORS_ORIGIN;
if (!corsOrigin || corsOrigin.trim() === "") {
  console.warn(
    "CORS is disabled. Set CORS_ORIGIN to a comma-separated allowlist of origins (e.g. http://localhost:5173).",
  );
} else if (corsOrigin.trim() === "*") {
  console.warn(
    "Refusing to enable open CORS (CORS_ORIGIN='*'). Set CORS_ORIGIN to a comma-separated allowlist instead.",
  );
} else {
  const allowlist = corsOrigin
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, cb) {
        if (!origin) return cb(null, true);
        return cb(null, allowlist.includes(origin));
      },
    }),
  );
}

app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  res.json({ ok: true, db: { state: states[mongoose.connection.readyState] } });
});

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/files", filesRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  if (err && err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "File too large" });
    }
    return res.status(400).json({ error: err.message });
  }

  const statusCode =
    Number.isInteger(err?.statusCode) && err.statusCode >= 400
      ? err.statusCode
      : 500;

  const message =
    statusCode >= 500 ? "Internal server error" : err?.message || "Bad request";

  res.status(statusCode).json({ error: message });
});

export default app;
