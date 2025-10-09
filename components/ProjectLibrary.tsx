'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface Project {
  id: string;
  title: string;
  topic: string;
  content: string;
  createdAt: any;
  steps: any[];
}

export default function ProjectLibrary() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [launchingProject, setLaunchingProject] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/load-projects?userId=${user?.uid}&limit=20`);
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.projects);
      } else {
        setError('Failed to load projects');
      }
    } catch (err) {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleBeginLearning = async (projectId: string) => {
    try {
      setLaunchingProject(projectId);
      
      const response = await fetch('/api/launch-overlay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          userId: user?.uid
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`🎉 ${result.message}\n\nCheck your desktop for the learning overlay window!`);
      } else {
        alert(`❌ ${result.message}\n\n${result.instructions || 'Please try again.'}`);
      }
    } catch (error) {
      console.error('Error launching overlay:', error);
      alert('❌ Error launching learning overlay. Please try again.');
    } finally {
      setLaunchingProject(null);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading your projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-light text-gray-800 mb-4">My Learning Projects</h1>
          <p className="text-gray-600">Your saved learning projects and progress</p>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-light text-gray-600 mb-4">No projects yet</h2>
            <p className="text-gray-500 mb-8">Start learning by creating your first project</p>
            <a 
              href="/" 
              className="inline-block px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Create Your First Project
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <div className="mb-4">
                  <h3 className="text-xl font-medium text-gray-800 mb-2 line-clamp-2">
                    {project.title}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {project.topic}
                    </span>
                    <span>•</span>
                    <span>{formatDate(project.createdAt)}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">
                    {project.steps?.length || 0} steps
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: '0%' }}
                    ></div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleBeginLearning(project.id)}
                    disabled={launchingProject === project.id}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {launchingProject === project.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Launching...
                      </>
                    ) : (
                      'Begin Learning'
                    )}
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                    View
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
