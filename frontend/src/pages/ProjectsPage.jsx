import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { Folder, LogOut, ArrowRight } from 'lucide-react';

const ProjectsPage = () => {
  const navigate = useNavigate();
  const { role, projects, setRole } = useAppStore();

  useEffect(() => {
    if (!role) {
      navigate('/');
    }
  }, [role, navigate]);

  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}/tasks`);
  };

  const handleLogout = () => {
    setRole(null);
    navigate('/');
  };

  if (!role) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <div className="max-w-6xl w-full flex justify-between items-center mb-12 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">Select a project to view tasks</p>
        </div>
        <div className="flex items-center space-x-6">
          <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium border border-indigo-100">
            Current Role: <span className="font-bold">{role}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} />
            <span>Change Role</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl w-full">
        {projects.map((project) => (
          <div 
            key={project.id}
            onClick={() => handleProjectClick(project.id)}
            className="bg-white rounded-xl shadow-md p-8 flex items-center justify-between cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border border-gray-100 group"
          >
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-100 transition-colors">
                <Folder size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">{project.name}</h2>
                <p className="text-gray-500 text-sm mt-1">Click to view tasks</p>
              </div>
            </div>
            <div className="text-gray-300 group-hover:text-orange-500 transition-colors">
              <ArrowRight size={28} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectsPage;
