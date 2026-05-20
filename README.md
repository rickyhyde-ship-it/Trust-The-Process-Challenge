# Trust The Process Challenge Leaderboard

Static GitHub Pages leaderboard for the Trust The Process Challenge.

## How It Works

- The page loads `data/leaderboard.json`.
- `.github/workflows/update-leaderboard.yml` fetches club and competition data from the supplied API.
- Only Season 14 (`season.id === 24`) competitions with `type` set to `LEAGUE` or `CUP` are included.
- Scoring is custom to the challenge: cup win = 3, league win = 2, draw = 1.
- The cup framework is included now, and planned cups stay at zero until the API starts returning cup `stats`.

## Update Button

The page's **Update Leaderboard** button triggers `update-leaderboard.yml` through the GitHub workflow dispatch API. GitHub requires an authenticated request for this, so the page asks for a fine-grained GitHub personal access token with **Actions: Read and write** access for this repository. The token is stored only in `sessionStorage`, so it is cleared when the browser session ends.

## Deploy

1. Push the repository to GitHub.
2. In repository settings, set Pages to **GitHub Actions**.
3. Run **Update Leaderboard** once from Actions to create `data/leaderboard.json`.
4. The Pages workflow deploys the static site on pushes to `main` or `master`.

## Local Commands

```bash
npm test
npm run update:leaderboard
```
