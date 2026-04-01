// KV Cognition Real-Time Inference Cost Engine Demo

document.addEventListener('DOMContentLoaded', renderCostDemo);

function renderCostDemo() {
  const container = document.getElementById('cost-demo');
  container.innerHTML = `
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
        <tr><td>1</td><td>RTX4090‑cluster</td><td>RTX 4090</td><td>55</td><td>78.8</td><td>12,698.3</td><td>1.58e‑6</td><td>1.58</td><td>2.45</td></tr>
        <tr><td>2</td><td>A100‑40GB</td><td>NVIDIA A100</td><td>90</td><td>125.4</td><td>7,972.1</td><td>2.20e‑6</td><td>2.20</td><td>1.83</td></tr>
        <tr><td>3</td><td>H100‑PCIe</td><td>NVIDIA H100</td><td>120</td><td>165.6</td><td>6,040.4</td><td>3.10e‑6</td><td>3.10</td><td>1.50</td></tr>
        <tr><td>4</td><td>A6000‑cluster</td><td>NVIDIA RTX A6000</td><td>70</td><td>98.2</td><td>10,184.5</td><td>2.80e‑6</td><td>2.80</td><td>2.20</td></tr>
        <tr><td>5</td><td>T4‑scaled</td><td>NVIDIA T4</td><td>30</td><td>42.1</td><td>23,755.8</td><td>1.20e‑6</td><td>1.20</td><td>3.80</td></tr>
        <tr><td>6</td><td>V100‑DGX</td><td>NVIDIA V100</td><td>85</td><td>118.9</td><td>8,411.1</td><td>2.50e‑6</td><td>2.50</td><td>1.95</td></tr>
        <tr><td>7</td><td>L4‑cluster</td><td>NVIDIA L4</td><td>40</td><td>56.1</td><td>17,824.2</td><td>1.10e‑6</td><td>1.10</td><td>3.95</td></tr>
        <tr><td>8</td><td>MI250X‑cluster</td><td>AMD MI250X</td><td>100</td><td>140.0</td><td>7,142.1</td><td>2.90e‑6</td><td>2.90</td><td>1.60</td></tr>
        <tr><td>9</td><td>H200‑DGX</td><td>NVIDIA H200</td><td>130</td><td>182.0</td><td>5,494.5</td><td>3.80e‑6</td><td>3.80</td><td>1.20</td></tr>
        <tr><td>10</td><td>A30‑cluster</td><td>NVIDIA A30</td><td>75</td><td>105.0</td><td>9,523.7</td><td>2.00e‑6</td><td>2.00</td><td>2.50</td></tr>
      </tbody>
    </table>
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
}
