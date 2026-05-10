import { PrismaClient } from "../src/generated/prisma/index.js";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log("Starting seed...");

  // Create default admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: { username: "admin", password: hashedPassword },
  });
  console.log("Admin user created (username: admin, password: admin123)");

  // Read CSV file
  const csvPath = path.join(__dirname, "data.csv");

  if (!fs.existsSync(csvPath)) {
    console.log("No CSV found at scripts/data.csv");
    console.log("Download your dataset from Kaggle and save it as scripts/data.csv");
    console.log("Then run npm run db:seed again.");
    return;
  }

  const raw = fs.readFileSync(csvPath, "utf-8");
  const lines = raw.split("\n").filter(Boolean);
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));

  console.log(`CSV headers: ${headers.join(", ")}`);
  console.log(`Total rows: ${lines.length - 1}`);

  // Update these to match your CSV column names
  const COL = {
    date:      headers.indexOf("date"),
    homeTeam:  headers.indexOf("home_team"),
    awayTeam:  headers.indexOf("away_team"),
    homeGoals: headers.indexOf("home_goals"),
    awayGoals: headers.indexOf("away_goals"),
    league:    headers.indexOf("league"),
    season:    headers.indexOf("season"),
    country:   headers.indexOf("country"),
  };

  const leagueSet = new Map();
  const teamSet = new Set();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/"/g, ""));
    const leagueName = cols[COL.league];
    const country = COL.country !== -1 ? cols[COL.country] : "Unknown";
    if (leagueName) leagueSet.set(leagueName, country);
    if (cols[COL.homeTeam]) teamSet.add(cols[COL.homeTeam]);
    if (cols[COL.awayTeam]) teamSet.add(cols[COL.awayTeam]);
  }

  // Insert leagues
  console.log(`Inserting ${leagueSet.size} leagues...`);
  for (const [name, country] of leagueSet) {
    await prisma.league.upsert({
      where: { name },
      update: {},
      create: { name, country },
    });
  }

  // Insert teams
  console.log(`Inserting ${teamSet.size} teams...`);
  for (const name of teamSet) {
    await prisma.team.upsert({
      where: { name },
      update: {},
      create: { name, country: "Unknown" },
    });
  }

  // Insert matches in batches
  const allLeagues = await prisma.league.findMany();
  const allTeams = await prisma.team.findMany();
  const leagueMap = Object.fromEntries(allLeagues.map((l) => [l.name, l.id]));
  const teamMap = Object.fromEntries(allTeams.map((t) => [t.name, t.id]));

  const BATCH = 500;
  let inserted = 0;

  for (let i = 1; i < lines.length; i += BATCH) {
    const batch = lines.slice(i, i + BATCH);
    const data = [];

    for (const line of batch) {
      const cols = line.split(",").map((c) => c.trim().replace(/"/g, ""));
      const homeTeamId = teamMap[cols[COL.homeTeam]];
      const awayTeamId = teamMap[cols[COL.awayTeam]];
      const leagueId = leagueMap[cols[COL.league]];
      if (!homeTeamId || !awayTeamId || !leagueId) continue;

      data.push({
        date: cols[COL.date] || "Unknown",
        homeTeamId,
        awayTeamId,
        homeGoals: parseInt(cols[COL.homeGoals]) || null,
        awayGoals: parseInt(cols[COL.awayGoals]) || null,
        leagueId,
        season: cols[COL.season] || "Unknown",
      });
    }

    await prisma.match.createMany({ data, skipDuplicates: true });
    inserted += data.length;
    process.stdout.write(`\rInserted ${inserted} matches...`);
  }

  console.log(`\nSeed complete! ${inserted} matches imported.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());