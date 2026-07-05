import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildClubRow,
  calculateCompetitionPoints,
  filterSeasonCompetitions,
  SEASON_ID,
  sortLeaderboardRows
} from "../scripts/leaderboard-core.mjs";

describe("Trust The Process scoring", () => {
  it("uses Season 15 as the active leaderboard season", () => {
    assert.equal(SEASON_ID, 25);
  });

  it("scores only Season 15 league and cup competitions with the challenge rules", () => {
    const competitions = [
      {
        id: 14401,
        name: "Iron - League 25",
        type: "LEAGUE",
        season: { id: 25, name: "Season 15" },
        stats: { wins: 2, draws: 1, losses: 1, goals: 8, goalsAgainst: 6 }
      },
      {
        id: 14345,
        name: "Aspirants Cup - Season 15",
        type: "CUP",
        season: { id: 25, name: "Season 15" },
        stats: { wins: 1, draws: 2, losses: 0, goals: 5, goalsAgainst: 2 }
      },
      {
        id: 999,
        name: "Old League",
        type: "LEAGUE",
        season: { id: 24, name: "Season 14" },
        stats: { wins: 99, draws: 99, losses: 0, goals: 99, goalsAgainst: 0 }
      },
      {
        id: 1000,
        name: "Friendly",
        type: "FRIENDLY",
        season: { id: 25, name: "Season 15" },
        stats: { wins: 99, draws: 99, losses: 0, goals: 99, goalsAgainst: 0 }
      }
    ];

    const filtered = filterSeasonCompetitions(competitions);
    const points = calculateCompetitionPoints(filtered);

    assert.equal(filtered.length, 2);
    assert.equal(points.leagueWins, 2);
    assert.equal(points.cupWins, 1);
    assert.equal(points.draws, 3);
    assert.equal(points.points, 10);
    assert.equal(points.goalsFor, 13);
    assert.equal(points.goalsAgainst, 8);
  });

  it("keeps planned cups in the framework without adding phantom points", () => {
    const competitions = [
      {
        id: 14345,
        name: "Aspirants Cup - Season 15",
        status: "PLANNED",
        type: "CUP",
        season: { id: 25, name: "Season 15" }
      }
    ];

    const row = buildClubRow({
      club: { id: 1367, name: "Trust The Process Algeria B" },
      competitions
    });

    assert.equal(row.points, 0);
    assert.equal(row.cupWins, 0);
    assert.equal(row.draws, 0);
    assert.equal(row.cup.status, "PLANNED");
    assert.equal(row.cup.started, false);
  });

  it("adds the assigned manager name to each club row", () => {
    const row = buildClubRow({
      club: { id: 1367, name: "Trust The Process Algeria B" },
      managerName: "Pilipinoopao",
      competitions: []
    });

    assert.equal(row.managerName, "Pilipinoopao");
  });

  it("sorts by points, goal difference, goals for, then club name", () => {
    const rows = [
      { clubId: 1, clubName: "Zulu FC", points: 8, goalDifference: 2, goalsFor: 10 },
      { clubId: 2, clubName: "Alpha FC", points: 10, goalDifference: 1, goalsFor: 9 },
      { clubId: 3, clubName: "Bravo FC", points: 10, goalDifference: 3, goalsFor: 8 },
      { clubId: 4, clubName: "Cobalt FC", points: 10, goalDifference: 3, goalsFor: 11 }
    ];

    const sorted = sortLeaderboardRows(rows);

    assert.deepEqual(
      sorted.map((row) => row.clubName),
      ["Cobalt FC", "Bravo FC", "Alpha FC", "Zulu FC"]
    );
  });
});
