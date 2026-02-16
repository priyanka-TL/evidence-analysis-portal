/**
 * Report Builder
 * AI-powered report generation with drag-drop section reordering
 */
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { createReport, generateSectionWithAI, reorderSections, getReportWithData, deleteSection, listPrograms } from '../api/reports';
import ChartRenderer from '../components/ChartRenderer';
import AIChatInterface from '../components/AIChatInterface';

export default function GenerateReport() {
  const [report, setReport] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportName, setReportName] = useState('');
  const [showAIChat, setShowAIChat] = useState(false);
  const [error, setError] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [loadingPrograms, setLoadingPrograms] = useState(true);

  // Fetch programs on mount
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        setLoadingPrograms(true);
        const res = await listPrograms();
        setPrograms(res.data || []);
        // Auto-select first program if available
        if (res.data && res.data.length > 0) {
          setSelectedProgramId(res.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load programs:', err);
        setError('Failed to load programs: ' + (err.response?.data?.detail || err.message));
      } finally {
        setLoadingPrograms(false);
      }
    };
    fetchPrograms();
  }, []);

  // Create new report
  const handleCreateReport = async () => {
    if (!reportName.trim()) {
      setError('Please enter a report name');
      return;
    }

    if (!selectedProgramId) {
      setError('Please select a program');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await createReport({
        name: reportName,
        description: `Created on ${new Date().toLocaleDateString()}`,
        program_id: selectedProgramId,
        is_template: false
      });
      setReport(res.data);
      setShowAIChat(true);
    } catch (err) {
      setError('Failed to create report: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Add section using AI
  const handleAddSection = async (userPrompt) => {
    if (!report) return;
    
    try {
      setLoading(true);
      setError(null);
      await generateSectionWithAI(report.id, {
        user_prompt: userPrompt,
        program_id: selectedProgramId
      });
      
      // Reload report data
      await loadReportData();
    } catch (err) {
      setError('Failed to generate section: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Load full report with data
  const loadReportData = async () => {
    if (!report) return;
    
    try {
      const res = await getReportWithData(report.id);
      setSections(res.data.sections || []);
    } catch (err) {
      console.error('Failed to load report:', err);
      setError('Failed to load report data');
    }
  };

  // Handle drag-drop reorder
  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update UI immediately
    setSections(items);

    // Update section_order
    const reordered = items.map((item, index) => ({
      id: item.id,
      section_order: index
    }));

    try {
      await reorderSections(report.id, { sections: reordered });
    } catch (err) {
      console.error('Failed to reorder:', err);
      // Reload to get correct order
      await loadReportData();
    }
  };

  // Delete section
  const handleDeleteSection = async (sectionId) => {
    if (!confirm('Delete this section?')) return;
    
    try {
      setLoading(true);
      await deleteSection(report.id, sectionId);
      await loadReportData();
    } catch (err) {
      setError('Failed to delete section');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (report) {
      loadReportData();
      // Refresh data every 30 seconds
      const interval = setInterval(loadReportData, 30000);
      return () => clearInterval(interval);
    }
  }, [report]);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 8 }}>📊 Report Builder</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>
        Create reports with AI-powered sections. Drag and drop to reorder.
      </p>

      {error && (
        <div style={{ 
          padding: 12, 
          marginBottom: 16, 
          backgroundColor: '#fee', 
          border: '1px solid #fcc',
          borderRadius: 4,
          color: '#c00'
        }}>
          {error}
        </div>
      )}

      {!report ? (
        <div style={{ 
          backgroundColor: 'white', 
          padding: 24, 
          borderRadius: 8, 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
        }}>
          <h3 style={{ marginTop: 0 }}>Create New Report</h3>
          
          {/* Program Selector */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Program *
            </label>
            {loadingPrograms ? (
              <div style={{ color: '#666', fontSize: 14 }}>Loading programs...</div>
            ) : programs.length === 0 ? (
              <div style={{ 
                padding: 12, 
                backgroundColor: '#fff3cd', 
                border: '1px solid #ffc107',
                borderRadius: 4,
                color: '#856404',
                fontSize: 14
              }}>
                No programs available. Please create a program first.
              </div>
            ) : (
              <select
                value={selectedProgramId}
                onChange={e => setSelectedProgramId(e.target.value)}
                style={{ 
                  padding: '10px 14px', 
                  width: '100%',
                  maxWidth: 500,
                  borderRadius: 4,
                  border: '1px solid #ccc',
                  fontSize: 14,
                  backgroundColor: 'white'
                }}
              >
                <option value="">Select a program</option>
                {programs.map(program => (
                  <option key={program.id} value={program.id}>
                    {program.name} {program.state ? `- ${program.state}` : ''} ({program.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Report Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Report Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Q4 2024 Bihar Schools Analysis"
              value={reportName}
              onChange={e => setReportName(e.target.value)}
              style={{ 
                padding: '10px 14px', 
                width: '100%',
                maxWidth: 500,
                borderRadius: 4,
                border: '1px solid #ccc',
                fontSize: 14
              }}
              onKeyPress={e => e.key === 'Enter' && handleCreateReport()}
            />
          </div>
          <button 
            onClick={handleCreateReport} 
            disabled={loading || !reportName.trim() || !selectedProgramId}
            style={{ 
              padding: '10px 24px',
              backgroundColor: (loading || !reportName.trim() || !selectedProgramId) ? '#ccc' : '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: (loading || !reportName.trim() || !selectedProgramId) ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 500
            }}
          >
            {loading ? 'Creating...' : 'Create Report'}
          </button>
        </div>
      ) : (
        <div>
          <div style={{ 
            backgroundColor: 'white', 
            padding: 16, 
            borderRadius: 8, 
            marginBottom: 16,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{ margin: 0, marginBottom: 4 }}>{report.name}</h2>
              <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
                {sections.length} section{sections.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button 
              onClick={() => setShowAIChat(!showAIChat)}
              style={{ 
                padding: '8px 16px',
                backgroundColor: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500
              }}
            >
              {showAIChat ? '➖ Hide AI' : '➕ Add Section'}
            </button>
          </div>

          {showAIChat && (
            <AIChatInterface onSubmit={handleAddSection} loading={loading} />
          )}

          {sections.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: 48, 
              backgroundColor: '#f9f9f9',
              borderRadius: 8,
              border: '2px dashed #ddd'
            }}>
              <p style={{ fontSize: 18, color: '#999', marginBottom: 16 }}>
                No sections yet. Click "Add Section" to get started!
              </p>
              <button 
                onClick={() => setShowAIChat(true)}
                style={{ 
                  padding: '12px 24px',
                  backgroundColor: '#0066cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 16,
                  fontWeight: 500
                }}
              >
                ✨ Generate First Section with AI
              </button>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="sections">
                {(provided, snapshot) => (
                  <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef}
                    style={{
                      backgroundColor: snapshot.isDraggingOver ? '#f0f7ff' : 'transparent',
                      padding: snapshot.isDraggingOver ? 8 : 0,
                      borderRadius: 8,
                      transition: 'all 0.2s'
                    }}
                  >
                    {sections.map((section, index) => (
                      <Draggable key={section.id} draggableId={section.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={{
                              ...provided.draggableProps.style,
                              backgroundColor: 'white',
                              border: snapshot.isDragging ? '2px solid #0066cc' : '1px solid #ddd',
                              borderRadius: 8,
                              padding: 16,
                              marginBottom: 16,
                              boxShadow: snapshot.isDragging 
                                ? '0 8px 16px rgba(0,0,0,0.2)' 
                                : '0 2px 4px rgba(0,0,0,0.1)',
                              transition: 'box-shadow 0.2s'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                              <div style={{ flex: 1 }}>
                                <div 
                                  {...provided.dragHandleProps}
                                  style={{ 
                                    display: 'inline-block',
                                    cursor: 'grab',
                                    fontSize: 20,
                                    marginRight: 12,
                                    color: '#999'
                                  }}
                                  title="Drag to reorder"
                                >
                                  ⋮⋮
                                </div>
                                <h3 style={{ display: 'inline', fontSize: 18, marginRight: 8 }}>
                                  {section.title}
                                </h3>
                                <span style={{ 
                                  fontSize: 12, 
                                  color: '#666',
                                  backgroundColor: '#f0f0f0',
                                  padding: '2px 8px',
                                  borderRadius: 4
                                }}>
                                  {section.section_type?.replace('_', ' ')}
                                </span>
                              </div>
                              <button 
                                onClick={() => handleDeleteSection(section.id)}
                                style={{
                                  padding: '4px 12px',
                                  backgroundColor: '#fee',
                                  color: '#c00',
                                  border: '1px solid #fcc',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                  fontSize: 14
                                }}
                                title="Delete section"
                              >
                                🗑️
                              </button>
                            </div>
                            {section.description && (
                              <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>
                                {section.description}
                              </p>
                            )}
                            {section.ai_prompt && (
                              <div style={{ 
                                fontSize: 12, 
                                color: '#999',
                                marginBottom: 12,
                                padding: 8,
                                backgroundColor: '#f9f9f9',
                                borderRadius: 4,
                                borderLeft: '3px solid #0066cc'
                              }}>
                                💬 Generated from: "{section.ai_prompt}"
                              </div>
                            )}
                            <ChartRenderer section={section} />
                          </div>
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
      )}
    </div>
  );
}
