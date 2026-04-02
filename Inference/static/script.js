// KV Cognition Real-Time Inference Cost Engine Demo

const clusters = [
  { name: "RTX4090‑cluster", gpu: "RTX 4090", base: 55, opt: 78.8, rate: 3 },
  { name: "A100‑40GB", gpu: "NVIDIA A100", base: 90, opt: 125.4, rate: 7 },
  { name: "H100‑PCIe", gpu: "NVIDIA H100", base: 120, opt: 165.6, rate: 10 },
  { name: "A6000‑cluster", gpu: "NVIDIA RTX A6000", base: 70, opt: 98.2, rate: 5.6 },
  { name: "T4‑scaled", gpu: "NVIDIA T4", base: 30, opt: 42.1, rate: 1.2 },
  { name: "V100‑DGX", gpu: "NVIDIA V100", base: 85, opt: 118.9, rate: 4.5 },
  { name: "L4‑cluster", gpu: "NVIDIA L4", base: 40, opt: 56.1, rate: 1.5 },
  { name: "MI250X‑cluster", gpu: "AMD MI250X", base: 100, opt: 140.0, rate: 6.5 },
  { name: "H200‑DGX", gpu: "NVIDIA H200", base: 130, opt: 182.0, rate: 12 },
  { name: "A30‑cluster", gpu: "NVIDIA A30", base: 75, opt: 105.0, rate: 3.8 }
];

function getBatchScaling(name) {
  if (name.includes('T4') || name.includes('L4')) return 0.18;
  if (name.includes('A100')) return 0.12;
  if (name.includes('H100') || name.includes('H200')) return 0.10;
  return 0.14; // Default for others
}
const kvScaling = 0.5; // Consistent KV-cache scaling

document.addEventListener('DOMContentLoaded', () => {
  renderCostDemo();
  // What-If slider
  const slider = document.getElementById('whatif-slider');
  if (slider) {
    slider.addEventListener('input', function() {
      document.getElementById('whatif-value').textContent = this.value;
      document.getElementById('similarity').value = this.value;
      showResults();
    });
  }
});

function renderCostDemo() {
  const container = document.getElementById('cost-demo');
  container.innerHTML = `
    <form id="userInputForm" class="user-input-form">
      <label>Total Tokens to Process
        <input type="number" id="tokens" value="1000000" min="1" step="1" required>
      </label>
      <label>Similarity Ratio (0-1)
        <input type="number" id="similarity" value="0.7" min="0" max="1" step="0.01" required>
      </label>
      <label>Batch Size
        <input type="number" id="batchSize" value="8" min="1" max="128" step="1" required>
      </label>
      <button type="submit" class="run-btn">Calculate Optimization</button>
    </form>
    <div id="optResults"></div>
    <div id="resultsTable"></div>
  `;
  document.getElementById('userInputForm').onsubmit = function(e) {
    e.preventDefault();
    showResults();
  };
  showResults();
}

