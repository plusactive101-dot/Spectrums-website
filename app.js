// Data store for Stock Screener candidates
const screenerData = [
  {
    ticker: "NVDA",
    tvSymbol: "NASDAQ:NVDA",
    name: "Nvidia Corporation",
    sector: "Semiconductors / AI",
    setup: "Breakout",
    catalyst: "Data center GPU demand & Blackwell deployment ramp",
    entry: "$138.50",
    target: "$165.00",
    stop: "$129.00",
    rr: "2.8 : 1",
    status: "Triggered",
    statusColor: "emerald"
  },
  {
    ticker: "PLTR",
    tvSymbol: "NASDAQ:PLTR",
    name: "Palantir Technologies",
    sector: "Enterprise Software",
    setup: "Momentum",
    catalyst: "AIP commercial adoption & S&P 500 inclusion flow",
    entry: "$42.00",
    target: "$54.00",
    stop: "$38.50",
    rr: "3.4 : 1",
    status: "Active",
    statusColor: "cyan"
  },
  {
    ticker: "TSLA",
    tvSymbol: "NASDAQ:TSLA",
    name: "Tesla Inc",
    sector: "EV & Autonomous Robotics",
    setup: "Breakout",
    catalyst: "Robotaxi fleet milestones & Energy storage margin expansion",
    entry: "$245.00",
    target: "$295.00",
    stop: "$228.00",
    rr: "2.9 : 1",
    status: "Watching",
    statusColor: "amber"
  },
  {
    ticker: "APP",
    tvSymbol: "NASDAQ:APP",
    name: "AppLovin Corp",
    sector: "AdTech & AI Software",
    setup: "Momentum",
    catalyst: "AXON 2.0 AI ad engine accelerating e-commerce monetization",
    entry: "$165.00",
    target: "$220.00",
    stop: "$148.00",
    rr: "3.2 : 1",
    status: "Active",
    statusColor: "cyan"
  },
  {
    ticker: "FCX",
    tvSymbol: "NYSE:FCX",
    name: "Freeport-McMoRan",
    sector: "Copper & Critical Materials",
    setup: "Pullback",
    catalyst: "Global copper deficit & grid infrastructure buildout",
    entry: "$48.20",
    target: "$58.00",
    stop: "$45.10",
    rr: "3.1 : 1",
    status: "Watching",
    statusColor: "amber"
  },
  {
    ticker: "AMD",
    tvSymbol: "NASDAQ:AMD",
    name: "Advanced Micro Devices",
    sector: "Semiconductors",
    setup: "Pullback",
    catalyst: "MI325X enterprise adoption & PC refresh cycle",
    entry: "$152.00",
    target: "$182.00",
    stop: "$142.50",
    rr: "3.1 : 1",
    status: "Triggered",
    statusColor: "emerald"
  }
];

let currentFilter = 'all';
let currentSymbol = 'NASDAQ:NVDA';

// Render Screener Table
function renderTable() {
  const tbody = document.getElementById('screenerTableBody');
  if (!tbody) return;

  const filtered = currentFilter === 'all' 
    ? screenerData 
    : screenerData.filter(item => item.setup.toLowerCase() === currentFilter.toLowerCase());

  tbody.innerHTML = filtered.map(item => {
    const isSelected = item.tvSymbol === currentSymbol;
    return `
      <tr class="hover:bg-slate-800/50 cursor-pointer transition ${isSelected ? 'bg-slate-800/80 border-l-2 border-cyan-400' : ''}" 
          onclick="selectTicker('${item.tvSymbol}', '${item.ticker}')">
        <td class="py-3 px-3">
          <div class="flex items-center space-x-2">
            <span class="font-bold text-white mono text-sm">${item.ticker}</span>
            <span class="text-[10px] text-slate-400 hidden sm:inline">${item.name}</span>
          </div>
        </td>
        <td class="py-3 px-3 text-slate-300 text-xs">${item.sector}</td>
        <td class="py-3 px-3">
          <div class="text-xs text-slate-200">${item.catalyst}</div>
          <span class="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] mono bg-slate-800 text-slate-400 border border-slate-700">
            ${item.setup}
          </span>
        </td>
        <td class="py-3 px-3 mono text-xs text-white">${item.entry}</td>
        <td class="py-3 px-3 mono text-xs text-emerald-400 font-semibold">${item.target}</td>
        <td class="py-3 px-3 mono text-xs text-rose-400">${item.stop}</td>
        <td class="py-3 px-3 mono text-xs text-cyan-300 font-semibold">${item.rr}</td>
        <td class="py-3 px-3">
          <span class="px-2 py-0.5 rounded-full text-[10px] mono font-bold bg-${item.statusColor}-500/20 text-${item.statusColor}-400 border border-${item.statusColor}-500/30">
            ${item.status}
          </span>
        </td>
        <td class="py-3 px-3 text-right">
          <button class="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500 hover:text-dark-900 text-cyan-400 border border-slate-700 text-xs mono transition">
            <i class="fa-solid fa-chart-line mr-1"></i> Chart
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Filter button toggle
function filterTable(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    if (btn.getAttribute('data-filter') === filter) {
      btn.className = 'filter-btn px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500 text-dark-900 mono transition';
    } else {
      btn.className = 'filter-btn px-3 py-1.5 rounded-lg text-xs font-medium bg-dark-800 hover:bg-dark-700 text-slate-300 mono transition';
    }
  });
  renderTable();
}

// Load interactive TradingView widget
function loadTradingViewChart(symbol) {
  currentSymbol = symbol;
  const container = document.getElementById('tv_chart_container');
  if (!container) return;

  container.innerHTML = '';

  const widgetScript = document.createElement('script');
  widgetScript.type = 'text/javascript';
  widgetScript.src = 'https://s3.tradingview.com/tv.js';
  widgetScript.async = true;
  widgetScript.onload = () => {
    new TradingView.widget({
      "autosize": true,
      "symbol": symbol,
      "interval": "D",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "toolbar_bg": "#0f172a",
      "enable_publishing": false,
      "allow_symbol_change": true,
      "container_id": "tv_chart_container"
    });
  };

  container.appendChild(widgetScript);

  const badge = document.getElementById('activeChartTickerBadge');
  if (badge) {
    badge.innerText = symbol;
  }
}

function selectTicker(symbol, ticker) {
  loadTradingViewChart(symbol);
  renderTable();
  const chartSection = document.getElementById('chart-section');
  if (chartSection) {
    chartSection.scrollIntoView({ behavior: 'smooth' });
  }
}

// Set today's date in header
function setTimestamp() {
  const el = document.getElementById('lastUpdated');
  if (el) {
    const now = new Date();
    el.innerText = 'Updated ' + now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  setTimestamp();
  renderTable();
  loadTradingViewChart('NASDAQ:NVDA');
});
