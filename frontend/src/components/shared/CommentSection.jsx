import React, { useState, useEffect } from 'react';
import { useCommentStore } from '../../stores/useCommentStore';
import { Send, User } from 'lucide-react';

const CommentSection = ({ targetComponent }) => {
  const { comments, fetchComments, addComment, currentRole, loading } = useCommentStore();
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchComments(targetComponent);
  }, [targetComponent, currentRole]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      addComment(newComment, targetComponent);
      setNewComment('');
    }
  };

  const isRoleAllowedToView = () => {
    if (currentRole === 'SELLER') return true;
    if (currentRole === 'DESIGN' && targetComponent === 'IMAGE') return true;
    if (currentRole === 'MEDIA' && targetComponent === 'VIDEO') return true;
    return false;
  };

  if (!isRoleAllowedToView()) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm mt-4 border border-red-200">
        Your role ({currentRole}) does not have permission to view or comment on {targetComponent}.
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-gray-200 pt-4">
      <h3 className="font-bold text-gray-800 mb-2 flex items-center">
        Discussion ({targetComponent})
      </h3>
      
      <div className="bg-gray-50 border border-gray-200 rounded-md p-3 h-48 overflow-y-auto mb-3 flex flex-col space-y-2">
        {loading ? (
          <div className="text-gray-500 text-sm italic text-center mt-4">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-gray-500 text-sm italic text-center mt-4">No comments yet.</div>
        ) : (
          comments.map(c => (
            <div key={c.id} className="bg-white p-2 rounded shadow-sm border border-gray-100 text-sm">
              <div className="flex justify-between mb-1">
                <span className={`font-bold text-xs px-2 py-0.5 rounded ${c.authorRole === 'SELLER' ? 'bg-orange-100 text-orange-800' : c.authorRole === 'DESIGN' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                  {c.authorRole}
                </span>
                <span className="text-gray-400 text-xs">
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="text-gray-700">
                {c.content}
              </div>
              
              {/* Approve/Reject Simulation (Seller Only) */}
              {currentRole === 'SELLER' && (
                <div className="flex space-x-2 mt-2 pt-2 border-t border-gray-100">
                  <button className="text-xs text-green-600 hover:underline">Approve</button>
                  <button className="text-xs text-red-600 hover:underline">Reject</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="flex-grow p-2 border border-gray-300 rounded focus:border-blue-500 outline-none text-sm"
        />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex items-center justify-center w-10">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default CommentSection;
