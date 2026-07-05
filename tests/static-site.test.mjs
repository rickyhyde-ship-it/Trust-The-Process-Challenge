import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("public leaderboard page", () => {
  it("refreshes leaderboard data every 30 minutes from GitHub Actions", () => {
    const workflow = readFileSync(".github/workflows/update-leaderboard.yml", "utf8");

    assert.match(workflow, /cron:\s*"(?:(?:\*\/30)|(?:0,30)) \* \* \* \*"/);
  });

  it("does not expose a token prompt or workflow dispatch code in the public page", () => {
    const html = readFileSync("index.html", "utf8");
    const app = readFileSync("assets/app.js", "utf8");

    assert.doesNotMatch(html, /github-token|token-dialog|Run Leaderboard Update/);
    assert.doesNotMatch(app, /dispatchWorkflow|sessionStorage|github-actions/);
  });

  it("keeps the header and leaderboard chrome focused", () => {
    const html = readFileSync("index.html", "utf8");

    assert.doesNotMatch(html, /<a href="#stats">Stats<\/a>/);
    assert.doesNotMatch(html, /Top of the process|Positive goal difference|Cup awaiting stats/);
    assert.match(html, /Points awarded per result/);
    assert.match(html, /\+3 pts/);
  });

  it("shows Season 15 copy for the active challenge", () => {
    const html = readFileSync("index.html", "utf8");

    assert.match(html, /Season 15/);
    assert.match(html, /Seventeen club IDs/);
    assert.doesNotMatch(html, /Season 14/);
    assert.doesNotMatch(html, /Twenty club IDs/);
  });

  it("fetches current-season manager names from the contracts API", () => {
    const updateScript = readFileSync("scripts/update-leaderboard.mjs", "utf8");

    assert.match(updateScript, /contracts\?type=MANAGER&period=currentSeason/);
    assert.doesNotMatch(updateScript, /MANAGERS_BY_CLUB_ID/);
  });

  it("uses the Season 15 club list with club 2799 replacing club 256", () => {
    const updateScript = readFileSync("scripts/update-leaderboard.mjs", "utf8");

    assert.match(updateScript, /\b2799\b/);
    assert.doesNotMatch(updateScript, /\b256\b/);
  });
});
