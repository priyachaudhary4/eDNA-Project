import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DataUpload from './pages/DataUpload';
import GISMap from './pages/GISMap';
import GenomicEngine from './pages/GenomicEngine';
import SpeciesInquiry from './pages/SpeciesInquiry';
import AlertCenter from './pages/AlertCenter';
import ResearchReports from './pages/ResearchReports';
import BiologicalProfiling from './pages/BiologicalProfiling';
import SystemSettings from './pages/SystemSettings';
import DashboardLayout from './layouts/DashboardLayout';
import { ProfileProvider } from './context/ProfileContext';

const App = () => {
  return (
    <ProfileProvider>
      <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />

        {/* Protected Routes (Authenticated) */}
        <Route
          path="/dashboard"
          element={
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          }
        />
        <Route
          path="/upload"
          element={
            <DashboardLayout>
              <DataUpload />
            </DashboardLayout>
          }
        />
        <Route
          path="/map"
          element={
            <DashboardLayout>
              <GISMap />
            </DashboardLayout>
          }
        />

        {/* Functional Modules */}
        <Route
          path="/genomic"
          element={
            <DashboardLayout>
              <GenomicEngine />
            </DashboardLayout>
          }
        />
        <Route
          path="/species"
          element={
            <DashboardLayout>
              <SpeciesInquiry />
            </DashboardLayout>
          }
        />
        <Route
          path="/alerts"
          element={
            <DashboardLayout>
              <AlertCenter />
            </DashboardLayout>
          }
        />
        <Route
          path="/reports"
          element={
            <DashboardLayout>
              <ResearchReports />
            </DashboardLayout>
          }
        />
        <Route
          path="/profiling"
          element={
            <DashboardLayout>
              <BiologicalProfiling />
            </DashboardLayout>
          }
        />
        <Route
          path="/settings"
          element={
            <DashboardLayout>
              <SystemSettings />
            </DashboardLayout>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </ProfileProvider>
  );
};

export default App;
