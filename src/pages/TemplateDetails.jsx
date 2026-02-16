import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getReportTemplate } from '../api/reports';

export default function TemplateDetails() {
  const { id } = useParams();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTemplate();
  }, [id]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const res = await getReportTemplate(id);
      setTemplate(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading template...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!template) return <div className="error">Template not found</div>;

  return (
    <div className="container">
      <div className="card">
        <h2>{template.name}</h2>
        <p style={{ color: '#666', marginBottom: 20 }}>{template.description}</p>
        
        <div style={{ marginBottom: 20 }}>
          <strong>Created by:</strong> {template.created_by} <br/>
          <strong>Created at:</strong> {new Date(template.created_at).toLocaleString()} <br/>
          <strong>Default template:</strong> {template.is_default ? 'Yes' : 'No'}
        </div>

        <h3>Sections ({template.sections?.length || 0})</h3>
        
        {template.sections && template.sections.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Type</th>
                <th>Title</th>
                <th>Description</th>
                <th>Configuration</th>
              </tr>
            </thead>
            <tbody>
              {template.sections.map(section => (
                <tr key={section.id}>
                  <td>{section.sort_order}</td>
                  <td>
                    <span style={{ 
                      background: '#e6f7ff',
                      color: '#1890ff',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 12
                    }}>
                      {section.section_type}
                    </span>
                  </td>
                  <td>{section.title}</td>
                  <td style={{ color: '#666', fontSize: 13 }}>{section.description}</td>
                  <td>
                    <details>
                      <summary style={{ cursor: 'pointer', color: '#1890ff' }}>View Config</summary>
                      <pre style={{ fontSize: 11, marginTop: 8, overflow: 'auto' }}>
                        {JSON.stringify(section.config, null, 2)}
                      </pre>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#999' }}>No sections defined for this template.</p>
        )}
      </div>
    </div>
  );
}
