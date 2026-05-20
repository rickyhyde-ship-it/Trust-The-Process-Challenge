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
});
