// --- CONFIGURAZIONE COLORI ---
const PALETTE = {
  bg: "#283739",
  card: "#2C5D63",
  accent: "#A9C52F", // Lime
  text: "#F5F5F5",
  charts: [
    "#A9C52F", // Lime
    "#F5F5F5", // White
    "#4E8D96", // Teal Light
    "#1A2628", // Dark
    "#FF6B6B", // Coral (Highlight)
  ],
};

// Default globali Chart.js
Chart.defaults.color = PALETTE.text;
Chart.defaults.borderColor = "rgba(255,255,255,0.1)";
Chart.defaults.font.family = "'Roboto', sans-serif";

// --- CARICAMENTO DATI ---
d3.csv("data.csv").then(function (data) {
  // 1. Parsing dei dati (String -> Number)
  data.forEach((d) => {
    d.SPORT_HOURS = +d.SPORT_HOURS;
    d.ENERGY_LEVEL = +d.ENERGY_LEVEL;
    d.SOCIAL_BATTERY = +d.SOCIAL_BATTERY;
    d.TALK_VS_LISTEN = +d.TALK_VS_LISTEN;
    d.SCREEN_TIME = +d.SCREEN_TIME;
    d.SLEEP_HOURS = +d.SLEEP_HOURS;
    d.COUNTRIES_VISITED = +d.COUNTRIES_VISITED;
    d.ADVENTURE_RISK = +d.ADVENTURE_RISK;
  });

  // --- SEZIONE 1: DEMOGRAPHICS & INTRA-CATEGORY ---
  renderTravelDoughnut(data);
  renderCrowdPolar(data);
  renderRiskBar(data);
  renderCommuteSport(data);

  // --- SEZIONE 2: EXOTIC CROSS-CONNECTIONS ---
  renderRadarProfile(data); // Il grafico più figo
  renderBubbleComplex(data);
  renderScatterTravelTech(data);
  renderBarSocialSport(data);
});

// --- HELPER FUNCTIONS ---

function getFreq(data, key) {
  const counts = {};
  data.forEach((d) => {
    counts[d[key]] = (counts[d[key]] || 0) + 1;
  });
  return { labels: Object.keys(counts), values: Object.values(counts) };
}

function getAvgByGroup(data, groupKey, valKey) {
  const sums = {},
    counts = {};
  data.forEach((d) => {
    if (!sums[d[groupKey]]) {
      sums[d[groupKey]] = 0;
      counts[d[groupKey]] = 0;
    }
    sums[d[groupKey]] += d[valKey];
    counts[d[groupKey]]++;
  });
  const labels = Object.keys(sums);
  const values = labels.map((l) => (sums[l] / counts[l]).toFixed(1));
  return { labels, values };
}

// --- RENDERERS ---

// 1. Travel Doughnut (Simple)
function renderTravelDoughnut(data) {
  const freq = getFreq(data, "TRAVEL_STYLE");
  new Chart(document.getElementById("chartTravelDoughnut"), {
    type: "doughnut",
    data: {
      labels: freq.labels,
      datasets: [
        {
          data: freq.values,
          backgroundColor: PALETTE.charts,
          borderWidth: 0,
        },
      ],
    },
    options: { cutout: "60%" },
  });
}

