# Trust The Process Challenge Leaderboard

Static GitHub Pages leaderboard for the Trust The Process Challenge.

## How It Works

- The page loads `data/leaderboard.json`.
- `.github/workflows/update-leaderboard.yml` fetches club and competition data from the supplied API.
- Only Season 14 (`season.id === 24`) competitions with `type` set to `LEAGUE` or `CUP` are included.
- Scoring is custom to the challenge: cup win = 3, league win = 2, draw = 1.
- The cup framework is included now, and planned cups stay at zero until the API starts returning cup `stats`.

## Update Button

The header shows the last generated timestamp from `data/leaderboard.json`. Leaderboard data is refreshed automatically by `.github/workflows/update-leaderboard.yml` every 30 minutes, so visitors do not need GitHub access or tokens.

## Deploy

1. Push the repository to GitHub.
2. In repository settings, set Pages to **GitHub Actions**.
3. Run the update workflow once from Actions to create `data/leaderboard.json`.
4. The Pages workflow deploys the static site on pushes to `main` or `master`.

## Local Commands

```bash
npm test
npm run update:leaderboard
```
