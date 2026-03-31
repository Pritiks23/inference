// KV Cognition Real-Time Inference Cost Engine Demo

const clusters = [
  { name: "H100-cluster", gpu: "H100 80GB", costHr: 3.2, tokensSec: 230, costToken: 0.00000386 },
  { name: "A100-cluster", gpu: "A100 80GB", costHr: 1.65, tokensSec: 125, costToken: 0.00000367 },
  { name: "RTX4090-cluster", gpu: "RTX 4090", costHr: 0.5, tokensSec: 45, costToken: 0.00000309 },
  { name: "L40S-cluster", gpu: "L40S", costHr: 0.87, tokensSec: 44, costToken: 0.00000549 }
];

function renderCostDemo() {
  const container = document.getElementById('cost-demo');
  container.innerHTML = `
    <form id="costForm">
      <label>Tokens to process: <input type="number" id="tokens" value="1000000" min="1" step="1" required></label><br><br>
      <label>Tokens per request: <input type="number" id="tokensPerReq" value="100" min="1" step="1" required></label><br><br>
      <label>Batch size: <input type="number" id="batchSize" value="8" min="1" max="32" step="1" required></label><br><br>
      <label>Similarity ratio (0-1): <input type="number" id="similarity" value="0.7" min="0" max="1" step="0.01" required></label><br><br>
      <label>Target Latency (sec): <input type="number" id="latency" value="10" min="1" step="1" required></label><br><br>
      <label>Cluster:
        <select id="clusterSelect">
          <option value="auto">Auto-optimize</option>
          ${clusters.map(c => `<option value="${c.name}">${c.name} (${c.gpu})</option>`).join('')}
        </select>
      </label><br><br>
      <button type="submit">Calculate Optimization</button>
    </form>
    <div id="costResults"></div>
    <div style="margin-top:1.5rem;font-size:0.95em;color:#666;">*Simulates intelligent routing, batching, and KV-cache reuse for optimal cost and throughput.</div>
  `;
  document.getElementById('costForm').onsubmit = function(e) {
    e.preventDefault();
    showResults();
  };
}

function showResults() {
  const tokens = parseInt(document.getElementById('tokens').value, 10);
  const tokensPerReq = parseInt(document.getElementById('tokensPerReq').value, 10);
  const batchSize = parseInt(document.getElementById('batchSize').value, 10);
  const similarity = parseFloat(document.getElementById('similarity').value);
  const latency = parseInt(document.getElementById('latency').value, 10);
  const clusterChoice = document.getElementById('clusterSelect').value;

  // KV-cache reuse efficiency (simulate): up to 50% boost for similarity, 20% per extra batch item
  const baseBoost = 1.0 + 0.5 * similarity; // up to 50% boost
  const batchBoost = 1.0 + 0.2 * (batchSize - 1); // up to 20% per extra batch item
  const kvBatchBoost = baseBoost * batchBoost;
  const costReduction = 1.0 - (0.2 * similarity + 0.1 * (batchSize - 1) / 32); // up to 20%+ cost reduction

  // Select cluster
  let best;
  if (clusterChoice === "auto") {
    // Choose cluster with lowest cost/token that can meet throughput
    best = clusters[0];
    for (const c of clusters) {
      if (c.costToken < best.costToken) best = c;
    }
  } else {
    best = clusters.find(c => c.name === clusterChoice);
  }

  // Calculate optimized throughput and cost
  const optimizedTokensSec = best.tokensSec * kvBatchBoost;
  const timeNeeded = tokens / optimizedTokensSec;
  const hours = timeNeeded / 3600;
  const rawCost = best.costHr * hours;
  const optimizedCost = rawCost * costReduction;
  const costPerToken = optimizedCost / tokens;

  // Compute baseline (no optimization, average cluster)
  const avgCluster = clusters.reduce((a, c) => a + c.costToken, 0) / clusters.length;
  const baselineCost = tokens * avgCluster;
  const savings = baselineCost - optimizedCost;

  document.getElementById('costResults').innerHTML = `
    <h4>Optimization Results</h4>
    <ul>
      <li><b>Cluster:</b> ${best.name} (${best.gpu})</li>
      <li><b>Batch size:</b> ${batchSize}</li>
      <li><b>Similarity ratio:</b> ${similarity}</li>
      <li><b>Optimized Throughput:</b> ${optimizedTokensSec.toFixed(1)} tokens/sec (with batching & KV-cache)</li>
      <li><b>Time Needed:</b> ${timeNeeded.toFixed(1)} sec</li>
      <li><b>Optimized Cost:</b> $${optimizedCost.toFixed(2)} ($${costPerToken.toExponential(2)} per token)</li>
      <li><b>Estimated Savings:</b> $${savings.toFixed(2)} vs. average cluster</li>
    </ul>
  `;
}

document.addEventListener('DOMContentLoaded', renderCostDemo);
