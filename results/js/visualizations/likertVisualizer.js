/**
 * likertVisualizer.js
 * Visualization component for Likert scale questions
 */

import { aggregateMatrixResponses } from '../resultsDataService.js';

/**
 * Create a visualization for Likert scale question responses
 * @param {HTMLElement} container - The DOM element to render the chart in
 * @param {Array} responses - Array of question responses
 * @param {Object} question - The question definition
 * @param {string} [type='heatmap'] - Type of visualization ('heatmap', 'stackedBar')
 */
export function createLikertVisualization(container, responses, question, type = 'heatmap') {
    if (!container || !Array.isArray(responses) || responses.length === 0) {
        container.innerHTML = '<p class="no-data">No data available for this question.</p>';
        return;
    }

    const aggregatedData = aggregateMatrixResponses(responses, question);

    if (aggregatedData.totalResponses === 0) {
        container.innerHTML = '<p class="no-data">No responses for this question yet.</p>';
        return;
    }

    switch (type) {
        case 'heatmap':
            renderHeatmap(container, aggregatedData, question);
            break;
        case 'stackedBar':
            renderStackedBarChart(container, aggregatedData, question);
            break;
        default:
            renderHeatmap(container, aggregatedData, question);
    }
}

/**
 * Render a heatmap for Likert responses
 * @param {HTMLElement} container
 * @param {Object} data
 * @param {Object} question
 */
function renderHeatmap(container, data, question) {
    container.innerHTML = '';
    const heatmapContainer = document.createElement('div');
    heatmapContainer.className = 'heatmap-container';

    const table = document.createElement('table');
    table.className = 'heatmap-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const cornerCell = document.createElement('th');
    cornerCell.className = 'heatmap-corner';
    headerRow.appendChild(cornerCell);

    data.columns.forEach(column => {
        const th = document.createElement('th');
        th.className = 'heatmap-column-header';
        th.textContent = column.label;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    data.rows.forEach(row => {
        const tr = document.createElement('tr');
        const rowHeader = document.createElement('th');
        rowHeader.className = 'heatmap-row-header';
        rowHeader.textContent = row.label;
        tr.appendChild(rowHeader);

        data.columns.forEach(column => {
            const td = document.createElement('td');
            td.className = 'heatmap-cell';
            const count = data.counts[row.id][column.id] || 0;
            const percentage = data.percentages[row.id][column.id] || 0;
            const intensity = Math.min(0.9, percentage / 100 + 0.1);
            td.style.backgroundColor = `rgba(74, 134, 232, ${intensity})`;
            td.title = `${row.label} - ${column.label}: ${count} (${percentage}%)`;
            td.innerHTML = `<span class="cell-value">${count}</span><span class="cell-percentage">${percentage}%</span>`;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    heatmapContainer.appendChild(table);
    container.appendChild(heatmapContainer);
}

/**
 * Render a stacked bar chart for Likert responses
 * @param {HTMLElement} container
 * @param {Object} data
 * @param {Object} question
 */
function renderStackedBarChart(container, data, question) {
    const canvas = document.createElement('canvas');
    canvas.id = `chart-${question.id}`;
    canvas.width = 600;
    canvas.height = Math.max(400, data.rows.length * 50);
    container.innerHTML = '';
    container.appendChild(canvas);

    const colors = ['#d5573b', '#e69138', '#f1c232', '#6aa84f', '#4a86e8'];

    const datasets = data.columns.map((column, index) => {
        return {
            label: column.label,
            data: data.rows.map(row => data.percentages[row.id][column.id] || 0),
            backgroundColor: colors[index % colors.length],
            borderWidth: 1
        };
    });

    const config = {
        type: 'bar',
        data: {
            labels: data.rows.map(row => row.label),
            datasets: datasets
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    max: 100,
                    ticks: {
                        callback: value => value + '%'
                    }
                },
                y: {
                    stacked: true
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.dataset.label || '';
                            const value = context.raw || 0;
                            return `${label}: ${value.toFixed(1)}%`;
                        }
                    }
                }
            }
        }
    };

    new Chart(canvas, config);
}
