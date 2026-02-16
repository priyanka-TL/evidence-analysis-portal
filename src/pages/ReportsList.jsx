/**
 * Reports List
 * View all generated reports
 */
import React, { useState, useEffect } from 'react';
import { listReports } from '../api/reports';
import { useNavigate } from 'react-router-dom';

export default function ReportsList() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await listReports();
      setReports(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 18, color: '#666' }}>Loading reports...</div>
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
          color: '#c00'
        }}>
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 24
      }}>
        <div>
          <h1 style={{ margin: 0, marginBottom: 8 }}>📊 Reports</h1>
          <p style={{ margin: 0, color: '#666' }}>
            {reports.length} report{reports.length !== 1 ? 's' : ''} available
          </p>
        </div>
        <button 
          onClick={() => navigate('/reports/generate')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500
          }}
        >
          ➕ Create New Report
        </button>
      </div>

      {reports.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 64, 
          backgroundColor: '#f9f9f9',
          borderRadius: 8,
          border: '2px dashed #ddd'
        }}>
          <p style={{ fontSize: 18, color: '#999', marginBottom: 16 }}>
            No reports yet. Create your first report!
          </p>
          <button 
            onClick={() => navigate('/reports/generate')}
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
            ✨ Create First Report
          </button>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 16
        }}>
          {reports.map(report => (
            <div 
              key={report.id}
              onClick={() => navigate(`/reports/view/${report.id}`)}
              style={{
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: 8,
                padding: 16,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <h3 style={{ margin: 0, marginBottom: 8, fontSize: 18 }}>
                {report.name}
              </h3>
              {report.description && (
                <p style={{ margin: 0, marginBottom: 12, color: '#666', fontSize: 14 }}>
                  {report.description}
                </p>
              )}
              <div style={{ fontSize: 12, color: '#999' }}>
                Created {new Date(report.created_at).toLocaleDateString()}
              </div>
              <div style={{ 
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ 
                  fontSize: 12,
                  color: report.is_template ? '#0066cc' : '#666',
                  fontWeight: report.is_template ? 500 : 400
                }}>
                  {report.is_template ? '📋 Template' : '📊 Report'}
                </span>
                <span style={{ fontSize: 12, color: '#0066cc', fontWeight: 500 }}>
                  View →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
