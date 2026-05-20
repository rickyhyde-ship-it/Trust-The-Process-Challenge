const DATA_URL = "data/leaderboard.json";
const WORKFLOW_FILE = "update-leaderboard.yml";

const elements = {
  heroLeader: document.querySelector("#hero-leader"),
  heroLeaderPoints: document.querySelector("#hero-leader-points"),
  metricClubs: document.querySelector("#metric-clubs"),
  metricPlayed: document.querySelector("#metric-played"),
  metricGoals: document.querySelector("#metric-goals"),
  metricPoints: document.querySelector("#metric-points"),
  lastUpdated: document.querySelector("#last-updated"),
  leaderboardBody: document.querySelector("#leaderboard-body"),
  feedSeason: document.querySelector("#feed-season"),
  feedLeague: document.querySelector("#feed-league"),
  feedCup: document.querySelector("#feed-cup"),
  topBars: document.querySelector("#top-bars"),
  clubGrid: document.querySelector("#club-grid"),
  refreshDataButton: document.querySelector("#refresh-data-button")
};

function formatNumber(value) {
  return new Intl.NumberFormat("en-GB").format(Number(value) || 0);
}

function formatGoalDifference(value) {
  const number = Number(value) || 0;
  return number > 0 ? `+${number}` : String(number);
}

