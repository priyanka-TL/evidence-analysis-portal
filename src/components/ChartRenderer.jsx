/**
 * Chart Renderer
 * Renders different chart types based on section configuration
 */
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function ChartRenderer({ section }) {
  if (!section || !section.data) {
    return (
      <div style={{ 
        padding: 24, 
        textAlign: 'center', 
        backgroundColor: '#f5f5f5', 
        borderRadius: 4,
        color: '#999'
      }}>
        No data available
      </div>
    );
  }

  const { section_type, data, title, description } = section;

  // Check for errors
  if (data.error) {
    return (
      <div style={{ 
        padding: 16, 
        backgroundColor: '#fee', 
        borderRadius: 4,
        color: '#c00'
      }}>
        <strong>Error loading data:</strong> {data.error}
      </div>
    );
  }

  // Prepare chart data
  let chartData;
  
  // Check if this is a multi-series comparison (datasets array from backend)
  if (data.datasets && Array.isArray(data.datasets)) {
    const colors = [
      'rgba(54, 162, 235, 0.7)',   // Blue
      'rgba(255, 99, 132, 0.7)',   // Red
      'rgba(75, 192, 192, 0.7)',   // Teal
      'rgba(255, 206, 86, 0.7)',   // Yellow
      'rgba(153, 102, 255, 0.7)',  // Purple
      'rgba(255, 159, 64, 0.7)',   // Orange
    ];
    
    chartData = {
      labels: data.labels || [],
      datasets: data.datasets.map((dataset, idx) => ({
        label: dataset.label,
        data: dataset.data,
        backgroundColor: colors[idx % colors.length],
        borderColor: colors[idx % colors.length].replace('0.7', '1'),
        borderWidth: 2
      }))
    };
  } else {
    // Single series chart
    chartData = {
      labels: data.labels || [],
      datasets: [{
        label: title,
        data: data.values || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
          'rgba(199, 199, 199, 0.7)',
          'rgba(83, 102, 255, 0.7)',
          'rgba(255, 99, 255, 0.7)',
          'rgba(99, 255, 132, 0.7)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
          'rgba(83, 102, 255, 1)',
          'rgba(255, 99, 255, 1)',
          'rgba(99, 255, 132, 1)'
        ],
        borderWidth: 2
      }]
    };
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { 
        display: section_type === 'pie_chart' || (data.datasets && data.datasets.length > 1),
        position: section_type === 'pie_chart' ? 'right' : 'top'
      },
      title: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 4
      }
    },
    scales: section_type !== 'pie_chart' ? {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    } : undefined
  };

  // Render based on section type
  if (section_type === 'bar_chart') {
    return (
      <div style={{ padding: '16px 0' }}>
        <Bar data={chartData} options={options} height={80} />
      </div>
    );
  }

  if (section_type === 'pie_chart') {
    return (
      <div style={{ padding: '16px 0', maxWidth: 500, margin: '0 auto' }}>
        <Pie data={chartData} options={options} />
      </div>
    );
  }

  if (section_type === 'line_chart') {
    return (
      <div style={{ padding: '16px 0' }}>
        <Line data={chartData} options={options} height={80} />
      </div>
    );
  }

  if (section_type === 'metric') {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: 32, 
        backgroundColor: '#f0f7ff', 
        borderRadius: 8,
        border: '2px solid #0066cc'
      }}>
        <div style={{ 
          fontSize: 56, 
          fontWeight: 'bold', 
          color: '#0066cc',
          marginBottom: 8 
        }}>
          {data.value?.toLocaleString() || 0}
        </div>
        {description && (
          <div style={{ fontSize: 14, color: '#666' }}>
            {description}
          </div>
        )}
      </div>
    );
  }

  if (section_type === 'table') {
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: 14
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ 
                border: '1px solid #ddd', 
                padding: 12, 
                textAlign: 'left',
                fontWeight: 600 
              }}>
                Label
              </th>
              <th style={{ 
                border: '1px solid #ddd', 
                padding: 12, 
                textAlign: 'right',
                fontWeight: 600 
              }}>
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            {(data.dataset || []).map((row, i) => (
              <tr key={i} style={{ 
                backgroundColor: i % 2 === 0 ? 'white' : '#fafafa' 
              }}>
                <td style={{ 
                  border: '1px solid #ddd', 
                  padding: 12 
                }}>
                  {row.label}
                </td>
                <td style={{ 
                  border: '1px solid #ddd', 
                  padding: 12,
                  textAlign: 'right',
                  fontWeight: 500
                }}>
                  {typeof row.value === 'number' ? row.value.toFixed(2) : row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (section_type === 'relevance_distribution') {
    return (
      <div style={{ 
        padding: 32, 
        backgroundColor: '#ffffff', 
        borderRadius: 8,
        border: '1px solid #e0e0e0'
      }}>
        <div style={{ 
          fontSize: 14, 
          fontWeight: 600, 
          color: '#666',
          marginBottom: 20,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          RELEVANCE DISTRIBUTION
        </div>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 12 
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#2e7d32' }}>
            <span style={{ fontSize: 28 }}>{data.relevant || 0}%</span> Relevant
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#f57c00' }}>
            <span style={{ fontSize: 28 }}>{data.partially_relevant || 0}%</span> Partially
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#c62828' }}>
            <span style={{ fontSize: 28 }}>{data.irrelevant || 0}%</span> Irrelevant
          </div>
        </div>
      </div>
    );
  }

  return <div>Unknown section type: {section_type}</div>;
}
