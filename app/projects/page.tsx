'use client';

import { AuthProvider } from '../../contexts/AuthContext';
import Navigation from '../../components/Navigation';
import ProjectLibrary from '../../components/ProjectLibrary';

export default function ProjectsPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <ProjectLibrary />
      </div>
    </AuthProvider>
  );
}
