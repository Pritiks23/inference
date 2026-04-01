// KV Cognition Real-Time Inference Cost Engine Demo

const clusters = [
  { name: "RTX4090‑cluster", gpu: "RTX 4090", base: 55, opt: 78.8, rate: 3, costToken: 1.58e-6 },
  { name: "A100‑40GB", gpu: "NVIDIA A100", base: 90, opt: 125.4, rate: 7, costToken: 2.20e-6 },
  { name: "H100‑PCIe", gpu: "NVIDIA H100", base: 120, opt: 165.6, rate: 10, costToken: 3.10e-6 },
  { name: "A6000‑cluster", gpu: "NVIDIA RTX A6000", base: 70, opt: 98.2, rate: 5.6, costToken: 2.80e-6 },
  { name: "T4‑scaled", gpu: "NVIDIA T4", base: 30, opt: 42.1, rate: 1.2, costToken: 1.20e-6 },
  { name: "V100‑DGX", gpu: "NVIDIA V100", base: 85, opt: 118.9, rate: 4.5, costToken: 2.50e-6 },
  { name: "L4‑cluster", gpu: "NVIDIA L4", base: 40, opt: 56.1, rate: 1.5, costToken: 1.10e-6 },
  { name: "MI250X‑cluster", gpu: "AMD MI250X", base: 100, opt: 140.0, rate: 6.5, costToken: 2.90e-6 },
  { name: "H200‑DGX", gpu: "NVIDIA H200", base: 130, opt: 182.0, rate: 12, costToken: 3.80e-6 },
  { name: "A30‑cluster", gpu: "NVIDIA A30", base: 75, opt: 105.0, rate: 3.8, costToken: 2.00e-6 }
];

document.addEventListener('DOMContentLoaded', renderCostDemo);

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
      <button type="submit" class="run-btn">Calculate Optimization</button>
    </form>
    <div id="resultsTable"></div>
    <div class="results-note">
      <b>🧠 How These Numbers Were Calculated</b><br>
      <ol>
        <li><b>Base Throughput:</b> Typical tokens/sec based on raw cluster performance (no batching/KV‑cache).</li>
        <li><b>Optimized Throughput:</b> Applies batching & similarity heuristics:<br>
        Optimized Throughput ≈ Base Throughput × (1 + batching_gain × similarity_ratio)<br>
        Where batching_gain scales with GPU architecture (e.g., 1.20 – 1.40).</li>
        <li><b>Time Needed:</b> Time Needed (sec) = Total Tokens / Optimized Throughput</li>
        <li><b>Optimized Cost:</b> Optimized Cost ($) = Time Needed × Hourly_Rate / 3600</li>
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
  // Use batching_gain for each GPU (example: 1.2 for most, 1.3 for H100/H200, 1.25 for A100)
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
  // Calculate cluster average cost for savings
  let avgCost = 0;
  clusters.forEach(c => {
    const optThroughput = c.base * (1 + batchingGains[c.name] * similarity);
    const timeNeeded = tokens / optThroughput;
    const optCost = timeNeeded * c.rate / 3600;
    avgCost += optCost;
  });
  avgCost = avgCost / clusters.length;

  let rows = clusters.map((c, i) => {
    const batching_gain = batchingGains[c.name];
    const optThroughput = +(c.base * (1 + batching_gain * similarity)).toFixed(1);
    const timeNeeded = +(tokens / optThroughput).toFixed(1);
    const optCost = +(timeNeeded * c.rate / 3600).toFixed(2);
    const savings = +(avgCost - optCost).toFixed(2);
    return `<tr><td>${i+1}</td><td>${c.name}</td><td>${c.gpu}</td><td>${c.base}</td><td>${optThroughput}</td><td>${timeNeeded}</td><td>${c.costToken.toExponential(2)}</td><td>${optCost}</td><td>${savings}</td></tr>`;
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
  `;
}
