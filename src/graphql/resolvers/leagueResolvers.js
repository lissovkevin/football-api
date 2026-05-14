// Handles all league related queries.
// Leagues are read only. No mutations allowed.
import { PrismaClient } from "../../generated/prisma/index.js";

const prisma = new PrismaClient();

export const leagueResolvers = {
  leagues: async () => {
    return prisma.league.findMany({ orderBy: { name: "asc" } });
  },

  league: async ({ id }) => {
    const league = await prisma.league.findUnique({
      where: { id },
      include: {
        matches: {
          include: { homeTeam: true, awayTeam: true, league: true },
          take: 10,
        },
      },
    });
    if (!league) throw new Error(`NOT_FOUND: League with id ${id} does not exist.`);
    return league;
  },
};