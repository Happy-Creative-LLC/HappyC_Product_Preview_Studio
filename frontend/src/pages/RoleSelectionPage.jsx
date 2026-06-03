import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { Shield, Briefcase, Camera, PenTool } from 'lucide-react';

const RoleSelectionPage = () => {
  const navigate = useNavigate();
  const setRole = useAppStore(state => state.setRole);

  const handleRoleSelect = (role) => {
    setRole(role);
    navigate('/projects');
  };

  const roles = [
    { id: 'Admin', title: 'Admin', icon: <Shield size={48} className="text-red-500" />, desc: 'View all projects and tasks in Read-Only mode' },
    { id: 'Seller', title: 'Seller', icon: <Briefcase size={48} className="text-blue-500" />, desc: 'Create tasks and configure products' },
    { id: 'Marvel', title: 'Marvel Team', icon: <Camera size={48} className="text-green-500" />, desc: 'Upload media, videos, and A+ content' },
    { id: 'Product Design', title: 'Product Design', icon: <PenTool size={48} className="text-orange-500" />, desc: 'Upload design assets and adjust layouts' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Amazon Preview System</h1>
        <p className="text-lg text-gray-600">Please select your role to continue</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full">
        {roles.map((role) => (
          <div 
            key={role.id}
            onClick={() => handleRoleSelect(role.id)}
            className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center text-center cursor-pointer hover:shadow-xl hover:scale-105 transition-all border border-gray-100"
          >
            <div className="mb-6 p-4 bg-gray-50 rounded-full">
              {role.icon}
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">{role.title}</h2>
            <p className="text-gray-500 text-sm">{role.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoleSelectionPage;
