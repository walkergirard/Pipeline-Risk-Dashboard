let currentCounty = "All";
let currentCommodity = "All";
let currentRisk = "All";

// Commodity code-to-name map (Consolidated & Uppercase Keys)
const commodityMap = {
  "CRO": "Crude Oil",
  "CRL": "Crude Oil",
  "CFL": "Crude Oil",
  "CRA": "Crude Oil",
  "NGT": "Natural Gas",
  "NGG": "Natural Gas",
  "NFG": "Natural Gas",
  "NGZ": "Natural Gas",
  "AA": "Anhydrous Ammonia",
  "CO2": "Carbon Dioxide",
  "HVL": "Highly Volatile Liquid",
  "PRD": "Refined Liquid Product",
  "OGT": "Other Gas",
  "LPG": "Liquefied Petroleum Gas",
  "AIR": "Air",
  "H2O": "Water",
  "UNK": "Unknown",
  "PROP": "Propane"
};

function getReadableCommodity(code) {
  if (typeof code !== 'string') {
      return code;
  }
  const lookupKey = code.trim().toUpperCase();
  return commodityMap[lookupKey] || code.trim();
}

// Look up countty name from code using the loaded GeoJSON
function getCountyNameFromGeoJSON(code) {
    if (!window.countyGeoJSON) return code;
    const searchCode = String(code).trim();
    const feature = window.countyGeoJSON.features.find(f => {
        const fips = f.properties.FIPS_ST_CN ? String(f.properties.FIPS_ST_CN).slice(-3) : null;
        const countyProp = f.properties.COUNTY ? String(f.properties.COUNTY).trim() : null;
        return fips === searchCode || countyProp === searchCode;
    });
    return feature ? (feature.properties.CNTY_NM || searchCode) : searchCode;
}

// Populate filter dropdowns
function populateFilters(data) {
  const counties = new Set();
  const readableCommodityNames = new Set();
  const risks = new Set();

  if (!data || !data.features || data.features.length === 0) {
      return; // Exit if no data
  }

  data.features.forEach(f => {
    // County
    if (f.properties && f.properties.COUNTY) {
        const countyCode = String(f.properties.COUNTY).trim();
        if (countyCode) counties.add(countyCode);
    }
    // Commodity
    if (f.properties && f.properties.COMMODITY1) {
        const commodityCode = String(f.properties.COMMODITY1).trim();
        if (commodityCode) {
            const readableName = getReadableCommodity(commodityCode);
            readableCommodityNames.add(readableName);
        }
    }
    // Risk
    if (f.properties && f.properties["Predicted_"]) {
        const riskLevel = String(f.properties["Predicted_"]).trim();
        if(riskLevel) risks.add(riskLevel);
    }
  });

  const countySelect = document.getElementById("countyFilter");
  const commoditySelect = document.getElementById("commodityFilter");
  const riskSelect = document.getElementById("riskFilter");

  // Clear existing options
  countySelect.innerHTML = '<option value="All">All Counties</option>';
  commoditySelect.innerHTML = '<option value="All">All Commodities</option>';
  riskSelect.innerHTML = '<option value="All">All Risk Levels</option>';

  // Populate Counties
  Array.from(counties).sort().forEach(c => {
    const countyName = getCountyNameFromGeoJSON(c);
    countySelect.innerHTML += `<option value="${c}">${countyName || c} County</option>`;
  });

  // Populate Commodities
  Array.from(readableCommodityNames).sort().forEach(readableName => {
    commoditySelect.innerHTML += `<option value="${readableName}">${readableName}</option>`;
  });

  // Populate Risks
  Array.from(risks).sort().forEach(r => {
    riskSelect.innerHTML += `<option value="${r}">${r}</option>`;
  });

  // Event Listeners
  countySelect.addEventListener("change", e => {
    currentCounty = e.target.value;
    applyFilters();
  });

  commoditySelect.addEventListener("change", e => {
    currentCommodity = e.target.value;
    applyFilters();
  });

  riskSelect.addEventListener("change", e => {
    currentRisk = e.target.value;
    applyFilters();
  });
}

// Handle map click filter sync
document.addEventListener("countySelected", e => {
  const clickedCountyCode = String(e.detail).trim();
  currentCounty = clickedCountyCode;
  document.getElementById("countyFilter").value = currentCounty;
  applyFilters();
});

// Apply filter logic
function applyFilters() {
  if (!window.allPipelineData || !window.allPipelineData.features){
    pipelineLayer.clearLayers();
    if (typeof updateStats === 'function') updateStats([]);
    if (typeof updateCharts === 'function') updateCharts([]);
    return;
  }

  const filtered = window.allPipelineData.features.filter(f => {
    const props = f.properties;

    // County matching
    const featureCounty = props.COUNTY ? String(props.COUNTY).trim() : null;
    const matchCounty = currentCounty === "All" || featureCounty === currentCounty;

    // Commodity matching
    let matchComm = true;
    if (currentCommodity !== "All") {
        const pipelineCode = props.COMMODITY1 ? String(props.COMMODITY1).trim() : null;
        if (pipelineCode) {
            const pipelineReadableCommodity = getReadableCommodity(pipelineCode);
            matchComm = (pipelineReadableCommodity === currentCommodity);
        } else {
            matchComm = false;
        }
    }

    // Risk matching
    const featureRisk = props["Predicted_"] ? String(props["Predicted_"]).trim() : null;
    const matchRisk = currentRisk === "All" || featureRisk === currentRisk;

    return matchCounty && matchComm && matchRisk;
  });

  pipelineLayer.clearLayers();
  pipelineLayer.addData(filtered);

  // Reapply styles
  if (typeof stylePipelines === 'function') {
      pipelineLayer.setStyle(stylePipelines);
  }

  // Update stats and charts
   if (typeof updateStats === 'function') {
        updateStats(filtered);
   }
   if (typeof updateCharts === 'function') {
        updateCharts(filtered);
   }
}