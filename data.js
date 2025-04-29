function loadPipelineData() {
  fetch("GeoJSON/FinalModelDataOutputResultsWGS.geojson")
    .then(res => res.json())
    .then(data => {
      window.allPipelineData = data;

      // Add to map
      if (pipelineLayer) {
        pipelineLayer.clearLayers();
        pipelineLayer.addData(data.features);
        pipelineLayer.setStyle(stylePipelines);
      }
      initCharts();	

      // Initialize stats and charts
      updateStats(data.features);
      updateCharts(data.features);
      populateFilters(data);

      // Apply filters initially
      applyFilters();
    })
}

document.addEventListener("DOMContentLoaded", () => {
  loadPipelineData();
});
