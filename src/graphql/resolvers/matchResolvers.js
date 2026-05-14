// Handles all match related queries and mutations.
// Requires authentication for create, update and delete operations.
import { PrismaClient } from "../../generated/prisma/index.js";

const prisma = new PrismaClient();

function formatMatch(match) {
  return {
    ...match,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    league: match.league,
  };
}

export const matchResolvers = {
  matches: async ({ page = 1, pageSize = 20, leagueId, season }) => {
    const where = {};
    if (leagueId) where.leagueId = leagueId;
    if (season) where.season = season;

    const matches = await prisma.match.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { homeTeam: true, awayTeam: true, league: true },
      orderBy: { date: "desc" },
    });

    return matches.map(formatMatch);
  },

  match: async ({ id }) => {
    const match = await prisma.match.findUnique({
      where: { id },
      include: { homeTeam: true, awayTeam: true, league: true },
    });
    if (!match) throw new Error(`NOT_FOUND: Match with id ${id} does not exist.`);
    return formatMatch(match);
  },

  createMatch: async (args, context) => {
    if (!context.user) throw new Error("UNAUTHORIZED: You must be logged in.");
    const match = await prisma.match.create({
      data: {
        date: args.date,
        homeTeamId: args.homeTeamId,
        awayTeamId: args.awayTeamId,
        homeGoals: args.homeGoals,
        awayGoals: args.awayGoals,
        leagueId: args.leagueId,
        season: args.season,
      },
      include: { homeTeam: true, awayTeam: true, league: true },
    });
    return formatMatch(match);
  },

  updateMatch: async ({ id, ...updates }, context) => {
    if (!context.user) throw new Error("UNAUTHORIZED: You must be logged in.");
    const existing = await prisma.match.findUnique({ where: { id } });
    if (!existing) throw new Error(`NOT_FOUND: Match with id ${id} does not exist.`);

    const match = await prisma.match.update({
      where: { id },
      data: updates,
      include: { homeTeam: true, awayTeam: true, league: true },
    });
    return formatMatch(match);
  },

  deleteMatch: async ({ id }, context) => {
    if (!context.user) throw new Error("UNAUTHORIZED: You must be logged in.");
    const existing = await prisma.match.findUnique({ where: { id } });
    if (!existing) throw new Error(`NOT_FOUND: Match with id ${id} does not exist.`);

    await prisma.match.delete({ where: { id } });
    return { success: true, message: `Match ${id} deleted.` };
  },
};