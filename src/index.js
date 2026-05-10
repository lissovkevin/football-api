import express from "express";
import cors from "cors";
import { createHandler } from "graphql-http/lib/use/express";
import { ruruHTML } from "ruru/server";
import { schema } from "./graphql/schema.js";
import { resolvers } from "./graphql/resolvers.js";
import { buildContext } from "./middleware/auth.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// GraphQL Playground - visit http://localhost:4000/playground
app.get("/playground", (_req, res) => {
  res.type("html");
  res.end(ruruHTML({ endpoint: "/graphql" }));
});

// Main GraphQL endpoint
app.use(
  "/graphql",
  createHandler({
    schema,
    rootValue: resolvers,
    context: (req) => buildContext(req.raw),
    formatError: (err) => {
      const message = err.message || "An unexpected error occurred.";
      const code = message.split(":")[0].trim();
      return {
        message: message.includes(":")
          ? message.split(":").slice(1).join(":").trim()
          : message,
        code: ["NOT_FOUND", "UNAUTHORIZED", "BAD_REQUEST"].includes(code)
          ? code
          : "INTERNAL_ERROR",
      };
    },
  })
);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "Football API is running" });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found. Use POST /graphql" });
});

app.listen(PORT, () => {
  console.log(`⚽ Football API running at http://localhost:${PORT}`);
  console.log(`🎮 GraphQL Playground at http://localhost:${PORT}/playground`);
});