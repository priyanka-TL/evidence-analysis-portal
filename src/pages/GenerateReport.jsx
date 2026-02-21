/**
 * Report Builder
 * =============
 * Layout:
 *   1. Setup step  – choose program, name the report, preview the default template
 *   2. Builder step – locked default sections (top) + user-created custom sections (bottom)
 *
 * Default sections mirror report.html structure up to the Geo Map and are
 * seeded automatically by the backend on report creation.
 * Custom sections are added via AI or blank card and support drag-drop reorder.
 */
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  createReport,
  generateSectionWithAI,
  reorderSections,
  getReportWithData,
  deleteSection,
  listPrograms,
  getDefaultTemplate,
} from '../api/reports';
import ChartRenderer from '../components/ChartRenderer';
import AIChatInterface from '../components/AIChatInterface';
import { useParams, useNavigate } from 'react-router-dom';

// ─── palette helpers ────────────────────────────────────────────────────────
const GROUP_COLORS = {
  'Executive Summary':                { bg: '#eff6ff', border: '#3b82f6', badge: '#2563eb' },
  'Evidence Submission Overview':     { bg: '#f0fdf4', border: '#22c55e', badge: '#16a34a' },
  'Quality & Relevance Analysis':     { bg: '#fff7ed', border: '#f97316', badge: '#ea580c' },
  'District-wise Submission Quality': { bg: '#fdf4ff', border: '#a855f7', badge: '#9333ea' },
};
const DEFAULT_GROUP_COLOR = { bg: '#f8fafc', border: '#94a3b8', badge: '#64748b' };

const SECTION_TYPE_ICON = {
  metric:       '🔢',
  pie_chart:    '🥧',
  bar_chart:    '📊',
  line_chart:   '📈',
  table:        '📋',
  geo_map:      '🗺️',
};

function sectionIcon(type) { return SECTION_TYPE_ICON[type] || '📄'; }

function GroupBadge({ group }) {
  const c = GROUP_COLORS[group] || DEFAULT_GROUP_COLOR;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600,
      background: c.bg, color: c.badge,
      border: `1px solid ${c.border}`,
      borderRadius: 20, padding: '2px 10px',
    }}>
      {group}
    </span>
  );
}

