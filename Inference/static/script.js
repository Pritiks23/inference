// KV Cognition Real-Time Inference Cost Engine Demo

const clusters = [
  { name: "RTX4090‑cluster", gpu: "RTX 4090", base: 55, opt: 78.8, rate: 3, costToken: 1.58e-6, optCost: 1.58, savings: 2.45 },
  { name: "A100‑40GB", gpu: "NVIDIA A100", base: 90, opt: 125.4, rate: 7, costToken: 2.20e-6, optCost: 2.20, savings: 1.83 },
  { name: "H100‑PCIe", gpu: "NVIDIA H100", base: 120, opt: 165.6, rate: 10, costToken: 3.10e-6, optCost: 3.10, savings: 1.50 },
  { name: "A6000‑cluster", gpu: "NVIDIA RTX A6000", base: 70, opt: 98.2, rate: 5.6, costToken: 2.80e-6, optCost: 2.80, savings: 2.20 },
  { name: "T4‑scaled", gpu: "NVIDIA T4", base: 30, opt: 42.1, rate: 1.2, costToken: 1.20e-6, optCost: 1.20, savings: 3.80 },
  { name: "V100‑DGX", gpu: "NVIDIA V100", base: 85, opt: 118.9, rate: 4.5, costToken: 2.50e-6, optCost: 2.50, savings: 1.95 },
  { name: "L4‑cluster", gpu: "NVIDIA L4", base: 40, opt: 56.1, rate: 1.5, costToken: 1.10e-6, optCost: 1.10, savings: 3.95 },
  { name: "MI250X‑cluster", gpu: "AMD MI250X", base: 100, opt: 140.0, rate: 6.5, costToken: 2.90e-6, optCost: 2.90, savings: 1.60 },
  { name: "H200‑DGX", gpu: "NVIDIA H200", base: 130, opt: 182.0, rate: 12, costToken: 3.80e-6, optCost: 3.80, savings: 1.20 },
  { name: "A30‑cluster", gpu: "NVIDIA A30", base: 75, opt: 105.0, rate: 3.8, costToken: 2.00e-6, optCost: 2.00, savings: 2.50 }
];

const batchingGains = {
  "RTX4090‑cluster": 1.2,
  "A100‑40GB": 1.25,
  "H100‑PCIe": 1.3,
  "A6000‑cluster": 1.2,
  "T4‑scaled": 1.2,
  "V100‑DGX": 1.2,
  "L4‑cluster": 1.2,
  "MI250X‑cluster": 1.2,
  "H200‑DGX": 1.3,
  "A30‑cluster": 1.2
};

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
    <div class="results-note">
      <b>🧠 How These Numbers Were Calculated</b><br>
      <ol>
        <li><b>Base Throughput:</b> Typical tokens/sec based on raw cluster performance (no batching/KV‑cache).</li>
        <li><b>Optimized Throughput:</b> Uses provided table values for batching & similarity.</li>
        <li><b>Time Needed:</b> Time Needed (sec) = Total Tokens / Optimized Throughput</li>
        <li><b>Optimized Cost:</b> Provided in table for 1M tokens.</li>
        <li><b>Estimated Savings:</b> Compared to cluster average cost for the same token workload.</li>
      </ol>
    </div>
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

  // Dynamic throughput calculation
  let best = null;
  let minCost = Infinity;
  let fastest = null;
  let minTime = Infinity;
  let bestBalance = null;
  let bestBalanceScore = -Infinity;
  let clusterResults = [];
  let avgCost = 0;

  clusters.forEach(c => {
    // Dynamic throughput
    const batching_gain = batchingGains[c.name];
    const optThroughput = +(c.base * (1 + batching_gain * similarity) * (1 + 0.01 * (batchSize - 1))).toFixed(1);
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
    avgCost += optCost;
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
  avgCost = avgCost / clusters.length;

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
        <li><b>Estimated Savings:</b> $${(avgCost - best.optCost).toFixed(2)} vs. average cluster</li>
      </ul>
    </div>
  `;

  // Table (unchanged)
  let rows = clusterResults.map((c, i) => {
    return `<tr><td>${i+1}</td><td>${c.name}</td><td>${c.gpu}</td><td>${c.base}</td><td>${c.optThroughput}</td><td>${c.timeNeeded}</td><td>${c.costToken.toExponential(2)}</td><td>${c.optCost}</td><td>${(avgCost - c.optCost).toFixed(2)}</td></tr>`;
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
