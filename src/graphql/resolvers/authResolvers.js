import { PrismaClient } from "../../generated/prisma/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";

export const authResolvers = {
  register: async ({ username, password }) => {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) throw new Error("BAD_REQUEST: Username already taken.");

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { username, password: hashed } });

    const token = jwt.sign({ userId: user.id, username }, JWT_SECRET, { expiresIn: "7d" });
    return { token, message: "Registered successfully." };
  },

  login: async ({ username, password }) => {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) throw new Error("UNAUTHORIZED: Invalid username or password.");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("UNAUTHORIZED: Invalid username or password.");

    const token = jwt.sign({ userId: user.id, username }, JWT_SECRET, { expiresIn: "7d" });
    return { token, message: "Logged in successfully." };
  },
};