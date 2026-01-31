const cbYear = document.getElementById("yearSelect");
const cbRegion = document.getElementById("regionSelect")

// ===============================
// Mois / Année précédente
// ===============================
const { month, year } = getPreviousMonthAndYear();
document.getElementById("titleRegion").textContent = "Occitanie";
document.getElementById("titleYear").textContent = year;

// ===============================
// Données mensuelles (vue 1)
// ===============================
displayDataDecember();

// ===============================
// Mois
// ===============================
const mois = new Map([
  ["01", "Janvier"],
  ["02", "Février"],
  ["03", "Mars"],
  ["04", "Avril"],
  ["05", "Mai"],
  ["06", "Juin"],
  ["07", "Juillet"],
  ["08", "Août"],
  ["09", "Septembre"],
  ["10", "Octobre"],
  ["11", "Novembre"],
  ["12", "Décembre"]
]);

const statsByMonth = new Map();

// ===============================
// Création du graphique UNE FOIS
// ===============================
const barCanvas = document.getElementById("barCanvas");

const barChart = new Chart(barCanvas, {
  type: "bar",
  data: {
    labels: Array.from(mois.values()),
    datasets: [{
      label: "Trains en retard",
      data: new Array(12).fill(0)
    },
    {
      label: "Trains annulés",
      data: new Array(12).fill(0)
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false
  }
});

// ===============================
// Switch de vue
// ===============================
btnMonth = document.getElementById("btnMonth");
btnYear = document.getElementById("btnYear");

async function switchViews() {
  const container = document.querySelector(".container");
  const container2 = document.querySelector(".container2");

  if (!container.classList.contains("hidden")) {
    container.classList.add("hidden");
    container2.classList.remove("hidden");
    btnMonth.disabled = false;
    btnYear.disabled = true;

    await loadYearStats();
    updateChart();
    showTotalYear();
  } else {
    container.classList.remove("hidden");
    container2.classList.add("hidden");
    btnMonth.disabled = true;
    btnYear.disabled = false;
  }
};

btnMonth.onclick = switchViews;
btnYear.onclick = switchViews;

// ===============================
// Fonctions
// ===============================
function getPreviousMonthAndYear() {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);

  return {
    month: String(date.getMonth() + 1).padStart(2, "0"),
    year: date.getFullYear()
  };
}

// ----------
// Mois précédent
// ----------
async function displayDataDecember() {
  const response = await fetch(
    `https://ressources.data.sncf.com/api/v2/catalog/datasets/regularite-mensuelle-ter/records?refine=region:"Occitanie"&refine=date:"${year}-${month}"`
  );

  const data = await response.json();
  if (!data.records.length) return;

  const f = data.records[0].record.fields;

  document.getElementById("NbProgrammed").textContent = f.nombre_de_trains_programmes;
  document.getElementById("NbLate").textContent =
    `${f.nombre_de_trains_en_retard_a_l_arrivee} (${Math.round(((f.nombre_de_trains_en_retard_a_l_arrivee * 100) / f.nombre_de_trains_programmes)*10)/10}%)`;
  document.getElementById("NbCancelled").textContent =
    `${f.nombre_de_trains_annules} (${Math.round(((f.nombre_de_trains_annules * 100) / f.nombre_de_trains_programmes)*10)/10}%)`;
}

// ----------
// Intéractions Combobox
// ----------
function loadCombobox() {
  for (let i = year; i>=2013 ; i--) {
    newOption = document.createElement("option");
    newOption.setAttribute("value", i);
    newOption.innerHTML = i;
    cbYear.appendChild(newOption);
  }
}

async function refreshYearStats() {
  await loadYearStats();
  updateChart();
  showTotalYear();
  document.getElementById("titleRegion").textContent = cbRegion.options[cbRegion.selectedIndex].text;
  document.getElementById("titleYear").textContent = cbYear.value;
}

loadCombobox();
cbRegion.onchange = refreshYearStats;
cbYear.onchange = refreshYearStats;

// ----------
// Stats annuelles (PARALLÈLE)
// ----------
async function loadYearStats() {
  statsByMonth.clear();

  const promises = Array.from(mois.keys()).map((key) => fetchMonth(cbRegion.value, cbYear.value, key));
  await Promise.all(promises);
}

async function fetchMonth(selectedRegion, selectedYear, key) {
  const response = await fetch(
    `https://ressources.data.sncf.com/api/v2/catalog/datasets/regularite-mensuelle-ter/records?refine=region:"${selectedRegion}"&refine=date:"${selectedYear}-${key}"`
  );

  const data = await response.json();
  let stat = 0;

  if (data.records.length) {
    const fields = data.records[0].record.fields;

    stat = [
      fields.nombre_de_trains_programmes,
      fields.nombre_de_trains_en_retard_a_l_arrivee,
      fields.nombre_de_trains_annules
    ];
  }

  statsByMonth.set(key, stat);
}

// ----------
// MAJ graphique
// ----------
function updateChart() {
  const chart = document.querySelector(".chart-wrapper");
  const noData = document.querySelector(".noData");
  const totalSection = document.getElementById("totalSection");

  const retards = Array.from(mois.keys()).map(
    k => statsByMonth.get(k)?.[1] ?? 0
  );

  const annules = Array.from(mois.keys()).map(
    k => statsByMonth.get(k)?.[2] ?? 0
  );

  barChart.data.datasets[0].data = retards;
  barChart.data.datasets[1].data = annules;

  if (retards[0] == 0 && retards[11] == 0 && annules[0] == 0 && annules[11] == 0) {
    chart.classList.add("hidden");
    noData.classList.remove("hidden");
    totalSection.classList.add("hidden");
  } else {
    barChart.update();
    chart.classList.remove("hidden");
    noData.classList.add("hidden");
    totalSection.classList.remove("hidden");
  }
}

// ----------
// Total annuel
// ----------
function showTotalYear() {
  let totalProg = 0;
  let totalLate = 0;
  let totalCancel = 0;

  for (const stats of statsByMonth.values()) {
    totalProg += stats?.[0] ?? 0;
    totalLate += stats?.[1] ?? 0;
    totalCancel += stats?.[2] ?? 0;
  }

  document.getElementById("totalProg").textContent = "Programmés : " + totalProg;
  document.getElementById("totalLate").textContent = "En retard : " + totalLate + " (" + Math.round(((totalLate*100)/totalProg)*10)/10 + "%)";
  document.getElementById("totalCancel").textContent = "Annulés : " + totalCancel + " (" + Math.round(((totalCancel*100)/totalProg)*10)/10 + "%)";
}