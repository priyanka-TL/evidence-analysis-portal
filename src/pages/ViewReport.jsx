/**
 * View Report — styled to match report.html
 * Gradient background · filter bar · card metrics · chart containers · download
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReportWithData, getFilterOptions } from '../api/reports';
import ChartRenderer from '../components/ChartRenderer';

/* ─── colour palette matching report.html ──────────────────────────────────── */
const GROUP_META = {
  'Executive Summary':                { icon: '📊', color: '#4facfe' },
  'Evidence Submission Overview':     { icon: '📈', color: '#42e695' },
  'Quality & Relevance Analysis':     { icon: '🎯', color: '#f97316' },
  'District-wise Submission Quality': { icon: '🗺️', color: '#a855f7' },
};

/* Helper: which sections should display as inline metric cards in a grid */
const isMetric = s => s.section_type === 'metric';

export default function ViewReport() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [filterOptions, setFilterOptions] = useState({ states: [], districts: [], blocks: [], schools: [], relevance_tags: [] });
  const [stateVal, setStateVal]     = useState('');
  const [district, setDistrict]     = useState('');
  const [block, setBlock]           = useState('');
  const [school, setSchool]         = useState('');
  const [relevance, setRelevance]   = useState('');
  const [activeFilters, setActiveFilters] = useState({});

  /* ── load filter options once ─────────────────────────────────────────── */
  useEffect(() => {
    getFilterOptions(id)
      .then(r => setFilterOptions(r.data || { states: [], districts: [], blocks: [], schools: [], relevance_tags: [] }))
      .catch(() => {});
  }, [id]);

  /* ── load report (re-run when applied filters change) ────────────────── */
  const loadReport = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filters.state)     params.state     = filters.state;
      if (filters.district)  params.district  = filters.district;
      if (filters.block)     params.block     = filters.block;
      if (filters.school)    params.school    = filters.school;
      if (filters.relevance) params.relevance = filters.relevance;
      const res = await getReportWithData(id, params);
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadReport({}); }, [loadReport]);

  /* ── filter actions ───────────────────────────────────────────────────── */
  const applyFilters = () => {
    const f = {};
    if (district) f.district = district;
    if (block)    f.block    = block;
    setActiveFilters(f);
    loadReport(f);
  };

  const resetFilters = () => {
    setDistrict('');
    setBlock('');
    setActiveFilters({});
    loadReport({});
  };

  const removeFilter = (key) => {
    const f = { ...activeFilters };
    delete f[key];
    if (key === 'district') setDistrict('');
    if (key === 'block')    setBlock('');
    setActiveFilters(f);
    loadReport(f);
  };

  /* ── download PDF (print-based) ──────────────────────────────────────── */
  const downloadPDF = () => window.print();

  /* ─────────────────────────────── render ─────────────────────────────── */
  if (loading) return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={{ ...styles.header }}>
          <h1 style={styles.headerTitle}>MIP Evidence Analysis Dashboard</h1>
        </div>
        <div style={{ padding: 60, textAlign: 'center' }}>
          <div style={styles.spinner} />
          <p style={{ color: '#718096', marginTop: 16 }}>Loading report data…</p>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>MIP Evidence Analysis Dashboard</h1>
        </div>
        <div style={{ padding: 40 }}>
          <div style={{ padding: 16, background: '#fee', border: '1px solid #fcc', borderRadius: 8, color: '#c00', marginBottom: 16 }}>
            Error: {error}
          </div>
          <button onClick={() => navigate('/reports')} style={styles.btnOutline}>← Back to Reports</button>
        </div>
      </div>
    </div>
  );

  if (!report) return null;

  /* ── group sections by section_group (preserve order) ─────────────────── */
  const groups = [];
  const groupMap = new Map();
  (report.sections || []).forEach(s => {
    const g = s.section_group || 'Other';
    if (!groupMap.has(g)) { groupMap.set(g, []); groups.push(g); }
    groupMap.get(g).push(s);
  });

  const customSections = (report.sections || []).filter(s => !s.is_default);

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>MIP Evidence Analysis Dashboard</h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: 15, marginBottom: 20 }}>{report.name}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/reports')} style={styles.btnGlass}>← Back</button>
            <button onClick={downloadPDF} style={styles.btnDownload}>📄 Download PDF</button>
            <button onClick={() => loadReport(activeFilters)} style={styles.btnGlass}>🔄 Refresh</button>
          </div>
        </div>

        {/* ── FILTER SECTION ─────────────────────────────────────────────── */}
        <div style={styles.filterSection}>
          <h3 style={styles.filterTitle}>🔍 Filter Data</h3>
          <div style={styles.filterGrid}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>State</label>
              <select value={stateVal} onChange={e => setStateVal(e.target.value)} style={styles.filterSelect}>
                <option value="">All States</option>
                {filterOptions.states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>District</label>
              <select value={district} onChange={e => setDistrict(e.target.value)} style={styles.filterSelect}>
                <option value="">All Districts</option>
                {filterOptions.districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Block</label>
              <select value={block} onChange={e => setBlock(e.target.value)} style={styles.filterSelect}>
                <option value="">All Blocks</option>
                {filterOptions.blocks.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>School</label>
              <select value={school} onChange={e => setSchool(e.target.value)} style={styles.filterSelect}>
                <option value="">All Schools</option>
                {filterOptions.schools.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Relevance Tag</label>
              <select value={relevance} onChange={e => setRelevance(e.target.value)} style={styles.filterSelect}>
                <option value="">All Relevance</option>
                {(filterOptions.relevance_tags || []).map(r => (
                  <option key={r} value={r}>
                    {r === 'RELEVANT' ? 'Relevant' : r === 'NOT_RELEVANT' ? 'Not Relevant' : r === 'PARTIALLY_RELEVANT' ? 'Partially Relevant' : r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 12 }}>
            <button onClick={applyFilters} style={styles.btnApply}>✅ Apply Filters</button>
            <button onClick={resetFilters} style={styles.btnReset}>🔄 Reset</button>
          </div>

          {/* Active filter tags */}
          {Object.keys(activeFilters).length > 0 && (
            <div style={{ marginTop: 14, background: '#fff', borderRadius: 8, padding: '10px 14px' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#2d3748', marginRight: 8 }}>Active Filters:</span>
              <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(activeFilters).map(([k, v]) => (
                  <span key={k} style={styles.filterTag}>
                    {k}: {v}
                    <span onClick={() => removeFilter(k)} style={{ cursor: 'pointer', marginLeft: 6, fontWeight: 700, opacity: 0.8 }}>×</span>
                  </span>
                ))}
              </span>
            </div>
          )}
        </div>

        {/* ── REPORT CONTENT ─────────────────────────────────────────────── */}
        <div style={styles.content} id="report-content">

          {/* Default sections grouped */}
          {groups.filter(g => groupMap.get(g).some(s => s.is_default)).map(group => {
            const sections = groupMap.get(group).filter(s => s.is_default);
            const meta = GROUP_META[group] || { icon: '📋', color: '#4a5568' };

            const metrics = sections.filter(isMetric);
            const charts  = sections.filter(s => !isMetric(s));

            return (
              <div key={group} style={styles.reportSection} className="section-to-break">
                <h2 style={{ ...styles.sectionTitle, borderLeftColor: meta.color }}>
                  {meta.icon} {group}
                </h2>

                {/* Metrics in grid */}
                {metrics.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(auto-fit, minmax(${metrics.length > 3 ? '180px' : '240px'}, 1fr))`,
                    gap: 20,
                    marginBottom: 24,
                  }}>
                    {metrics.map(s => (
                      <div key={s.id} style={{ cursor: 'default' }}
                        onMouseEnter={e => e.currentTarget.firstChild && (e.currentTarget.firstChild.style.transform = 'translateY(-5px)')}
                        onMouseLeave={e => e.currentTarget.firstChild && (e.currentTarget.firstChild.style.transform = '')}
                      >
                        <ChartRenderer section={s} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Charts / tables */}
                {charts.map(s => (
                  <div key={s.id} style={styles.chartContainer}>
                    <div style={styles.chartTitle}>{s.title}</div>
                    {s.description && (
                      <p style={styles.chartDesc}>{s.description}</p>
                    )}
                    <ChartRenderer section={s} />
                  </div>
                ))}
              </div>
            );
          })}

          {/* Custom sections */}
          {customSections.length > 0 && (
            <div style={styles.reportSection}>
              <h2 style={{ ...styles.sectionTitle, borderLeftColor: '#6366f1' }}>
                ✏️ Custom Sections
              </h2>
              {customSections.map(s => (
                <div key={s.id} style={styles.chartContainer}>
                  <div style={styles.chartTitle}>{s.title}</div>
                  {s.description && <p style={styles.chartDesc}>{s.description}</p>}
                  {s.ai_prompt && s.ai_prompt !== '[DEFAULT TEMPLATE]' && (
                    <div style={styles.aiPromptBadge}>💬 AI Generated: "{s.ai_prompt}"</div>
                  )}
                  <ChartRenderer section={s} />
                </div>
              ))}
            </div>
          )}

          {(!report.sections || report.sections.length === 0) && (
            <div style={{ textAlign: 'center', padding: 64, color: '#718096' }}>
              <p style={{ fontSize: 18, marginBottom: 16 }}>This report has no sections yet.</p>
              <button onClick={() => navigate('/reports/generate')} style={styles.btnApply}>+ Generate Report</button>
            </div>
          )}
        </div>
      </div>

      {/* ── PRINT STYLES injected inline ─────────────────────────────────── */}
      <style>{`
        @media print {
          body { background: white !important; }
          button, .no-print { display: none !important; }
          #filter-section { display: none !important; }
          .section-to-break { page-break-after: always; }
          tr { page-break-inside: avoid; }
        }
        @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

/* ─── inline styles (matching report.html) ───────────────────────────────── */
const styles = {
  page: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    minHeight: '100vh',
    padding: 20,
    color: '#333',
  },
  container: {
    maxWidth: 1400,
    margin: '0 auto',
    background: 'rgba(255,255,255,0.97)',
    borderRadius: 20,
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
    overflow: 'hidden',
  },
  header: {
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    padding: '30px 30px 28px',
    textAlign: 'center',
    color: 'white',
  },
  headerTitle: {
    fontSize: '2em',
    marginBottom: 6,
    fontWeight: 300,
    letterSpacing: 2,
    margin: '0 0 6px',
  },
  filterSection: {
    background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
    padding: 24,
    borderBottom: '2px solid #dee2e6',
  },
  filterTitle: {
    fontSize: '1.2em',
    color: '#2d3748',
    marginBottom: 16,
    fontWeight: 600,
    textAlign: 'center',
    margin: '0 0 16px',
  },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 14,
    marginBottom: 8,
  },
  filterGroup: { display: 'flex', flexDirection: 'column' },
  filterLabel: { fontWeight: 600, color: '#4a5568', marginBottom: 6, fontSize: '0.85em', textTransform: 'uppercase', letterSpacing: '0.5px' },
  filterSelect: {
    padding: '10px 14px', border: '2px solid #cbd5e0', borderRadius: 8,
    fontSize: '1em', background: 'white', cursor: 'pointer', outline: 'none',
  },
  filterTag: {
    background: 'linear-gradient(45deg, #4facfe, #00f2fe)', color: 'white',
    padding: '4px 12px', borderRadius: 20, fontSize: '0.85em',
    display: 'inline-flex', alignItems: 'center',
  },
  content: { padding: 30 },
  reportSection: { marginBottom: 40 },
  sectionTitle: {
    fontSize: '1.6em',
    marginBottom: 24,
    color: '#4a5568',
    borderLeft: '5px solid #4facfe',
    paddingLeft: 20,
    fontWeight: 600,
    marginTop: 10,
  },
  chartContainer: {
    background: 'white',
    borderRadius: 15,
    padding: 24,
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
    marginBottom: 24,
    border: '1px solid rgba(0,0,0,0.04)',
  },
  chartTitle: { fontSize: '1.15em', color: '#4a5568', marginBottom: 6, textAlign: 'center', fontWeight: 600 },
  chartDesc: { fontSize: 13, color: '#718096', textAlign: 'center', margin: '0 0 16px' },
  aiPromptBadge: {
    fontSize: 12, color: '#94a3b8', padding: '5px 10px',
    background: '#f8fafc', borderRadius: 6, borderLeft: '3px solid #2563eb',
    marginBottom: 14, display: 'inline-block',
  },
  spinner: {
    border: '4px solid #f3f3f3', borderTop: '4px solid #4facfe',
    borderRadius: '50%', width: 40, height: 40,
    animation: 'spin 1s linear infinite', margin: '0 auto',
  },
  btnGlass: {
    padding: '10px 22px', border: '2px solid rgba(255,255,255,0.4)',
    borderRadius: 50, cursor: 'pointer', fontWeight: 600, color: 'white',
    background: 'rgba(255,255,255,0.18)', letterSpacing: '0.5px', fontSize: 14,
  },
  btnDownload: {
    padding: '10px 22px', border: 'none', borderRadius: 50, cursor: 'pointer',
    fontWeight: 600, letterSpacing: '0.5px', fontSize: 14,
    background: 'linear-gradient(45deg, #f093fb, #f5576c)', color: 'white',
  },
  btnApply: {
    padding: '10px 22px', border: 'none', borderRadius: 50, cursor: 'pointer',
    fontWeight: 600, letterSpacing: '0.5px', fontSize: 14,
    background: 'linear-gradient(45deg, #42e695, #3bb2b8)', color: 'white',
  },
  btnReset: {
    padding: '10px 22px', border: 'none', borderRadius: 50, cursor: 'pointer',
    fontWeight: 600, letterSpacing: '0.5px', fontSize: 14,
    background: 'linear-gradient(45deg, #ff6b6b, #ee5a6f)', color: 'white',
  },
  btnOutline: {
    padding: '10px 20px', background: 'white', color: '#4facfe',
    border: '2px solid #4facfe', borderRadius: 8, cursor: 'pointer', fontSize: 14,
  },
};

