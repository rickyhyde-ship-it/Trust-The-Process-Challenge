export const SEASON_ID = 24;
export const INCLUDED_TYPES = new Set(["LEAGUE", "CUP"]);

function asNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

export function filterSeasonCompetitions(competitions = [], seasonId = SEASON_ID) {
  return competitions.filter((competition) => {
    return (
      competition?.season?.id === seasonId &&
      INCLUDED_TYPES.has(competition?.type)
    );
  });
}

export function calculateCompetitionPoints(competitions = []) {
  return competitions.reduce(
    (totals, competition) => {
      const stats = competition.stats ?? {};
      const wins = asNumber(stats.wins);
      const draws = asNumber(stats.draws);
      const losses = asNumber(stats.losses);
      const goalsFor = asNumber(stats.goals);
      const goalsAgainst = asNumber(stats.goalsAgainst);

      if (competition.type === "LEAGUE") {
        totals.leagueWins += wins;
        totals.leaguePlayed += wins + draws + losses;
        totals.leaguePoints += wins * 2 + draws;
      }

      if (competition.type === "CUP") {
        totals.cupWins += wins;
        totals.cupPlayed += wins + draws + losses;
        totals.cupPoints += wins * 3 + draws;
      }

      totals.draws += draws;
      totals.losses += losses;
      totals.played += wins + draws + losses;
      totals.goalsFor += goalsFor;
      totals.goalsAgainst += goalsAgainst;
      totals.points = totals.leaguePoints + totals.cupPoints;
      totals.goalDifference = totals.goalsFor - totals.goalsAgainst;

      return totals;
    },
    {
      points: 0,
      leaguePoints: 0,
      cupPoints: 0,
      leagueWins: 0,
      cupWins: 0,
      draws: 0,
      losses: 0,
      played: 0,
      leaguePlayed: 0,
      cupPlayed: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0
    }
  );
}

function competitionSummary(competitions, type) {
  const competition = competitions.find((item) => item.type === type);
  const stats = competition?.stats ?? {};

  return {
    id: competition?.id ?? null,
    name: competition?.name ?? null,
    status: competition?.status ?? "NOT_FOUND",
    started: Boolean(competition?.stats),
    wins: asNumber(stats.wins),
    draws: asNumber(stats.draws),
    losses: asNumber(stats.losses),
    goalsFor: asNumber(stats.goals),
    goalsAgainst: asNumber(stats.goalsAgainst),
    ranking: stats.ranking ?? null
  };
}

export function buildClubRow({ club, competitions, seasonId = SEASON_ID }) {
  const seasonCompetitions = filterSeasonCompetitions(competitions, seasonId);
  const totals = calculateCompetitionPoints(seasonCompetitions);
  const clubName = club?.name || `Club ${club?.id ?? "Unknown"}`;

  return {
    clubId: club?.id ?? null,
    clubName,
    city: club?.city ?? "",
    country: club?.country ?? "",
    colors: {
      main: club?.mainColor ?? "#39e75f",
      secondary: club?.secondaryColor ?? "#ffffff"
    },
    ...totals,
    league: competitionSummary(seasonCompetitions, "LEAGUE"),
    cup: competitionSummary(seasonCompetitions, "CUP"),
    competitions: seasonCompetitions.map((competition) => ({
      id: competition.id,
      name: competition.name,
      status: competition.status,
      type: competition.type,
      stats: competition.stats ?? null
    }))
  };
}

export function sortLeaderboardRows(rows = []) {
  return [...rows].sort((a, b) => {
    return (
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      String(a.clubName).localeCompare(String(b.clubName))
    );
  });
}

export function rankRows(rows = []) {
  const sorted = sortLeaderboardRows(rows);

  return sorted.map((row, index) => ({
    ...row,
    rank: index + 1
  }));
}