function showResults() {
  const tokens = parseInt(document.getElementById('tokens').value, 10);
  const similarity = parseFloat(document.getElementById('similarity').value);
  const batchSize = parseInt(document.getElementById('batchSize').value, 10);

  // Find H100 cluster for savings calculation
  const h100 = clusters.find(c => c.name.includes('H100'));
  let h100Cost = null;

  // Dynamic throughput calculation
  let best = null;
  let minCost = Infinity;
  let fastest = null;
  let minTime = Infinity;
  let bestBalance = null;
  let bestBalanceScore = -Infinity;
  let clusterResults = [];

  clusters.forEach(c => {
    // Dynamic throughput: batch scaling varies by GPU tier, KV-cache scaling consistent
    const batchScaling = getBatchScaling(c.name);
    const optThroughput = +(c.base * (1 + batchScaling * (batchSize - 1)) * (1 + kvScaling * similarity)).toFixed(1);
    const timeNeeded = +(tokens / optThroughput).toFixed(1);
    const optCost = +(timeNeeded * c.rate / 3600).toFixed(2);
    const perToken = +(optCost / tokens).toExponential(2);
    clusterResults.push({
      ...c,
      optThroughput,
      timeNeeded,
      optCost,
      perToken
    });
    if (c === h100) h100Cost = optCost;
    if (optCost < minCost) {
      best = { ...c, optThroughput, timeNeeded, optCost, perToken };
      minCost = optCost;
    }
    if (timeNeeded < minTime) {
      fastest = { ...c, optThroughput, timeNeeded, optCost, perToken };
      minTime = timeNeeded;
    }
    // Best balance: lowest (cost * time)
    const balanceScore = 1 / (optCost * timeNeeded);
    if (balanceScore > bestBalanceScore) {
      bestBalance = { ...c, optThroughput, timeNeeded, optCost, perToken };
      bestBalanceScore = balanceScore;
    }
  });

  // Dynamic explanation
  const why = [
    `Meets latency constraint (user target: ${best.timeNeeded.toLocaleString()}s)`,
    `Best cost per token under workload`,
    `High KV-cache reuse efficiency (${similarity} similarity)`
  ];
  document.getElementById('why-explanation').innerHTML = `
    <b>Why this cluster was selected:</b>
    <ul>${why.map(x => `<li>${x}</li>`).join('')}</ul>
  `;

  // Cluster ranking table (dynamic)
  const rankRows = [
    `<tr><th>Rank</th><th>Cluster</th><th>Why</th></tr>`,
    `<tr><td>🥇</td><td>${best.name}</td><td>Cheapest</td></tr>`,
    `<tr><td>⚡</td><td>${fastest.name}</td><td>Fastest</td></tr>`,
    `<tr><td>⚖️</td><td>${bestBalance.name}</td><td>Best balance</td></tr>`
  ].join('');
  document.getElementById('rank-table').innerHTML = rankRows;

  // Main summary
  let savings = h100Cost !== null ? +(h100Cost - best.optCost).toFixed(2) : 'N/A';
  document.getElementById('optResults').innerHTML = `
    <div class="opt-summary">
      <h4>Optimization Results</h4>
      <ul>
        <li><b>Cluster:</b> ${best.name} (${best.gpu})</li>
        <li><b>Batch size:</b> ${batchSize}</li>
        <li><b>Similarity ratio:</b> ${similarity}</li>
        <li><b>Optimized Throughput:</b> ${best.optThroughput} tokens/sec (with batching & KV-cache)</li>
        <li><b>Time Needed:</b> ${best.timeNeeded.toLocaleString()} sec</li>
        <li><b>Optimized Cost:</b> $${best.optCost} ($${best.perToken} per token)</li>
        <li><b>Estimated Savings:</b> $${savings} (H100 cluster cost – current cluster cost)</li>
      </ul>
    </div>
  `;

  // Table (unchanged)
  let rows = clusterResults.map((c, i) => {
    let rowSavings = h100Cost !== null ? +(h100Cost - c.optCost).toFixed(2) : 'N/A';
    return `<tr><td>${i+1}</td><td>${c.name}</td><td>${c.gpu}</td><td>${c.base}</td><td>${c.optThroughput}</td><td>${c.timeNeeded}</td><td>${c.perToken}</td><td>${c.optCost}</td><td>${rowSavings}</td></tr>`;
  }).join('');
  document.getElementById('resultsTable').innerHTML = `
    <table class="results-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Cluster Name</th>
          <th>GPU Type</th>
          <th>Base Throughput<br>(tokens/sec)</th>
          <th>Optimized Throughput<br>(tokens/sec)</th>
          <th>Time Needed<br>(sec)</th>
          <th>Est. Cost per Token ($)</th>
          <th>Optimized Cost ($)</th>
          <th>Est. Savings ($)</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    <div class="results-summary">
      <b>Summary:</b> Showing all clusters. Optimization based on ${tokens.toLocaleString()} tokens, similarity ratio ${similarity}, batch size ${batchSize}.
    </div>
  `;
}
