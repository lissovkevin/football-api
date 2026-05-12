import { PrismaClient } from "../src/generated/prisma/index.js";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log("Starting seed...");

  const hashedPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: { username: "admin", password: hashedPassword },
  });
  console.log("Admin user created (username: admin, password: admin123)");

  const csvPath = path.join(__dirname, "data.csv");

  if (!fs.existsSync(csvPath)) {
    console.log("No CSV found at scripts/data.csv");
    return;
  }

  const raw = fs.readFileSync(csvPath, "utf-8");
  
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    trim: true,
  });

  console.log(`Total rows: ${records.length}`);

  const leagueSet = new Map();
  const teamSet = new Set();

  for (const row of records) {
    if (row.League) leagueSet.set(row.League, "Unknown");
    if (row.Home) teamSet.add(row.Home);
    if (row.Away) teamSet.add(row.Away);
  }

  console.log(`Inserting ${leagueSet.size} leagues...`);
  for (const [name, country] of leagueSet) {
    await prisma.league.upsert({
      where: { name },
      update: {},
      create: { name, country },
    });
  }

  console.log(`Inserting ${teamSet.size} teams...`);
  for (const name of teamSet) {
    await prisma.team.upsert({
      where: { name },
      update: {},
      create: { name, country: "Unknown" },
    });
  }

  const allLeagues = await prisma.league.findMany();
  const allTeams = await prisma.team.findMany();
  const leagueMap = Object.fromEntries(allLeagues.map((l) => [l.name, l.id]));
  const teamMap = Object.fromEntries(allTeams.map((t) => [t.name, t.id]));

  const BATCH = 500;
  let inserted = 0;

  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    const data = [];

    for (const row of batch) {
      const homeTeamId = teamMap[row.Home];
      const awayTeamId = teamMap[row.Away];
      const leagueId = leagueMap[row.League];
      if (!homeTeamId || !awayTeamId || !leagueId) continue;

      data.push({
        date: row.Date || "Unknown",
        homeTeamId,
        awayTeamId,
        homeGoals: parseFloat(row.H_Score) || null,
        awayGoals: parseFloat(row.A_Score) || null,
        leagueId,
        season: row.Round || "Unknown",
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