function formatUpdatedAt(value) {
  if (!value) {
    return "Waiting for data";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function initials(name) {
  return String(name)
    .replace(/Trust The Process/gi, "TTP")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cssColor(value, fallback) {
  const color = String(value || "").trim();
  return /^#[0-9a-f]{3,8}$/i.test(color) ? color : fallback;
}

function badgeStyle(row) {
  const main = cssColor(row.colors?.main, "#194d33");
  const secondary = cssColor(row.colors?.secondary, "#ffffff");
  return `background: linear-gradient(145deg, ${main}, #07121a 72%); border-color: ${secondary};`;
}

function repositoryFromLocation() {
  const host = window.location.hostname;
  const pathParts = window.location.pathname.split("/").filter(Boolean);

  if (!host.endsWith(".github.io")) {
    return null;
  }

  const owner = host.replace(".github.io", "");
  const repo = pathParts[0] || `${owner}.github.io`;

  return `${owner}/${repo}`;
}

function workflowUrl(data) {
  const repository = data?.meta?.repository || repositoryFromLocation();

  if (!repository) {
    return "https://github.com/actions";
  }

  return `https://github.com/${repository}/actions/workflows/${WORKFLOW_FILE}`;
}

function renderOverview(data) {
  const leader = data.leader;

  elements.heroLeader.textContent = leader?.clubName || "No leader yet";
  elements.heroLeaderPoints.textContent = leader
    ? `${formatNumber(leader.points)} points`
    : "Run the update workflow";
  elements.metricClubs.textContent = formatNumber(data.totals?.clubs);
  elements.metricPlayed.textContent = formatNumber(data.totals?.played);
  elements.metricGoals.textContent = formatNumber(data.totals?.goalsFor);
  elements.metricPoints.textContent = formatNumber(data.totals?.points);
  elements.lastUpdated.textContent = `Last updated: ${formatUpdatedAt(data.meta?.generatedAt)}`;
  elements.feedSeason.textContent = data.meta?.seasonName || "Season 14";
}

function renderFeed(data) {
  const standings = data.standings || [];
  const leagueNames = new Set(
    standings.map((row) => row.league?.name).filter(Boolean)
  );
  const cupStatuses = new Set(
    standings.map((row) => row.cup?.status || "NOT_FOUND")
  );

  elements.feedLeague.textContent =
    leagueNames.size > 0 ? `${leagueNames.size} league groups` : "Awaiting stats";
  elements.feedCup.textContent =
    data.totals?.cupStarted > 0
      ? `${data.totals.cupStarted} clubs with cup stats`
      : [...cupStatuses].includes("PLANNED")
        ? "Planned"
        : "Awaiting stats";
}

function renderTable(data) {
  const rows = data.standings || [];

  if (rows.length === 0) {
    elements.leaderboardBody.innerHTML =
      '<tr><td colspan="11" class="table-message">No leaderboard data yet.</td></tr>';
    return;
  }

  elements.leaderboardBody.innerHTML = rows
    .map((row) => {
      const clubName = escapeHtml(row.clubName);
      const country = escapeHtml(row.country || "Club ID");
      const goalClass =
        row.goalDifference > 0
          ? "positive"
          : row.goalDifference < 0
            ? "negative"
            : "";

      return `
        <tr>
          <td><span class="rank-pill ${row.rank === 1 ? "top" : ""}">${row.rank}</span></td>
          <td>
            <div class="club-cell">
              <span class="club-badge" style="${badgeStyle(row)}">${escapeHtml(initials(row.clubName))}</span>
              <span class="club-name">
                <strong>${clubName}</strong>
                <span>${country} ${row.clubId}</span>
              </span>
            </div>
          </td>
          <td>${formatNumber(row.played)}</td>
          <td>${formatNumber(row.leagueWins)}</td>
          <td>${formatNumber(row.cupWins)}</td>
          <td>${formatNumber(row.draws)}</td>
          <td>${formatNumber(row.losses)}</td>
          <td>${formatNumber(row.goalsFor)}</td>
          <td>${formatNumber(row.goalsAgainst)}</td>
          <td class="${goalClass}">${formatGoalDifference(row.goalDifference)}</td>
          <td class="points-cell">${formatNumber(row.points)}</td>
        </tr>
      `;
    })
    .join("");
}

function renderBars(data) {
  const rows = (data.standings || []).slice(0, 5);
  const maxPoints = Math.max(...rows.map((row) => row.points), 1);

  elements.topBars.innerHTML = rows
    .map((row) => {
      const width = Math.max(4, (row.points / maxPoints) * 100);
      const clubName = escapeHtml(row.clubName);

      return `
        <div class="bar-row">
          <span>${row.rank}. ${clubName}</span>
          <strong>${formatNumber(row.points)}</strong>
          <div class="bar-track" aria-hidden="true">
            <div class="bar-fill" style="--bar-width: ${width}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderClubs(data) {
  const rows = data.standings || [];

  elements.clubGrid.innerHTML = rows
    .map((row) => {
      const cupText = row.cup?.started ? `${row.cupWins} cup wins` : "Cup pending";
      const clubName = escapeHtml(row.clubName);

      return `
        <article class="club-tile">
          <span class="club-badge" style="${badgeStyle(row)}">${escapeHtml(initials(row.clubName))}</span>
          <span>
            <strong>${clubName}</strong>
            <span>${formatNumber(row.points)} pts | ${cupText}</span>
          </span>
        </article>
      `;
    })
    .join("");
}

function renderError(error) {
  elements.heroLeader.textContent = "Data unavailable";
  elements.heroLeaderPoints.textContent = "Run the update workflow";
  elements.leaderboardBody.innerHTML = `
    <tr>
      <td colspan="11" class="table-message">${error.message}</td>
    </tr>
  `;
}

async function loadLeaderboard() {
  try {
    const response = await fetch(`${DATA_URL}?t=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Leaderboard JSON is missing. Run the update workflow first.");
    }

    const data = await response.json();

    renderOverview(data);
    renderFeed(data);
    renderTable(data);
    renderBars(data);
    renderClubs(data);

    elements.refreshDataButton.addEventListener("click", () => {
      window.open(workflowUrl(data), "_blank", "noopener,noreferrer");
    });
  } catch (error) {
    renderError(error);
    elements.refreshDataButton.addEventListener("click", () => {
      window.open(workflowUrl(), "_blank", "noopener,noreferrer");
    });
  }
}

loadLeaderboard();
