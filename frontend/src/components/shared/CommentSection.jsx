import { useState, useEffect, useRef } from 'react';
import { Send, X, CheckCircle, Loader2, MessageCircle, Image as ImageIcon, Video, FileText, PanelsTopLeft, LayoutList } from 'lucide-react';
import axiosInstance from '../../api/axiosConfig';
import { useAppStore } from '../../stores/appStore';

const COMPONENT_TABS = [
  { key: null,      label: 'Tất cả', icon: LayoutList },
  { key: 'IMAGE',   label: 'Ảnh', icon: ImageIcon },
  { key: 'VIDEO',   label: 'Video', icon: Video },
  { key: 'TEXT',    label: 'Text', icon: FileText },
  { key: 'APLUS',   label: 'A+', icon: PanelsTopLeft },
  { key: 'GENERAL', label: 'Chung', icon: MessageCircle },
];

const ROLE_STYLES = {
  ADMIN:          'bg-purple-100 text-purple-700',
  MARVEL:         'bg-indigo-100 text-indigo-700',
  SELLER:         'bg-green-100 text-green-700',
  PRODUCT_DESIGN: 'bg-red-100 text-red-700',
};

const ROLE_LABELS = {
  ADMIN:          'Admin',
  MARVEL:         'Marvel',
  SELLER:         'Seller',
  PRODUCT_DESIGN: 'Design',
};

