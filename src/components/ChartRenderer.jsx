/**
 * Chart Renderer
 * Renders different chart types based on section configuration.
 * Matches the visual style of report.html.
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

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend
);

// ─── colour palette (matches report.html) ─────────────────────────────────────
const CHART_COLORS = [
  'rgba(79, 172, 254, 0.7)',
  'rgba(66, 230, 149, 0.7)',
  'rgba(255, 107, 107, 0.7)',
  'rgba(254, 202, 87, 0.7)',
  'rgba(153, 102, 255, 0.7)',
  'rgba(255, 159, 64, 0.7)',
  'rgba(75, 192, 192, 0.7)',
  'rgba(255, 99, 132, 0.7)',
];
const CHART_BORDERS = CHART_COLORS.map(c => c.replace('0.7', '1'));

const TAG_LABELS = {
  NOT_RELEVANT: 'Not Relevant',
  RELEVANT: 'Relevant',
  PARTIALLY_RELEVANT: 'Partially Relevant',
};

function geoColor(pct) {
  if (pct === null || pct === undefined) return '#e0e0e0';
  if (pct >= 60) return '#42e695';
  if (pct >= 40) return '#feca57';
  return '#ff6b6b';
}

export default function ChartRenderer({ section }) {
  if (!section || !section.data) {
    return (
      <div style={{ padding: 24, textAlign: 'center', background: '#f5f5f5', borderRadius: 8, color: '#999' }}>
        No data available
      </div>
    );
  }

  const { section_type, data, title, description } = section;

  if (data.error) {
    return (
      <div style={{ padding: 16, background: '#fee', borderRadius: 8, color: '#c00' }}>
        <strong>Error loading data:</strong> {data.error}
      </div>
    );
  }

  // ─── shared chart data builder ────────────────────────────────────────────
  const buildChartData = () => {
    if (data.datasets && Array.isArray(data.datasets)) {
      return {
        labels: data.labels || [],
        datasets: data.datasets.map((ds, i) => ({
          label: ds.label,
          data: ds.data,
          backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
          borderColor: CHART_BORDERS[i % CHART_BORDERS.length],
          borderWidth: 2,
          tension: 0.3,
          fill: false,
        })),
      };
    }
    const labels = (data.labels || []).map(l => TAG_LABELS[l] || l);
    return {
      labels,
      datasets: [{
        label: title,
        data: data.values || [],
        backgroundColor: section_type === 'pie_chart' ? CHART_COLORS : CHART_COLORS[0],
        borderColor: section_type === 'pie_chart' ? CHART_BORDERS : CHART_BORDERS[0],
        borderWidth: 2,
        tension: 0.3,
      }],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: section_type === 'pie_chart' || (data.datasets && data.datasets.length > 1),
        position: section_type === 'pie_chart' ? 'right' : 'top',
      },
      title: { display: false },
      tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', titleColor: '#fff', bodyColor: '#fff', padding: 12, cornerRadius: 4 },
    },
    scales: section_type !== 'pie_chart' ? {
      y: { beginAtZero: true, ticks: { precision: 0 } },
      x: section_type === 'bar_chart' ? { ticks: { maxRotation: 45, minRotation: 0, font: { size: 11 } } } : {},
    } : undefined,
  };

  // ─── METRIC (matches report.html .card / .big-number / .metric-label) ───────
  if (section_type === 'metric') {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
          borderRadius: 15,
          padding: 25,
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          transition: 'all 0.3s ease',
          cursor: 'default',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
        }}
      >
        <div style={{ fontSize: '0.9em', color: '#718096', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 5 }}>
          {title}
        </div>
        <div style={{ fontSize: '2.2em', fontWeight: 700, color: '#2d3748', marginBottom: 10 }}>
          {(data.value ?? 0).toLocaleString()}
        </div>
        {description && (
          <div style={{ color: '#718096', fontSize: '0.85em' }}>{description}</div>
        )}
      </div>
    );
  }

  // ─── BAR CHART ────────────────────────────────────────────────────────────
  if (section_type === 'bar_chart') {
    const isLong = (data.labels || []).length > 8;
    return (
      <div style={{ padding: '8px 0' }}>
        <Bar
          data={buildChartData()}
          options={{ ...chartOptions, indexAxis: isLong ? 'y' : 'x' }}
          height={isLong ? 120 : 80}
        />
      </div>
    );
  }

  // ─── PIE CHART ────────────────────────────────────────────────────────────
  if (section_type === 'pie_chart') {
    return (
      <div style={{ padding: '8px 0', maxWidth: 460, margin: '0 auto' }}>
        <Pie data={buildChartData()} options={chartOptions} />
      </div>
    );
  }

  // ─── LINE CHART ───────────────────────────────────────────────────────────
  if (section_type === 'line_chart') {
    return (
      <div style={{ padding: '8px 0' }}>
        <Line data={buildChartData()} options={chartOptions} height={80} />
      </div>
    );
  }

  // ─── TABLE (multi-column aware) ───────────────────────────────────────────
  if (section_type === 'table') {
    const TH = ({ children, align = 'left' }) => (
      <th style={{
        background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white',
        padding: '13px 14px', fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '0.5px', fontSize: 11, textAlign: align, whiteSpace: 'nowrap',
      }}>
        {children}
      </th>
    );
    const TD = ({ children, align = 'left', style = {} }) => (
      <td style={{ padding: '11px 14px', borderBottom: '1px solid #e2e8f0', textAlign: align, ...style }}>
        {children}
      </td>
    );

    // New multi-column format: { columns, rows }
    if (data.columns && data.rows) {
      const cols = data.columns;
      return (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, background: 'white', borderRadius: 15, overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}>
            <thead>
              <tr>
                {cols.map(col => (
                  <TH key={col} align={col === 'label' ? 'left' : 'center'}>
                    {col === 'label' ? 'District' :
                     col === 'relevance_pct' ? 'Relevance %' :
                     col.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </TH>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, i) => {
                const pct = row['relevance_pct'];
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f8fafc' }}>
                    {cols.map(col => {
                      const val = row[col];
                      if (col === 'relevance_pct' && val !== undefined) {
                        const color = pct >= 60 ? '#22c55e' : pct >= 40 ? '#eab308' : '#ef4444';
                        return (
                          <TD key={col} align="center">
                            <span style={{ background: color, color: 'white', padding: '3px 10px', borderRadius: 20, fontWeight: 600, fontSize: 12 }}>
                              {val}%
                            </span>
                          </TD>
                        );
                      }
                      return (
                        <TD key={col} align={col === 'label' ? 'left' : 'center'}
                          style={{ fontWeight: col === 'label' ? 500 : 400 }}>
                          {typeof val === 'number' ? val.toLocaleString() : (val ?? '—')}
                        </TD>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    // Legacy 2-col: { dataset: [{label, value}] }
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, background: 'white', borderRadius: 15, overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}>
          <thead>
            <tr><TH>Label</TH><TH align="right">Value</TH></tr>
          </thead>
          <tbody>
            {(data.dataset || []).map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#f8fafc' }}>
                <TD>{row.label}</TD>
                <TD align="right" style={{ fontWeight: 500 }}>
                  {typeof row.value === 'number' ? row.value.toLocaleString() : row.value}
                </TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ─── GEO MAP (district relevance heatmap cards) ────────────────────────────
  if (section_type === 'geo_map') {
    const labels = data.labels || [];
    const values = data.values || [];
    const entries = labels.map((l, i) => ({ label: l, value: values[i] ?? null }));

    return (
      <div>
        {/* Legend */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 20, flexWrap: 'wrap', fontSize: 13 }}>
          {[['#42e695', '≥60% Relevant'], ['#feca57', '40–60% Relevant'], ['#ff6b6b', '<40% Relevant'], ['#e0e0e0', 'No Data']].map(([bg, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 18, height: 18, background: bg, borderRadius: 4, border: '1px solid rgba(0,0,0,0.1)' }} />
              <span style={{ color: '#4a5568', fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* District cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 12 }}>
          {entries.map(({ label, value }) => {
            const bg = geoColor(value);
            const isDark = value !== null && value < 40;
            const textColor = isDark ? '#fff' : '#2d3748';
            return (
              <div key={label} style={{
                background: bg, borderRadius: 12, padding: '18px 12px',
                textAlign: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                cursor: 'default', transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.1)'; }}
              >
                <div style={{ fontSize: 26, fontWeight: 700, color: textColor }}>
                  {value !== null ? `${value}%` : '—'}
                </div>
                <div style={{ fontSize: 11, color: textColor, marginTop: 5, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── RELEVANCE DISTRIBUTION (matches report.html card with 3-line text) ─────
  if (section_type === 'relevance_distribution') {
    return (
      <div
        style={{
          background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
          borderRadius: 15,
          padding: 25,
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          transition: 'all 0.3s ease',
          cursor: 'default',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
        }}
      >
        <div style={{ fontSize: '0.9em', color: '#718096', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>
          Relevance Distribution
        </div>
        <div style={{ fontSize: '1.2em', lineHeight: 1.8 }}>
          <div><strong style={{ color: '#22c55e', fontSize: '1.15em' }}>{data.relevant || 0}%</strong>&nbsp; Relevant</div>
          <div><strong style={{ color: '#eab308', fontSize: '1.15em' }}>{data.partially_relevant || 0}%</strong>&nbsp; Partially Relevant</div>
          <div><strong style={{ color: '#ef4444', fontSize: '1.15em' }}>{data.irrelevant || 0}%</strong>&nbsp; Irrelevant</div>
        </div>
        {data.total != null && (
          <div style={{ marginTop: 10, color: '#718096', fontSize: '0.85em' }}>
            {data.total.toLocaleString()} validations total
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: 16, color: '#999', fontStyle: 'italic' }}>
      Unsupported section type: {section_type}
    </div>
  );
}

