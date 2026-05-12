import { PrismaClient } from "../../generated/prisma/index.js";

const prisma = new PrismaClient();

export const teamResolvers = {
  teams: async () => {
    return prisma.team.findMany({ orderBy: { name: "asc" } });
  },

  team: async ({ id }) => {
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) throw new Error(`NOT_FOUND: Team with id ${id} does not exist.`);
    return team;
  },
};