document.getElementById('uploadForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const res = await fetch('/upload', { method: 'POST', body: formData });
    const data = await res.json();
    document.getElementById('uploadStatus').innerText = `Uploaded! Parsed ${data.parsed_count} lines.`;
    loadSummary(); // Refresh Quick Insights immediately after upload
    loadLogs();
    loadMetrics();
    loadPieChart();
    loadLineChart();
    loadErrorTrend();
});

async function loadLogs() {
    const level = document.getElementById('levelFilter').value;
    let url = '/logs';
    if (level) url += `?level=${level}`;
    const res = await fetch(url);
    const logs = await res.json();
    const tbody = document.getElementById('logsTable').querySelector('tbody');
    tbody.innerHTML = '';
    logs.forEach(log => {
        const tr = document.createElement('tr');
        // Assign classes for coloring
        let levelClass = '';
        switch (log.level) {
            case 'INFO': levelClass = 'log-info'; break;
            case 'WARNING': levelClass = 'log-warning'; break;
            case 'ERROR': levelClass = 'log-error'; break;
            case 'DEBUG': levelClass = 'log-debug'; break;
        }
        tr.innerHTML = `<td class="timestamp">${log.timestamp}</td><td class="${levelClass}">${log.level}</td><td>${log.message}</td>`;
        tbody.appendChild(tr);
    });
}

document.getElementById('levelFilter').addEventListener('change', loadLogs);
window.onload = function() {
    loadSummary();
    loadLogs();
    loadMetrics();
    loadPieChart();
    loadLineChart();
    loadErrorTrend();
};

// Helper: log level to color
const LOG_LEVEL_COLORS = {
    'INFO': '#4CAF50',
    'WARNING': '#FFC107',
    'ERROR': '#F44336',
    'DEBUG': '#03A9F4'
};

async function loadMetrics() {
    const res = await fetch('/metrics');
    const data = await res.json();
    console.log('Bar chart data:', data);
    const ctx = document.getElementById('metricsChart').getContext('2d');
    if(window.metricsChart && window.metricsChart instanceof Chart) window.metricsChart.destroy();
    const labels = Object.keys(data);
    const values = labels.map(l => data[l]);
    const colors = labels.map(l => LOG_LEVEL_COLORS[l] || '#888');
    window.metricsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Log Count',
                data: values,
                backgroundColor: colors,
                borderColor: '#2196F3',
                borderWidth: 2
            }]
        },
        options: {
            plugins: {
                legend: { labels: { color: '#E0E0E0' } }
            },
            scales: {
                x: { ticks: { color: '#E0E0E0' }, grid: { color: '#333' } },
                y: { ticks: { color: '#E0E0E0' }, grid: { color: '#333' } }
            }
        }
    });
}

async function loadSummary() {
    const res = await fetch('/summary');
    const data = await res.json();
    const metrics = document.getElementById('summaryMetrics');
    metrics.innerHTML = `
        <div><strong>Total Logs:</strong> ${data.total_logs}</div>
        <div><strong>INFO:</strong> ${data.counts.INFO || 0}</div>
        <div><strong>WARNING:</strong> ${data.counts.WARNING || 0}</div>
        <div><strong>ERROR:</strong> ${data.counts.ERROR || 0}</div>
        <div><strong>DEBUG:</strong> ${data.counts.DEBUG || 0}</div>
        <div><strong>Errors (last 5 min):</strong> ${data.errors_last_5min}</div>
        <div><strong>Most Frequent:</strong> ${data.most_frequent_message}</div>
        <div><strong>Busiest Hour:</strong> ${data.busiest_hour !== null ? data.busiest_hour + ':00' : '-'}</div>
    `;
}

async function loadPieChart() {
    const res = await fetch('/chartdata');
    const data = await res.json();
    console.log('Pie chart data:', data.pie);
    const ctx = document.getElementById('pieChart').getContext('2d');
    if(window.pieChart && window.pieChart instanceof Chart) window.pieChart.destroy();
    const labels = Object.keys(data.pie);
    const values = labels.map(l => data.pie[l]);
    const colors = labels.map(l => LOG_LEVEL_COLORS[l] || '#888');
    window.pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors
            }]
        },
        options: {
            plugins: { legend: { labels: { color: '#E0E0E0' } } }
        }
    });
}

async function loadLineChart() {
    const res = await fetch('/chartdata');
    const data = await res.json();
    console.log('Line chart data:', data.logs_by_hour);
    const ctx = document.getElementById('lineChart').getContext('2d');
    if(window.lineChart && window.lineChart instanceof Chart) window.lineChart.destroy();
    const labels = Object.keys(data.logs_by_hour).sort();
    window.lineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Logs per Hour',
                data: labels.map(l => data.logs_by_hour[l]),
                borderColor: '#2196F3',
                backgroundColor: '#2196F3',
                fill: false,
                tension: 0.2
            }]
        },
        options: {
            plugins: { legend: { labels: { color: '#E0E0E0' } } },
            scales: {
                x: { ticks: { color: '#E0E0E0' }, grid: { color: '#333' } },
                y: { ticks: { color: '#E0E0E0' }, grid: { color: '#333' } }
            }
        }
    });
}

async function loadErrorTrend() {
    const res = await fetch('/chartdata');
    const data = await res.json();
    console.log('Error trend data:', data.errors_by_hour);
    const ctx = document.getElementById('errorTrendChart').getContext('2d');
    if(window.errorTrendChart && window.errorTrendChart instanceof Chart) window.errorTrendChart.destroy();
    const labels = Object.keys(data.errors_by_hour).sort();
    window.errorTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Errors per Hour',
                data: labels.map(l => data.errors_by_hour[l]),
                borderColor: '#FF5722',
                backgroundColor: '#FF5722',
                fill: false,
                tension: 0.2
            }]
        },
        options: {
            plugins: { legend: { labels: { color: '#E0E0E0' } } },
            scales: {
                x: { ticks: { color: '#E0E0E0' }, grid: { color: '#333' } },
                y: { ticks: { color: '#E0E0E0' }, grid: { color: '#333' } }
            }
        }
    });
}