const COMPONENT_LABELS = {
  IMAGE:   { text: 'Ảnh',   cls: 'bg-red-50 text-red-600' },
  VIDEO:   { text: 'Video', cls: 'bg-purple-50 text-purple-600' },
  TEXT:    { text: 'Text',  cls: 'bg-green-50 text-green-600' },
  APLUS:   { text: 'A+',    cls: 'bg-orange-50 text-orange-600' },
  GENERAL: { text: 'Chung', cls: 'bg-gray-100 text-gray-500' },
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

// Props:
//   previewId   — UUID của preview (required)
//   defaultComponent — tab mặc định ('IMAGE' | 'VIDEO' | 'TEXT' | etc.)
//   onClose     — callback đóng panel
const CommentSection = ({ previewId, defaultComponent = null, onClose }) => {
  const { user } = useAppStore();
  const [activeComponent, setActiveComponent] = useState(defaultComponent);
  // Kết quả tải gắn với khoá (preview + tab) đã tải; khác khoá hiện tại nghĩa là đang tải.
  const [fetched, setFetched] = useState({ key: null, comments: [], error: '' });
  const [actionError, setActionError] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newComponent, setNewComponent] = useState(defaultComponent || 'GENERAL');
  const [submitting, setSubmitting] = useState(false);
  const [prevDefaultComponent, setPrevDefaultComponent] = useState(defaultComponent);
  const listRef = useRef(null);

  const fetchKey = previewId ? `${previewId}|${activeComponent ?? ''}` : null;
  const loading = fetchKey !== null && fetched.key !== fetchKey;
  const comments = fetched.comments;
  const error = fetched.error || actionError;

  const canResolve = user?.role === 'ADMIN' || user?.role === 'SELLER';

  useEffect(() => {
    if (!fetchKey) return undefined;
    let cancelled = false;
    const params = activeComponent ? `?component=${activeComponent}` : '';
    axiosInstance.get(`/api/previews/${previewId}/comments${params}`)
      .then((res) => {
        if (!cancelled) setFetched({ key: fetchKey, comments: res.data || [], error: '' });
      })
      .catch(() => {
        if (!cancelled) {
          setFetched({ key: fetchKey, comments: [], error: 'Không thể tải comments. Vui lòng thử lại.' });
        }
      });
    return () => { cancelled = true; };
  }, [fetchKey, previewId, activeComponent]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments]);

  // Đồng bộ tab với defaultComponent từ parent: điều chỉnh state ngay trong lúc render
  // (không dùng effect) khi prop đổi.
  if (defaultComponent !== prevDefaultComponent) {
    setPrevDefaultComponent(defaultComponent);
    setActiveComponent(defaultComponent);
    setNewComponent(defaultComponent || 'GENERAL');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newContent.trim() || !previewId) return;
    setSubmitting(true);
    try {
      const res = await axiosInstance.post(`/api/previews/${previewId}/comments`, {
        content: newContent.trim(),
        targetComponent: newComponent,
      });
      setFetched(prev => ({ ...prev, comments: [...prev.comments, res.data] }));
      setNewContent('');
    } catch {
      setActionError('Gửi comment thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (commentId) => {
    try {
      const res = await axiosInstance.put(`/api/comments/${commentId}/resolve`);
      setFetched(prev => ({ ...prev, comments: prev.comments.map(c => c.id === commentId ? res.data : c) }));
    } catch {
      setActionError('Không thể resolve comment.');
    }
  };

  if (!previewId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-400">
        <MessageCircle size={40} className="mb-3 opacity-40" />
        <p className="text-sm">Lưu preview trước để xem và thêm comments.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-blue-600" />
          <span className="font-semibold text-gray-800 text-sm">Comments</span>
          {comments.length > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
              {comments.length}
            </span>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        )}
      </div>

      {/* Component filter tabs */}
      <div className="flex overflow-x-auto border-b border-gray-100 bg-white">
        {COMPONENT_TABS.map(tab => (
          <button
            key={tab.key ?? 'all'}
            onClick={() => { setActiveComponent(tab.key); setActionError(''); }}
            className={`flex min-h-11 flex-shrink-0 items-center gap-1 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap
              ${activeComponent === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <tab.icon size={14} aria-hidden="true" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Comment list */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading ? (
          <div className="flex justify-center pt-8">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <p className="text-xs text-red-500 text-center pt-4">{error}</p>
        ) : comments.length === 0 ? (
          <div className="text-center pt-8 text-gray-400 text-xs">
            Chưa có comment nào.
          </div>
        ) : (
          comments.map(comment => {
            const compMeta = COMPONENT_LABELS[comment.targetComponent] || COMPONENT_LABELS.GENERAL;
            return (
              <div
                key={comment.id}
                className={`rounded-xl p-3 border text-sm ${comment.resolved ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100 shadow-sm'}`}
              >
                {/* Meta row */}
                <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                  <span className="font-semibold text-gray-800 text-xs">{comment.authorName}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${ROLE_STYLES[comment.authorRole] || 'bg-gray-100 text-gray-500'}`}>
                    {ROLE_LABELS[comment.authorRole] || comment.authorRole}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${compMeta.cls}`}>
                    {compMeta.text}
                  </span>
                  <span className="text-[10px] text-gray-400 ml-auto">{formatDate(comment.createdAt)}</span>
                </div>

                {/* Content */}
                <p className="text-gray-700 leading-relaxed">{comment.content}</p>

                {/* Resolved indicator */}
                {comment.resolved ? (
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-green-600">
                    <CheckCircle size={11} />
                    Đã resolve{comment.resolvedByName ? ` bởi ${comment.resolvedByName}` : ''}
                  </div>
                ) : canResolve ? (
                  <button
                    onClick={() => handleResolve(comment.id)}
                    className="mt-1.5 text-[10px] text-gray-400 hover:text-green-600 flex items-center gap-1 transition-colors"
                  >
                    <CheckCircle size={11} />
                    Đánh dấu resolve
                  </button>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {/* Post new comment */}
      <div className="border-t border-gray-100 p-3 bg-white">
        <form onSubmit={handleSubmit} className="space-y-2">
          <select
            value={newComponent}
            onChange={e => setNewComponent(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-gray-50"
          >
            <option value="GENERAL">Chung</option>
            <option value="IMAGE">Ảnh</option>
            <option value="VIDEO">Video</option>
            <option value="TEXT">Text</option>
            <option value="APLUS">A+ Content</option>
          </select>
          <div className="flex gap-2">
            <input
              type="text"
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Nhập comment..."
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-400"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={submitting || !newContent.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentSection;
