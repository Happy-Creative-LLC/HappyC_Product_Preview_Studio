import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { ArrowLeft, Eye, Edit3 } from 'lucide-react';
import AmazonUploadForm from '../components/upload/AmazonUploadForm';

const TaskDetailPage = () => {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const { user, tasks } = useAppStore();

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  const projectTasks = tasks[projectId] || [];
  const task = projectTasks.find(t => t.id === taskId);

  if (!task) return <div className="p-8 text-center">Task not found</div>;

  const isEditor = user?.role === 'Marvel' || user?.role === 'Product Design' || user?.role === 'Seller' || user?.role === 'Admin';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link to={`/projects/${projectId}/tasks`} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
              <p className="text-gray-500 mt-1">Task ID: {task.id} | Type: {task.type}</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Link 
              to={`/amazon?taskId=${taskId}&projectId=${projectId}`}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Eye size={20} />
              <span>Preview Product</span>
            </Link>
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Edit3 size={20} className="text-orange-500" />
              Task Information
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 block mb-1">Status</span>
                <span className="font-medium px-2 py-1 bg-yellow-100 text-yellow-800 rounded">{task.status}</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Target Marketplace</span>
                <span className="font-medium text-gray-900">{task.type}</span>
              </div>
            </div>
          </div>

          {isEditor ? (
            <AmazonUploadForm 
              projectId={projectId} 
              taskId={taskId} 
              initialData={task.productData} 
            />
          ) : (
            <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
              <p className="text-yellow-800">You are in Read-Only mode. Please click <strong>Preview Product</strong> to see the result.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailPage;
