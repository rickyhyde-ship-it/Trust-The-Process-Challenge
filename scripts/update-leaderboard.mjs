import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildClubRow,
  extractManagerNameFromContracts,
  rankRows,
  SEASON_ID
} from "./leaderboard-core.mjs";

const CLUB_IDS = [
  1367,
  1776,
  1100,
  789,
  761,
  5004,
  1627,
  3585,
  6844,
  6162,
  4251,
  2953,
  838,
  155,
  256,
  1351,
  2855
];

const API_BASE_URL =
  "https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(__dirname, "../data/leaderboard.json");

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json"
    },
    signal: AbortSignal.timeout(20_000)
  });

  if (!response.ok) {
    throw new Error(`API request failed (${response.status}) for ${url}`);
  }

  return response.json();
}

function unwrapCollection(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.value)) {
    return payload.value;
  }

  return [];
}

async function fetchClubRow(clubId) {
  const [club, competitionsPayload, managerContractsPayload] = await Promise.all([
    fetchJson(`${API_BASE_URL}/clubs/${clubId}`),
    fetchJson(`${API_BASE_URL}/clubs/${clubId}/competitions`),
    fetchJson(
      `${API_BASE_URL}/contracts?type=MANAGER&period=currentSeason&clubId=${clubId}&limit=26`
    )
  ]);

  return buildClubRow({
    club,
    managerName: extractManagerNameFromContracts(managerContractsPayload),
    competitions: unwrapCollection(competitionsPayload),
    seasonId: SEASON_ID
  });
}

function buildTotals(standings) {
  return standings.reduce(
    (totals, row) => {
      totals.played += row.played;
      totals.points += row.points;
      totals.goalsFor += row.goalsFor;
      totals.goalsAgainst += row.goalsAgainst;
      totals.leagueWins += row.leagueWins;
      totals.cupWins += row.cupWins;
      totals.draws += row.draws;
      totals.cupStarted += row.cup.started ? 1 : 0;
      return totals;
    },
    {
      clubs: standings.length,
      played: 0,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      leagueWins: 0,
      cupWins: 0,
      draws: 0,
      cupStarted: 0
    }
  );
}

async function main() {
  const rows = await Promise.all(CLUB_IDS.map(fetchClubRow));
  const standings = rankRows(rows);
  const generatedAt = new Date().toISOString();
  const repository = process.env.GITHUB_REPOSITORY || null;
  const branch = process.env.GITHUB_REF_NAME || null;

  const leaderboard = {
    meta: {
      generatedAt,
      seasonId: SEASON_ID,
      seasonName: "Season 15",
      source: `${API_BASE_URL}/clubs/{clubId}/competitions`,
      repository,
      branch,
      clubIds: CLUB_IDS,
      managers: Object.fromEntries(
        standings.map((row) => [row.clubId, row.managerName])
      ),
      rules: {
        leagueWin: 2,
        cupWin: 3,
        draw: 1,
        includedTypes: ["LEAGUE", "CUP"]
      }
    },
    totals: buildTotals(standings),
    leader: standings[0] ?? null,
    standings
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(leaderboard, null, 2)}\n`);

  console.log(
    `Leaderboard updated with ${standings.length} clubs at ${generatedAt}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
