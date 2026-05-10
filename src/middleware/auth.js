import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";

export function buildContext(req) {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return { user: null };
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { user: decoded };
  } catch (err) {
    return { user: null };
  }
}