const { month, year } = getPreviousMonthAndYear();

displayDataDecember();

var mois = new Map();
mois.set("01", "Janvier");
mois.set("02", "Février");
mois.set("03", "Mars");
mois.set("04", "Avril");
mois.set("05", "Mai");
mois.set("06", "Juin");
mois.set("07", "Juillet");
mois.set("08", "Août");
mois.set("09", "Septembre");
mois.set("10", "Octobre");
mois.set("11", "Novembre");
mois.set("12", "Décembre");

var cancelledByMonth = new Map();

for(var [key,value] of mois) {
  showStatsForMonth(key,value);
}

showTotalYear();

function getPreviousMonthAndYear() {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return { month, year };
}

async function displayDataDecember() {
    const response = await fetch('https://ressources.data.sncf.com/api/v2/catalog/datasets/regularite-mensuelle-ter/records?refine=region:"Occitanie"&refine=date:"' + year + '-' + month + '"');
    const data = await response.json();
    const statProgrammed = data.records[0].record.fields.nombre_de_trains_programmes;
    const statLate = data.records[0].record.fields.nombre_de_trains_en_retard_a_l_arrivee;
    const statCancelled = data.records[0].record.fields.nombre_de_trains_annules
    document.getElementById("NbProgrammed").textContent += statProgrammed;
    document.getElementById("NbLate").textContent += statLate + ' (' + Math.round((statLate*100)/statProgrammed) +'%)';
    document.getElementById("NbCancelled").textContent += statCancelled + ' (' + Math.round((statCancelled*100)/statProgrammed) +'%)';
}

function switchViews() {
  const container = document.querySelector(".container");
  const container2 = document.querySelector(".container2");
  if (container.checkVisibility()) {
    container.classList.toggle("hidden");
    container2.classList.remove("hidden");
    showTotalYear();
  } else {
    container.classList.remove("hidden");
    container2.classList.toggle("hidden");
  }
}

async function showStatsForMonth(key, value) {
  const response = await fetch(
    'https://ressources.data.sncf.com/api/v2/catalog/datasets/regularite-mensuelle-ter/records?refine=region:"Occitanie"&refine=date:"' 
    + year + '-' + key + '"'
  );

  const data = await response.json();
  const stat = data.records[0].record.fields.nombre_de_trains_annules;

  cancelledByMonth.set(key, stat);

  document.getElementById(key).textContent = "Annulés : " + stat;
}

function showTotalYear() {
  let totalCancel = 0;

  for (let value of cancelledByMonth.values()) {
    totalCancel += value;
  }

  document.getElementById("total").textContent = "Annulés : " + totalCancel;
}

document.getElementById("switch").onclick = switchViews;
document.getElementById("titleYear").textContent += year;
