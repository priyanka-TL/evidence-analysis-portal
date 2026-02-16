/**
 * AI Chat Interface
 * Natural language interface for generating report sections
 */
import React, { useState } from 'react';

export default function AIChatInterface({ onSubmit, loading }) {
  const [prompt, setPrompt] = useState('');

  const examples = [
    'Show enrollment by district',
    'Compare enrollment 2024 vs 2025',
    'Top 10 districts by evidence count',
    'Pie chart of relevance distribution',
    'Total number of validated evidence',
    'Show enrollment growth percentage by district'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim() && !loading) {
      onSubmit(prompt);
      setPrompt('');
    }
  };

  return (
    <div style={{ 
      border: '1px solid #e0e0e0', 
      borderRadius: 8, 
      padding: 16, 
      marginBottom: 24,
      backgroundColor: '#f9f9f9'
    }}>
      <h3 style={{ marginTop: 0 }}>🤖 AI Section Generator</h3>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 12 }}>
        Describe what you want to see in natural language
      </p>
      
      <div style={{ marginBottom: 12 }}>
        <strong style={{ fontSize: 13 }}>Quick Examples:</strong>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {examples.map(ex => (
            <button
              key={ex}
              onClick={() => setPrompt(ex)}
              disabled={loading}
              style={{
                padding: '6px 12px',
                border: '1px solid #0066cc',
                borderRadius: 4,
                backgroundColor: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 12,
                color: '#0066cc',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#e6f2ff';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white';
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="e.g., Show enrollment growth by district..."
          style={{ 
            flex: 1, 
            padding: '10px 14px', 
            borderRadius: 4, 
            border: '1px solid #ccc',
            fontSize: 14
          }}
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={loading || !prompt.trim()}
          style={{
            padding: '10px 24px',
            backgroundColor: loading || !prompt.trim() ? '#ccc' : '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: loading || !prompt.trim() ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 500,
            transition: 'background-color 0.2s'
          }}
        >
          {loading ? '⏳ Generating...' : '✨ Generate'}
        </button>
      </form>
      
      {loading && (
        <div style={{ 
          marginTop: 12, 
          padding: 8, 
          backgroundColor: '#fff3cd', 
          borderRadius: 4,
          fontSize: 13,
          color: '#856404'
        }}>
          AI is analyzing your request and generating the section...
        </div>
      )}
    </div>
  );
}
