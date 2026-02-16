/**
 * Reports API Client
 * AI-powered report generation with drag-drop sections
 */
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Programs
export const listPrograms = () => api.get('/programs');
export const getProgram = (programId) => api.get(`/programs/${programId}`);

// Report Management
export const createReport = (data) => api.post('/reports', data);
export const listReports = (programId) => 
  api.get('/reports', { params: programId ? { program_id: programId } : {} });
export const getReportWithData = (templateId) => 
  api.get(`/reports/${templateId}`);
export const deleteReport = (templateId) => 
  api.delete(`/reports/${templateId}`);

// AI Section Generation
export const generateSectionWithAI = (templateId, data) => 
  api.post(`/reports/${templateId}/sections/ai-generate`, data);

// Section Management
export const reorderSections = (templateId, data) => 
  api.put(`/reports/${templateId}/sections/reorder`, data);
export const deleteSection = (templateId, sectionId) => 
  api.delete(`/reports/${templateId}/sections/${sectionId}`);

// Legacy API (kept for backward compatibility)
export const getReportTemplates = () => api.get('/reports');
export const getReportTemplate = (id) => api.get(`/reports/${id}`);
export const getReport = (id) => api.get(`/reports/${id}`);
export const getReports = (programId) => listReports(programId);

export default api;

