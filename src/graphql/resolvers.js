import { PrismaClient } from "../../src/generated/prisma/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";

function requireAuth(context) {
    if (!context.user) {
        throw new Error("UNAUTHORIZED: You must be logged in to do this.");
    }
}

function formatMatch(match) {
    return {
        ...match,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        league: match.league,
    };
}

export const resolvers = {
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

    teams: async () => {
        return prisma.team.findMany({ orderBy: { name: "asc" } });
    },

    team: async ({ id }) => {
        const team = await prisma.team.findUnique({ where: { id } });
        if (!team) throw new Error(`NOT_FOUND: Team with id ${id} does not exist.`);
        return team;
    },

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

    createMatch: async (args, context) => {
        requireAuth(context);
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
        requireAuth(context);
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
        requireAuth(context);
        const existing = await prisma.match.findUnique({ where: { id } });
        if (!existing) throw new Error(`NOT_FOUND: Match with id ${id} does not exist.`);

        await prisma.match.delete({ where: { id } });
        return { success: true, message: `Match ${id} deleted.` };
    },
};