// ─── Default Template Preview (shown BEFORE report is created) ───────────────
function DefaultTemplatePreview({ sections }) {
  const groups = [];
  const seen = new Map();
  sections.forEach(s => {
    const g = s.section_group || 'Other';
    if (!seen.has(g)) { seen.set(g, []); groups.push(g); }
    seen.get(g).push(s);
  });

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{
          background: '#f0fdf4', border: '1px solid #22c55e',
          borderRadius: 8, padding: '8px 14px',
          fontSize: 13, color: '#15803d', fontWeight: 500,
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          🔒 These <strong>{sections.length} sections</strong> are the standard default template —
          automatically included in every report.
        </div>
      </div>

      {groups.map(group => {
        const items = seen.get(group);
        const c = GROUP_COLORS[group] || DEFAULT_GROUP_COLOR;
        return (
          <div key={group} style={{
            marginBottom: 12, border: `1px solid ${c.border}`,
            borderRadius: 10, overflow: 'hidden',
          }}>
            <div style={{
              background: c.bg, borderBottom: `1px solid ${c.border}`,
              padding: '10px 16px', fontWeight: 700, color: c.badge, fontSize: 14,
            }}>
              {group}
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {items.map((s, i) => (
                <div key={i} style={{
                  border: `1px solid ${c.border}`, borderRadius: 8,
                  padding: '7px 13px', fontSize: 13, background: 'white',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span>{sectionIcon(s.section_type)}</span>
                  <span style={{ fontWeight: 500 }}>{s.title}</span>
                  <span style={{ color: '#94a3b8', fontSize: 11 }}>
                    ({s.section_type.replace(/_/g, ' ')})
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Locked Default Section Card ──────────────────────────────────────────────
function DefaultSectionCard({ section }) {
  const [expanded, setExpanded] = useState(false);
  const group = section.section_group || 'Other';
  const c = GROUP_COLORS[group] || DEFAULT_GROUP_COLOR;

  return (
    <div style={{
      border: `1.5px solid ${c.border}`, borderRadius: 10,
      marginBottom: 8, background: 'white', overflow: 'hidden',
    }}>
      <div
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: c.bg, borderBottom: expanded ? `1px solid ${c.border}` : 'none',
          padding: '10px 16px', cursor: 'pointer', userSelect: 'none',
        }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>{sectionIcon(section.section_type)}</span>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{section.title}</span>
          <GroupBadge group={group} />
          <span style={{
            fontSize: 11, color: '#64748b', background: '#f1f5f9',
            borderRadius: 4, padding: '2px 7px',
          }}>
            {section.section_type.replace(/_/g, ' ')}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11, color: '#15803d', background: '#f0fdf4',
            border: '1px solid #86efac', borderRadius: 20, padding: '2px 10px',
          }}>
            🔒 Default
          </span>
          <span style={{ color: '#94a3b8', fontSize: 16 }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: 16 }}>
          {section.description && (
            <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: 13 }}>{section.description}</p>
          )}
          {section.data ? (
            <ChartRenderer section={section} />
          ) : (
            <div style={{
              padding: 24, textAlign: 'center', background: '#f8fafc',
              borderRadius: 8, color: '#94a3b8', fontSize: 13, border: '1px dashed #cbd5e1',
            }}>
              Data will populate after the report is fully processed.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Custom Section Card (drag-drop, deleteable) ─────────────────────────────
function CustomSectionCard({ section, onDelete, provided, snapshot }) {
  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      style={{
        ...provided.draggableProps.style,
        backgroundColor: 'white',
        border: snapshot.isDragging ? '2px solid #2563eb' : '1px solid #e2e8f0',
        borderRadius: 10, padding: 16, marginBottom: 10,
        boxShadow: snapshot.isDragging
          ? '0 8px 24px rgba(0,0,0,0.18)'
          : '0 1px 4px rgba(0,0,0,0.07)',
        transition: 'box-shadow 0.2s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            {...provided.dragHandleProps}
            style={{ cursor: 'grab', color: '#cbd5e1', fontSize: 22, lineHeight: 1, userSelect: 'none' }}
            title="Drag to reorder"
          >
            ⋮⋮
          </div>
          <span style={{ fontSize: 18 }}>{sectionIcon(section.section_type)}</span>
          <div>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{section.title}</span>
            <span style={{
              marginLeft: 8, fontSize: 11, color: '#64748b',
              background: '#f1f5f9', borderRadius: 4, padding: '2px 7px',
            }}>
              {section.section_type?.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
        <button
          onClick={() => onDelete(section.id)}
          title="Delete custom section"
          style={{
            padding: '4px 12px', background: '#fff1f2',
            color: '#e11d48', border: '1px solid #fda4af',
            borderRadius: 6, cursor: 'pointer', fontSize: 13,
          }}
        >
          🗑️ Delete
        </button>
      </div>

      {section.description && (
        <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 12px' }}>{section.description}</p>
      )}
      {section.ai_prompt && (
        <div style={{
          fontSize: 12, color: '#94a3b8', marginBottom: 12,
          padding: 8, background: '#f8fafc', borderRadius: 6,
          borderLeft: '3px solid #2563eb',
        }}>
          💬 Generated from: "{section.ai_prompt}"
        </div>
      )}
      <ChartRenderer section={section} />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function GenerateReport() {
  const { id: editId } = useParams();
  const navigate = useNavigate();
  // state
  const [step, setStep]                         = useState('setup');  // 'setup' | 'builder'
  const [report, setReport]                     = useState(null);
  const [defaultSections, setDefaultSections]   = useState([]);
  const [customSections, setCustomSections]     = useState([]);
  const [loading, setLoading]                   = useState(false);
  const [reportName, setReportName]             = useState('');
  const [showAIChat, setShowAIChat]             = useState(false);
  const [error, setError]                       = useState(null);
  const [programs, setPrograms]                 = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [loadingPrograms, setLoadingPrograms]   = useState(true);
  const [defaultTemplateDefs, setDefaultTemplateDefs] = useState([]);

  // fetch programs + default template defs on mount
  useEffect(() => {
    const init = async () => {
      try {
        setLoadingPrograms(true);
        const [progRes, tmplRes] = await Promise.all([listPrograms(), getDefaultTemplate()]);
        const progs = progRes.data || [];
        setPrograms(progs);
        if (progs.length > 0) setSelectedProgramId(progs[0].id);
        setDefaultTemplateDefs(tmplRes.data || []);

        // ── EDIT MODE: load existing report and jump to builder ──
        if (editId) {
          const res = await getReportWithData(editId);
          const rpt = res.data;
          setReport(rpt);
          setReportName(rpt.name || '');
          if (rpt.program_id) setSelectedProgramId(rpt.program_id);
          const all = rpt.sections || [];
          setDefaultSections(all.filter(s => s.is_default));
          setCustomSections(all.filter(s => !s.is_default));
          setStep('builder');
        }
      } catch (err) {
        setError('Failed to load data: ' + (err.response?.data?.detail || err.message));
      } finally {
        setLoadingPrograms(false);
      }
    };
    init();
  }, [editId]);

  // create report (backend seeds default sections automatically)
  const handleCreateReport = async () => {
    if (!reportName.trim()) { setError('Please enter a report name'); return; }
    if (!selectedProgramId) { setError('Please select a program'); return; }
    try {
      setLoading(true);
      setError(null);
      const res = await createReport({
        name: reportName,
        description: `Created on ${new Date().toLocaleDateString()}`,
        program_id: selectedProgramId,
        is_template: false,
        auto_seed_defaults: true,
      });
      setReport(res.data);
      setStep('builder');
      await loadReportData(res.data.id);
    } catch (err) {
      setError('Failed to create report: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  // load report and split into default / custom
  const loadReportData = async (reportId) => {
    const id = reportId || report?.id;
    if (!id) return;
    try {
      const res = await getReportWithData(id);
      const all = res.data.sections || [];
      setDefaultSections(all.filter(s => s.is_default));
      setCustomSections(all.filter(s => !s.is_default));
    } catch (err) {
      console.error('Failed to load report data:', err);
    }
  };

  useEffect(() => {
    if (report) {
      const iv = setInterval(() => loadReportData(), 30000);
      return () => clearInterval(iv);
    }
  }, [report]);

  // AI section generation (only creates custom sections)
  const handleAddSection = async (userPrompt) => {
    if (!report) return;
    try {
      setLoading(true);
      setError(null);
      await generateSectionWithAI(report.id, {
        user_prompt: userPrompt,
        program_id: selectedProgramId,
      });
      await loadReportData();
    } catch (err) {
      setError('Failed to generate section: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  // drag-drop reorder (custom sections only)
  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const items = Array.from(customSections);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setCustomSections(items);
    const reordered = items.map((s, idx) => ({ id: s.id, section_order: defaultSections.length + idx }));
    try {
      await reorderSections(report.id, { sections: reordered });
    } catch (err) {
      console.error('Reorder failed:', err);
      await loadReportData();
    }
  };

  // delete a custom section
  const handleDeleteSection = async (sectionId) => {
    if (!confirm('Delete this custom section?')) return;
    try {
      setLoading(true);
      await deleteSection(report.id, sectionId);
      await loadReportData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete section');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h1 style={{ margin: 0 }}>📊 Report Builder</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          {editId && (
            <button
              onClick={() => navigate(`/reports/view/${editId}`)}
              style={{ padding: '8px 18px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
            >
              👁 View Report
            </button>
          )}
          <button
            onClick={() => navigate('/reports')}
            style={{ padding: '8px 18px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
          >
            ← Back to Reports
          </button>
        </div>
      </div>
      <p style={{ color: '#64748b', marginBottom: 24 }}>
        {step === 'setup'
          ? 'Every report starts with the standard default template. Add custom sections on top.'
          : `Editing: ${report?.name}`}
      </p>

      {error && (
        <div style={{
          padding: 12, marginBottom: 16, background: '#fff1f2',
          border: '1px solid #fda4af', borderRadius: 6, color: '#e11d48',
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e11d48' }}>✕</button>
        </div>
      )}

      {/* ── SETUP STEP ── */}
      {step === 'setup' && (
        <div>
          {/* config card */}
          <div style={{
            background: 'white', borderRadius: 12, padding: 28,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 28,
          }}>
            <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 18 }}>1. Configure Report</h2>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                Program *
              </label>
              {loadingPrograms ? (
                <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading programs…</p>
              ) : programs.length === 0 ? (
                <p style={{ color: '#f59e0b', fontSize: 14 }}>No programs available.</p>
              ) : (
                <select
                  value={selectedProgramId}
                  onChange={e => setSelectedProgramId(e.target.value)}
                  style={{
                    padding: '10px 14px', width: '100%', maxWidth: 520,
                    borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14, background: 'white',
                  }}
                >
                  <option value="">Select a program</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.state ? ` - ${p.state}` : ''} ({p.status})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                Report Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Q4 2025 Bihar Evidence Analysis"
                value={reportName}
                onChange={e => setReportName(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleCreateReport()}
                style={{
                  padding: '10px 14px', width: '100%', maxWidth: 520,
                  borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 14,
                }}
              />
            </div>

            <button
              onClick={handleCreateReport}
              disabled={loading || !reportName.trim() || !selectedProgramId}
              style={{
                padding: '11px 28px',
                background: (loading || !reportName.trim() || !selectedProgramId) ? '#cbd5e1' : '#2563eb',
                color: 'white', border: 'none', borderRadius: 8,
                cursor: (loading || !reportName.trim() || !selectedProgramId) ? 'not-allowed' : 'pointer',
                fontSize: 15, fontWeight: 600,
              }}
            >
              {loading ? '⏳ Creating…' : '🚀 Create Report with Default Template'}
            </button>
          </div>

          {/* default template preview */}
          <div style={{
            background: 'white', borderRadius: 12, padding: 28,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <h2 style={{ marginTop: 0, marginBottom: 6, fontSize: 18 }}>
              2. Default Template Preview
            </h2>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
              These sections mirror <strong>report.html</strong> up to the Geo Map and are locked —
              they cannot be deleted or reordered. Custom sections you add will appear below these.
            </p>
            {defaultTemplateDefs.length === 0 ? (
              <p style={{ color: '#94a3b8' }}>Loading template definition…</p>
            ) : (
              <DefaultTemplatePreview sections={defaultTemplateDefs} />
            )}
          </div>
        </div>
      )}

      {/* ── BUILDER STEP ── */}
      {step === 'builder' && (
        <div>
          {/* toolbar */}
          <div style={{
            background: 'white', borderRadius: 10, padding: '14px 20px',
            marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <h2 style={{ margin: 0, marginBottom: 2 }}>{report.name}</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
                🔒 {defaultSections.length} default &nbsp;+&nbsp;
                ✏️ {customSections.length} custom section{customSections.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setShowAIChat(v => !v)}
              style={{
                padding: '9px 18px', background: '#2563eb', color: 'white',
                border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
              }}
            >
              {showAIChat ? '➖ Hide AI' : '✨ Add Custom Section'}
            </button>
          </div>

          {showAIChat && <AIChatInterface onSubmit={handleAddSection} loading={loading} />}

          {/* DEFAULT SECTIONS */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>🔒 Default Template</h3>
              <span style={{
                fontSize: 12, color: '#15803d', background: '#f0fdf4',
                border: '1px solid #86efac', borderRadius: 20, padding: '2px 10px',
              }}>
                Included in every report · Cannot be deleted or reordered
              </span>
            </div>
            {defaultSections.length === 0
              ? <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading…</p>
              : defaultSections.map(s => <DefaultSectionCard key={s.id} section={s} />)
            }
          </div>

          {/* CUSTOM SECTIONS */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>✏️ Custom Sections</h3>
              <span style={{
                fontSize: 12, color: '#2563eb', background: '#eff6ff',
                border: '1px solid #93c5fd', borderRadius: 20, padding: '2px 10px',
              }}>
                AI-generated · Drag to reorder · Deleteable
              </span>
            </div>

            {customSections.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '40px 24px',
                background: '#f8fafc', borderRadius: 10, border: '2px dashed #cbd5e1',
              }}>
                <p style={{ color: '#94a3b8', fontSize: 15, marginBottom: 16 }}>
                  No custom sections yet. Use <strong>✨ Add Custom Section</strong> to generate one with AI.
                </p>
                <button
                  onClick={() => setShowAIChat(true)}
                  style={{
                    padding: '10px 22px', background: '#2563eb', color: 'white',
                    border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  }}
                >
                  ✨ Generate First Custom Section
                </button>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="custom-sections">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      style={{
                        background: snapshot.isDraggingOver ? '#eff6ff' : 'transparent',
                        borderRadius: 10, padding: snapshot.isDraggingOver ? 8 : 0,
                        transition: 'all 0.2s', minHeight: 60,
                      }}
                    >
                      {customSections.map((section, index) => (
                        <Draggable key={String(section.id)} draggableId={String(section.id)} index={index}>
                          {(provided, snapshot) => (
                            <CustomSectionCard
                              section={section}
                              index={index}
                              onDelete={handleDeleteSection}
                              provided={provided}
                              snapshot={snapshot}
                            />
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
