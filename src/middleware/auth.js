// This middleware checks every request for a valid JWT token.
// If a valid token is found, the user is attached to the context.
// The resolvers can the check context.user to see i fthe user is logged in or not.
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
  } catch {
    return { user: null };
  }
}