// 2. Ideal Crowd (Polar Area - Exotic Pie)
function renderCrowdPolar(data) {
  const freq = getFreq(data, "IDEAL_CROWD");
  new Chart(document.getElementById("chartCrowdPolar"), {
    type: "polarArea",
    data: {
      labels: freq.labels,
      datasets: [
        {
          data: freq.values,
          backgroundColor: [
            "rgba(169, 197, 47, 0.7)", // Lime transp
            "rgba(78, 141, 150, 0.7)", // Teal transp
            "rgba(245, 245, 245, 0.7)", // White transp
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        r: {
          grid: { color: "rgba(255,255,255,0.05)" },
          ticks: { display: false },
        },
      },
    },
  });
}

// 3. Risk by Travel Style (Intra-Correlation)
function renderRiskBar(data) {
  const stats = getAvgByGroup(data, "TRAVEL_STYLE", "ADVENTURE_RISK");
  new Chart(document.getElementById("chartRiskBar"), {
    type: "bar",
    data: {
      labels: stats.labels,
      datasets: [
        {
          label: "Avg Risk Taking (1-5)",
          data: stats.values,
          backgroundColor: PALETTE.accent,
          borderRadius: 4,
        },
      ],
    },
    options: { scales: { y: { beginAtZero: true, max: 6 } } },
  });
}

// 4. Commute vs Sport (Stacked/Grouped Logic)
function renderCommuteSport(data) {
  const stats = getAvgByGroup(data, "WALKING_HABITS", "SPORT_HOURS");
  new Chart(document.getElementById("chartCommuteSport"), {
    type: "bar",
    data: {
      labels: stats.labels,
      datasets: [
        {
          label: "Avg Sport Hours/Week",
          data: stats.values,
          backgroundColor: "#4E8D96",
          borderRadius: 4,
        },
      ],
    },
    options: { indexAxis: "y" },
  });
}

// 5. RADAR CHART: Early Bird vs Night Owl (The "Exotic" one)
function renderRadarProfile(data) {
  // Filtro i dati
  const birds = data.filter((d) => d.CHRONOTYPE === "Early Bird");
  const owls = data.filter((d) => d.CHRONOTYPE === "Night Owl");

  // Calcolo medie manuali per 4 assi
  const getStats = (arr) => [
    d3.mean(arr, (d) => d.ENERGY_LEVEL),
    d3.mean(arr, (d) => d.SOCIAL_BATTERY),
    d3.mean(arr, (d) => d.SPORT_HOURS), // Sport è 0-7, gli altri 1-10. Va bene lo stesso visivamente
    d3.mean(arr, (d) => d.SCREEN_TIME),
  ];

  new Chart(document.getElementById("chartRadarProfile"), {
    type: "radar",
    data: {
      labels: [
        "Physical Energy",
        "Social Battery",
        "Sport Activity",
        "Screen Time",
      ],
      datasets: [
        {
          label: "Early Birds ☀️",
          data: getStats(birds),
          borderColor: PALETTE.accent,
          backgroundColor: "rgba(169, 197, 47, 0.2)",
          pointBackgroundColor: PALETTE.accent,
        },
        {
          label: "Night Owls 🌙",
          data: getStats(owls),
          borderColor: "#F5F5F5",
          backgroundColor: "rgba(245, 245, 245, 0.2)",
          pointBackgroundColor: "#F5F5F5",
        },
      ],
    },
    options: {
      scales: {
        r: {
          angleLines: { color: "rgba(255,255,255,0.1)" },
          grid: { color: "rgba(255,255,255,0.1)" },
          pointLabels: { color: PALETTE.text, font: { size: 12 } },
          suggestedMin: 0,
          suggestedMax: 10,
        },
      },
    },
  });
}

// 6. BUBBLE CHART: Social x Screen x Sleep x Chronotype
function renderBubbleComplex(data) {
  const dataset = data.map((d) => ({
    x: d.SOCIAL_BATTERY,
    y: d.SCREEN_TIME,
    r: d.SLEEP_HOURS * 1.5, // Scalo il raggio per vederlo meglio
    type: d.CHRONOTYPE,
  }));

  new Chart(document.getElementById("chartBubbleComplex"), {
    type: "bubble",
    data: {
      datasets: [
        {
          label: "Students",
          data: dataset,
          backgroundColor: (ctx) => {
            const type = ctx.raw ? ctx.raw.type : "";
            return type === "Early Bird" ? PALETTE.accent : "#4E8D96"; // Lime vs Teal
          },
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: false }, // Custom legend is in HTML
        tooltip: {
          callbacks: {
            label: (c) =>
              `${c.raw.type} | Soc: ${c.raw.x} | Scrn: ${c.raw.y} | Sleep: ${(
                c.raw.r / 1.5
              ).toFixed(1)}h`,
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Social Battery (Introvert -> Extrovert)",
          },
          min: 0,
          max: 11,
        },
        y: {
          title: { display: true, text: "Screen Time (Hours)" },
          min: 0,
          max: 12,
        },
      },
    },
  });
}

// 7. Scatter: Countries vs Tech (Is travel a detox?)
function renderScatterTravelTech(data) {
  const dataset = data.map((d) => ({
    x: d.COUNTRIES_VISITED,
    y: d.SCREEN_TIME,
  }));
  new Chart(document.getElementById("chartScatterTravelTech"), {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Student",
          data: dataset,
          backgroundColor: "#FF6B6B", // Coral for contrast
        },
      ],
    },
    options: {
      scales: {
        x: { title: { display: true, text: "Countries Visited" } },
        y: { title: { display: true, text: "Screen Time (Hours)" } },
      },
    },
  });
}

// 8. Bar Line Mix: Social vs Sport
function renderBarSocialSport(data) {
  // Raggruppo per livello di Social Battery (1-10) e calcolo media sport
  const sums = {},
    counts = {};
  for (let i = 1; i <= 10; i++) {
    sums[i] = 0;
    counts[i] = 0;
  } // init

  data.forEach((d) => {
    sums[d.SOCIAL_BATTERY] += d.SPORT_HOURS;
    counts[d.SOCIAL_BATTERY]++;
  });

  const labels = Object.keys(sums);
  const values = labels.map((l) => (counts[l] > 0 ? sums[l] / counts[l] : 0));

  new Chart(document.getElementById("chartBarSocialSport"), {
    type: "line", // Line chart filled looks like area
    data: {
      labels: labels,
      datasets: [
        {
          label: "Avg Sport Hours",
          data: values,
          borderColor: PALETTE.accent,
          backgroundColor: "rgba(169, 197, 47, 0.2)",
          fill: true,
          tension: 0.4, // Curva morbida
        },
      ],
    },
    options: {
      scales: {
        x: { title: { display: true, text: "Social Battery Level" } },
        y: { beginAtZero: true },
      },
    },
  });
}
