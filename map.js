// Creating the map
const map = L.map('map').setView([31.5, -97.5], 7);

// Base map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Global layer references
let pipelineLayer = L.geoJSON(null).addTo(map);
let countyLayer;

// Styling functions
function stylePipelines(feature) {
  const risk = feature.properties["Predicted_"];
  const colors = {
    'Low': '#f1c40f',
    'Moderate': '#e67e22',
    'High': '#e74c3c'
  };
  return {
    color: colors[risk] || '#999',
    weight: 2,
    opacity: 0.9
  };
}

function styleStudyArea() {
  return {
    color: '#000',
    weight: 3,
    dashArray: '6, 6',
    fillOpacity: 0
  };
}

function styleCounty() {
  return {
    color: '#444',
    weight: 1,
    fillOpacity: 0,
    fillColor: '#eee'
  };
}

// Function to calculate detailed stats for county popup
function getDetailedCountyPipelineStats(countyCode) {
  if (!window.allPipelineData || !window.allPipelineData.features) {
    return null;
  }

  const relevantPipelines = window.allPipelineData.features.filter(
    f => f.properties.COUNTY === countyCode
  );

  const count = relevantPipelines.length;
  if (count === 0) {
    return {
      count: 0,
      topOperator: "N/A",
      riskLevels: "N/A",
      avgPh: "N/A",
      avgClay: "N/A",
      avgEc: "N/A",
      avgTds: "N/A",
      avgSulfate: "N/A",
      avgChloride: "N/A"
    };
  }

  let sumPh = 0, countPh = 0;
  let sumClay = 0, countClay = 0;
  let sumEc = 0, countEc = 0;
  let sumTds = 0, countTds = 0;
  let sumSulfate = 0, countSulfate = 0;
  let sumChloride = 0, countChloride = 0;
  const operatorCounts = {};
  const riskCounts = { 'Low': 0, 'Moderate': 0, 'High': 0, 'Unknown': 0 };

  relevantPipelines.forEach(f => {
    const props = f.properties;

    if (props.OPER_NM) {
        const opName = props.OPER_NM.trim();
        if (opName) {
            operatorCounts[opName] = (operatorCounts[opName] || 0) + 1;
        }
    }

    const risk = props.Predicted_;
    if (risk && riskCounts.hasOwnProperty(risk)) {
      riskCounts[risk]++;
    } else {
      riskCounts.Unknown++;
    }

    let val;
    val = parseFloat(props.ph1to1h2o_);
    if (!isNaN(val)) { sumPh += val; countPh++; }

    val = parseFloat(props.claytotal_);
    if (!isNaN(val)) { sumClay += val; countClay++; }

    val = parseFloat(props.ec_r);
    if (!isNaN(val)) { sumEc += val; countEc++; }

    val = parseFloat(props.Total_Diss);
    if (!isNaN(val)) { sumTds += val; countTds++; }

    val = parseFloat(props.Sulfate);
    if (!isNaN(val)) { sumSulfate += val; countSulfate++; }

    val = parseFloat(props.Chloride);
    if (!isNaN(val)) { sumChloride += val; countChloride++; }
  });

  let topOperator = "N/A";
  let maxCount = 0;
  for (const operator in operatorCounts) {
      if (operatorCounts[operator] > maxCount) {
          maxCount = operatorCounts[operator];
          topOperator = operator;
      }
  }

  const riskLevelParts = [];
  if (riskCounts.High > 0) riskLevelParts.push(`High (${riskCounts.High})`);
  if (riskCounts.Moderate > 0) riskLevelParts.push(`Moderate (${riskCounts.Moderate})`);
  if (riskCounts.Low > 0) riskLevelParts.push(`Low (${riskCounts.Low})`);
  if (riskCounts.Unknown > 0) riskLevelParts.push(`Unknown (${riskCounts.Unknown})`);
  const riskLevelStr = riskLevelParts.join(', ') || "N/A";

  return {
    count: count,
    topOperator: topOperator,
    riskLevels: riskLevelStr,
    avgPh: countPh > 0 ? (sumPh / countPh).toFixed(2) : "N/A",
    avgClay: countClay > 0 ? (sumClay / countClay).toFixed(1) : "N/A",
    avgEc: countEc > 0 ? (sumEc / countEc).toFixed(2) : "N/A",
    avgTds: countTds > 0 ? (sumTds / countTds).toFixed(1) : "N/A",
    avgSulfate: countSulfate > 0 ? (sumSulfate / countSulfate).toFixed(1) : "N/A",
    avgChloride: countChloride > 0 ? (sumChloride / countChloride).toFixed(1) : "N/A"
  };
}

// Load the study area in
fetch('GeoJSON/Updated_Study_Area.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, { style: styleStudyArea }).addTo(map);
  })
  .catch(err => console.error("Error loading Study Area GeoJSON:", err)); // Keep error catch

// Load the counties iin
fetch('GeoJSON/County_Boundaries.geojson')
  .then(res => res.json())
  .then(data => {
    window.countyGeoJSON = data;
    countyLayer = L.geoJSON(data, {
      style: styleCounty,
      onEachFeature: (feature, layer) => {
        const countyCode = feature.properties.COUNTY || String(feature.properties.FIPS_ST_CN).slice(-3) || feature.properties.CNTY_NM || "Unknown Code";
        const countyName = feature.properties.CNTY_NM || countyCode;

        layer.on('click', (e) => {
          const stats = getDetailedCountyPipelineStats(countyCode);
          let popupContent = `<strong>${countyName} County</strong><br><hr>`;
          if (stats) {
              popupContent += `Pipeline Segments: ${stats.count}<br>`;
              popupContent += `Top Operator: ${stats.topOperator}<br>`;
              popupContent += `Risk Levels: ${stats.riskLevels}<br>`;
              popupContent += `Average Soil pH: ${stats.avgPh}<br>`;
              popupContent += `Average Clay Content (%): ${stats.avgClay}<br>`;
              popupContent += `Average Electrical Conductivity: ${stats.avgEc}<br>`;
              popupContent += `Average Total Dissolved Solids: ${stats.avgTds}<br>`;
              popupContent += `Average Sulfate: ${stats.avgSulfate}<br>`;
              popupContent += `Average Chloride: ${stats.avgChloride}<br>`;
          } else {
              popupContent += "Could not retrieve pipeline statistics.";
          }

          L.popup()
            .setLatLng(e.latlng)
            .setContent(popupContent)
            .openOn(map);

           L.DomEvent.stopPropagation(e);
        });

        layer.on('mouseover', function (e) {
          this.setStyle({ weight: 3, color: '#000', fillOpacity: 0.1 });
           if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                layer.bringToFront();
           }
        });
        layer.on('mouseout', function (e) {
          countyLayer.resetStyle(this);
        });

        layer.bindTooltip(countyName);
      }
    }).addTo(map);
  })

// Load the pipeline segments in
fetch('GeoJSON/FinalModelDataOutputResultsWGS.geojson')
  .then(res => res.json())
  .then(data => {
    window.allPipelineData = data;
  })