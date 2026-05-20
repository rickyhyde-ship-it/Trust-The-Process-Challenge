import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildWorkflowDispatchRequest,
  getWorkflowDispatchEndpoint,
  parseWorkflowDispatchError
} from "../assets/github-actions.js";

describe("GitHub workflow dispatch helpers", () => {
  it("builds the workflow dispatch endpoint for the update workflow", () => {
    assert.equal(
      getWorkflowDispatchEndpoint({
        repository: "rickyhyde-ship-it/Trust-The-Process-Challenge",
        workflowFile: "update-leaderboard.yml"
      }),
      "https://api.github.com/repos/rickyhyde-ship-it/Trust-The-Process-Challenge/actions/workflows/update-leaderboard.yml/dispatches"
    );
  });

  it("builds an authenticated workflow_dispatch request", () => {
    const request = buildWorkflowDispatchRequest({
      repository: "rickyhyde-ship-it/Trust-The-Process-Challenge",
      workflowFile: "update-leaderboard.yml",
      ref: "main",
      token: "github_pat_example"
    });

    assert.equal(request.url.includes("/dispatches"), true);
    assert.equal(request.options.method, "POST");
    assert.equal(request.options.headers.Authorization, "Bearer github_pat_example");
    assert.equal(request.options.headers.Accept, "application/vnd.github+json");
    assert.equal(request.options.headers["X-GitHub-Api-Version"], "2022-11-28");
    assert.deepEqual(JSON.parse(request.options.body), { ref: "main" });
  });

  it("returns GitHub API error messages when dispatch fails", async () => {
    const message = await parseWorkflowDispatchError({
      status: 403,
      statusText: "Forbidden",
      json: async () => ({
        message: "Resource not accessible by personal access token"
      })
    });

    assert.equal(
      message,
      "GitHub rejected the update request: Resource not accessible by personal access token"
    );
  });
});
