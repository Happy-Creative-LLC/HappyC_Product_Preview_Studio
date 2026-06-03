import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { Folder, LogOut, ArrowRight, Search } from 'lucide-react';

const ProjectsPage = () => {
  const navigate = useNavigate();
  const { user, projects, logout } = useAppStore();

  useEffect(() => {
    if (!user) {
      navigate('/');
    } else if (user.role === 'Product Design') {
      const project = projects.find(p => p.key === user.projectKey);
      if (project) {
        navigate(`/projects/${project.id}/tasks`, { replace: true });
      }
    }
  }, [user, navigate, projects]);

  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}/tasks`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  const visibleProjects = user.projectKey === 'all' 
    ? projects 
    : projects.filter(p => p.key === user.projectKey);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <div className="max-w-6xl w-full flex justify-between items-center mb-12 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">Select a project to view tasks</p>
        </div>
        <div className="flex items-center space-x-6">
          <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium border border-indigo-100 flex items-center space-x-2">
            <span>User: <strong>{user.username}</strong></span>
            <span className="text-gray-400">|</span>
            <span>Role: <strong>{user.role}</strong></span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl w-full">
        {visibleProjects.length === 0 && (
          <div className="col-span-1 md:col-span-2 text-center text-gray-500 py-12">
            You do not have access to any projects.
          </div>
        )}
        {visibleProjects.map((project) => (
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
                <h2 className="text-2xl font-semibold text-gray-800">
                  {user.role === 'Seller' ? 'Amazon Preview' : project.name}
                </h2>
                <p className="text-gray-500 text-sm mt-1">Click to view tasks</p>
              </div>
            </div>
            <div className="text-gray-300 group-hover:text-orange-500 transition-colors">
              <ArrowRight size={28} />
            </div>
          </div>
        ))}
        {user.role === 'Seller' && (
          <div 
            onClick={() => navigate('/search')}
            className="bg-white rounded-xl shadow-md p-8 flex items-center justify-between cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all border border-gray-100 group"
          >
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                <Search size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">Amazon Search</h2>
                <p className="text-gray-500 text-sm mt-1">Search and import products</p>
              </div>
            </div>
            <div className="text-gray-300 group-hover:text-blue-600 transition-colors">
              <ArrowRight size={28} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsPage;
