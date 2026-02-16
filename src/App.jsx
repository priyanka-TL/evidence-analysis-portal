import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import ReportsList from './pages/ReportsList';
import TemplateDetails from './pages/TemplateDetails';
import GenerateReport from './pages/GenerateReport';
import ViewReport from './pages/ViewReport';
import './index.css';

function App() {
  return (
    <Router>
      <div className="header">
        <h1>📊 Evidence Analysis Portal</h1>
        <nav>
          <Link to="/reports" className="active">Reports</Link>
        </nav>
      </div>

      <Routes>
        <Route path="/" element={<Navigate to="/reports" replace />} />
        <Route path="/reports" element={<ReportsList />} />
        <Route path="/reports/templates/:id" element={<TemplateDetails />} />
        <Route path="/reports/generate" element={<GenerateReport />} />
        <Route path="/reports/view/:id" element={<ViewReport />} />
      </Routes>
    </Router>
  );
}

export default App;
