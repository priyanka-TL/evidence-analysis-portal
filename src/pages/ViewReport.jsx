/**
 * View Report
 * Display complete report with all sections
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReportWithData } from '../api/reports';
import ChartRenderer from '../components/ChartRenderer';

export default function ViewReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await getReportWithData(id);
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 18, color: '#666' }}>Loading report...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ 
          padding: 16, 
          backgroundColor: '#fee', 
          border: '1px solid #fcc',
          borderRadius: 4,
          color: '#c00',
          marginBottom: 16
        }}>
          Error: {error}
        </div>
        <button 
          onClick={() => navigate('/reports')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          ← Back to Reports
        </button>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 18, color: '#999' }}>Report not found</div>
        <button 
          onClick={() => navigate('/reports')}
          style={{
            marginTop: 16,
            padding: '10px 20px',
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          ← Back to Reports
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button 
          onClick={() => navigate('/reports')}
          style={{
            padding: '8px 16px',
            backgroundColor: 'white',
            color: '#0066cc',
            border: '1px solid #0066cc',
            borderRadius: 4,
            cursor: 'pointer',
            marginBottom: 16
          }}
        >
          ← Back to Reports
        </button>
        
        <div style={{
          backgroundColor: 'white',
          padding: 24,
          borderRadius: 8,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ margin: 0, marginBottom: 8 }}>
            {report.name}
          </h1>
          {report.description && (
            <p style={{ margin: 0, color: '#666', fontSize: 16 }}>
              {report.description}
            </p>
          )}
          <div style={{ 
            marginTop: 16,
            display: 'flex',
            gap: 16,
            fontSize: 14,
            color: '#999'
          }}>
            <div>
              📊 {report.sections?.length || 0} section{report.sections?.length !== 1 ? 's' : ''}
            </div>
            <div>
              🔗 Program ID: {report.program_id?.substring(0, 8)}...
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      {!report.sections || report.sections.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 64, 
          backgroundColor: '#f9f9f9',
          borderRadius: 8,
          border: '2px dashed #ddd'
        }}>
          <p style={{ fontSize: 18, color: '#999', marginBottom: 16 }}>
            This report has no sections yet.
          </p>
          <button 
            onClick={() => navigate(`/reports/generate`)}
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
            Edit Report
          </button>
        </div>
      ) : (
        <div>
          {report.sections.map((section, index) => (
            <div 
              key={section.id || index}
              style={{
                backgroundColor: 'white',
                borderRadius: 8,
                padding: 24,
                marginBottom: 16,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ margin: 0, marginBottom: 8, fontSize: 20 }}>
                  {section.title}
                </h2>
                {section.description && (
                  <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
                    {section.description}
                  </p>
                )}
                {section.ai_prompt && (
                  <div style={{ 
                    marginTop: 8,
                    fontSize: 12, 
                    color: '#999',
                    padding: 8,
                    backgroundColor: '#f9f9f9',
                    borderRadius: 4,
                    borderLeft: '3px solid #0066cc'
                  }}>
                    💬 AI Generated: "{section.ai_prompt}"
                  </div>
                )}
              </div>
              
              <ChartRenderer section={section} />
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ 
        marginTop: 24,
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 8,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: 12
      }}>
        <button 
          onClick={() => navigate(`/reports/generate`)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500
          }}
        >
          ✏️ Edit Report
        </button>
        <button 
          onClick={() => window.print()}
          style={{
            padding: '10px 20px',
            backgroundColor: 'white',
            color: '#0066cc',
            border: '1px solid #0066cc',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500
          }}
        >
          🖨️ Print
        </button>
        <button 
          onClick={loadReport}
          style={{
            padding: '10px 20px',
            backgroundColor: 'white',
            color: '#666',
            border: '1px solid #ddd',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
}
