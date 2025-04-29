let riskPieChart, commodityBarChart;

// Setup chart instances
function initCharts() {
  const pieCtx = document.getElementById('riskPieChart').getContext('2d');
  const barCtx = document.getElementById('commodityBarChart').getContext('2d');

  if (riskPieChart) riskPieChart.destroy();
  if (commodityBarChart) commodityBarChart.destroy();

  riskPieChart = new Chart(pieCtx, {
    type: 'pie',
    data: {
      labels: ['Low', 'Moderate', 'High'],
      datasets: [{
        label: 'Risk Level Distribution',
        backgroundColor: ['#f1c40f', '#e67e22', '#e74c3c'],
        data: [0, 0, 0]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { enabled: true }
      }
    }
  });

  commodityBarChart = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Segments per Commodity',
        backgroundColor: '#3498db',
        data: []
      }]
    },
    options: {
      responsive: true,
      indexAxis: 'y',
      scales: {
        x: { beginAtZero: true }
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      }
    }
  });
}

// Update chart values
function updateCharts(filtered) {
  // Pie Chart: Risk distribution
  const riskCounts = { Low: 0, Moderate: 0, High: 0 };
  filtered.forEach(f => {
    const risk = f.properties["Predicted_"];
    if (riskCounts[risk] !== undefined) riskCounts[risk]++;
  });

  riskPieChart.data.datasets[0].data = [
    riskCounts.Low,
    riskCounts.Moderate,
    riskCounts.High
  ];
  riskPieChart.update();

  // Bar Chart: Commodity count
  const commCounts = {};
  filtered.forEach(f => {
    const raw = f.properties.COMMODITY1;
    const name = getReadableCommodity(raw);
    commCounts[name] = (commCounts[name] || 0) + 1;
  });

  const labels = Object.keys(commCounts);
  const values = Object.values(commCounts);

  commodityBarChart.data.labels = labels;
  commodityBarChart.data.datasets[0].data = values;
  commodityBarChart.update();
}