function updateStats(filtered) {
  const total = filtered.length;
  let totalScore = 0;
  let highRiskCount = 0;

  filtered.forEach(f => {
    const props = f.properties;
    const score = parseFloat(props["Final_Risk"]);
    if (!isNaN(score)) totalScore += score;

    if (props["Predicted_"] === "High") highRiskCount++;
  });

  const avgScore = total > 0 ? totalScore / total : 0;
  const highPercent = total > 0 ? (100 * highRiskCount / total) : 0;

  document.getElementById("totalSegments").textContent = `Total Segments: ${total}`;
  document.getElementById("avgRiskScore").textContent = `Average Risk Score: ${avgScore.toFixed(2)}`;
  document.getElementById("highRiskPercent").textContent = `High Risk %: ${highPercent.toFixed(1)}%`;
}
