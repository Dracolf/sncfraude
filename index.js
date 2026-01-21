const { month, year } = getPreviousMonthAndYear();

displayDataDecember();

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