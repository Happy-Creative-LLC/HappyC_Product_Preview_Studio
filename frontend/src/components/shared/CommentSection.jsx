import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, CornerDownRight, Loader2, MessageCircle, Reply, Send, X } from 'lucide-react';
import axiosInstance from '../../api/axiosConfig';
import { useAppStore } from '../../stores/appStore';

const ROLE_LABELS = {
  ADMIN: 'Admin',
  MARVEL: 'Marvel',
  SELLER: 'Seller',
  PRODUCT_DESIGN: 'Product Design',
};

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const makeTree = (comments) => {
  const nodes = new Map(comments.map((comment) => [comment.id, { ...comment, replies: [] }]));
  const roots = [];
  comments.forEach((comment) => {
    const node = nodes.get(comment.id);
    const parent = comment.parentCommentId ? nodes.get(comment.parentCommentId) : null;
    if (parent) parent.replies.push(node);
    else roots.push(node);
  });
  return roots;
};

const getMentionContext = (value, cursor) => {
  const start = value.lastIndexOf('@', cursor - 1);
  if (start < 0 || (start > 0 && /[\w@]/u.test(value[start - 1]))) return null;
  const query = value.slice(start + 1, cursor);
  if (/\s/u.test(query) || value.slice(cursor).match(/^\S/u)) return null;
  return { start, end: cursor, query };
};

const renderContent = (comment) => {
  const mentions = new Map((comment.mentions || []).map((mention) => [`@${mention.username}`, mention]));
  const parts = comment.content.split(/(@[\w.+-]+)/gu);
  return parts.map((part, index) => {
    const mention = mentions.get(part);
    return mention ? (
      <strong className="font-semibold text-blue-700" key={`${part}-${index}`}>{part}</strong>
    ) : part;
  });
};

const CommentSection = ({ taskId, onClose }) => {
  const { user } = useAppStore();
  const [comments, setComments] = useState([]);
  const [mentionableUsers, setMentionableUsers] = useState([]);
  const [draft, setDraft] = useState('');
  const [mentionIds, setMentionIds] = useState([]);
  const [mentionContext, setMentionContext] = useState(null);
  const [replyTarget, setReplyTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!taskId) return undefined;
    let cancelled = false;
    Promise.all([
      axiosInstance.get(`/api/tasks/${taskId}/comments`),
      axiosInstance.get(`/api/tasks/${taskId}/comment-users`),
    ])
      .then(([commentsResponse, usersResponse]) => {
        if (cancelled) return;
        setComments(commentsResponse.data || []);
        setMentionableUsers(usersResponse.data || []);
        setLoadError('');
      })
      .catch(() => {
        if (!cancelled) setLoadError('Không thể tải trao đổi của task. Vui lòng thử lại.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [taskId]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [comments, replyTarget]);

  useEffect(() => {
    if (!replyTarget) return;
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [replyTarget]);

  const suggestions = useMemo(() => {
    if (!mentionContext) return [];
    const query = mentionContext.query.toLocaleLowerCase('vi');
    return mentionableUsers
      .filter((person) => person.id !== user?.userId)
      .filter((person) => `${person.fullName} ${person.username} ${ROLE_LABELS[person.role] || person.role}`
        .toLocaleLowerCase('vi').includes(query))
      .slice(0, 6);
  }, [mentionContext, mentionableUsers, user?.userId]);

  const commentThreads = useMemo(() => makeTree(comments), [comments]);

  const canResolve = user?.role === 'ADMIN' || user?.role === 'SELLER';

  const selectMention = (person) => {
    if (!mentionContext || !inputRef.current) return;
    const token = `@${person.username}`;
    const nextDraft = `${draft.slice(0, mentionContext.start)}${token} ${draft.slice(mentionContext.end)}`;
    const nextCaret = mentionContext.start + token.length + 1;
    setDraft(nextDraft);
    setMentionIds((current) => current.includes(person.id) ? current : [...current, person.id]);
    setMentionContext(null);
    setActiveSuggestion(0);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(nextCaret, nextCaret);
    });
  };

  const handleDraftChange = (event) => {
    const value = event.target.value;
    setDraft(value);
    setMentionContext(getMentionContext(value, event.target.selectionStart));
    setActiveSuggestion(0);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !taskId || submitting) return;
    setSubmitting(true);
    setActionError('');
    const validMentionIds = mentionIds.filter((id) => {
      const person = mentionableUsers.find((item) => item.id === id);
      return person && content.includes(`@${person.username}`);
    });
    try {
      const { data } = await axiosInstance.post(`/api/tasks/${taskId}/comments`, {
        content,
        audience: 'TASK',
        parentCommentId: replyTarget?.id || null,
        mentionIds: validMentionIds,
      });
      setComments((current) => [...current, data]);
      setDraft('');
      setMentionIds([]);
      setMentionContext(null);
      setReplyTarget(null);
    } catch (error) {
      setActionError(error.response?.data?.message || 'Gửi comment thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (commentId) => {
    setActionError('');
    try {
      const { data } = await axiosInstance.put(`/api/comments/${commentId}/resolve`);
      setComments((current) => current.map((comment) => comment.id === commentId ? data : comment));
    } catch {
      setActionError('Không thể cập nhật trạng thái comment.');
    }
  };

  const handleComposerKeyDown = (event) => {
    if (suggestions.length && event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSuggestion((current) => (current + 1) % suggestions.length);
    } else if (suggestions.length && event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSuggestion((current) => (current - 1 + suggestions.length) % suggestions.length);
    } else if (suggestions.length && event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      selectMention(suggestions[activeSuggestion]);
    } else if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const renderComposer = (parent = null) => (
    <form onSubmit={handleSubmit} className="relative space-y-2">
      {parent && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <CornerDownRight size={14} aria-hidden="true" />
          <span>Trả lời {parent.authorName}</span>
          <button type="button" className="ml-auto rounded p-1 hover:bg-slate-100" onClick={() => setReplyTarget(null)} aria-label="Hủy trả lời">
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}
      {mentionContext && suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 z-10 mb-2 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl" role="listbox" aria-label="Chọn người được tag">
          {suggestions.map((person, index) => (
            <button
              key={person.id}
              type="button"
              role="option"
              aria-selected={index === activeSuggestion}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectMention(person)}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left ${index === activeSuggestion ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                {(person.fullName || person.username || '?').slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-xs text-slate-800">{person.fullName}</strong>
                <span className="block truncate text-[11px] text-slate-500">@{person.username} · {ROLE_LABELS[person.role] || person.role}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <label className="sr-only" htmlFor="task-comment-input">Viết comment</label>
        <textarea
          ref={inputRef}
          id="task-comment-input"
          rows={2}
          value={draft}
          onChange={handleDraftChange}
          onKeyDown={handleComposerKeyDown}
          onClick={(event) => setMentionContext(getMentionContext(event.target.value, event.target.selectionStart))}
          placeholder="Viết comment… gõ @ để tag đồng nghiệp"
          maxLength={5000}
          className="min-h-11 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          aria-label="Viết comment"
        />
        <button
          type="submit"
          disabled={submitting || !draft.trim()}
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={parent ? 'Gửi trả lời' : 'Gửi comment'}
        >
          {submitting ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <Send size={17} aria-hidden="true" />}
        </button>
      </div>
      <div className="flex items-center justify-between text-[10px] text-slate-400">
        <span>Enter để chọn tag · Ctrl/⌘ + Enter để gửi · Shift + Enter để xuống dòng</span>
        <span>{draft.length}/5000</span>
      </div>
    </form>
  );

  const renderComment = (comment, depth = 0) => (
    <article key={comment.id} className={`${depth ? 'ml-3 border-l-2 border-slate-100 pl-3 sm:ml-5 sm:pl-4' : ''}`}>
      <div className={`rounded-xl px-3 py-3 ${comment.resolved ? 'bg-slate-50' : 'bg-white'}`}>
        <div className="mb-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <strong className="text-xs font-semibold text-slate-800">{comment.authorName}</strong>
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
            {ROLE_LABELS[comment.authorRole] || comment.authorRole}
          </span>
          <time className="ml-auto text-[10px] text-slate-400" dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time>
        </div>
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">{renderContent(comment)}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => { setReplyTarget(comment); setDraft(''); setMentionIds([]); setMentionContext(null); inputRef.current?.focus(); }} className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-blue-700">
            <Reply size={13} aria-hidden="true" /> Trả lời
          </button>
          {comment.resolved ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700">
              <CheckCircle size={12} aria-hidden="true" /> Đã hoàn tất{comment.resolvedByName ? ` · ${comment.resolvedByName}` : ''}
            </span>
          ) : canResolve && depth === 0 ? (
            <button type="button" onClick={() => handleResolve(comment.id)} className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-700">
              <CheckCircle size={12} aria-hidden="true" /> Đánh dấu hoàn tất
            </button>
          ) : null}
        </div>
      </div>
      {replyTarget?.id === comment.id && <div className="mb-3 ml-3 pl-3 sm:ml-5 sm:pl-4">{renderComposer(replyTarget)}</div>}
      {comment.replies.map((reply) => renderComment(reply, depth + 1))}
    </article>
  );

  if (!taskId) {
    return <div className="flex h-full items-center justify-center p-8 text-center text-sm text-slate-500">Comment chỉ khả dụng trong preview gắn với task.</div>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-blue-50 text-blue-700"><MessageCircle size={18} aria-hidden="true" /></span>
          <div>
            <h2 className="text-sm font-semibold">Trao đổi trong task</h2>
            <p className="text-[11px] text-slate-500">Thảo luận chung cho listing này</p>
          </div>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="Đóng phần trao đổi">
            <X size={17} aria-hidden="true" />
          </button>
        )}
      </header>

      <div ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-slate-50/70 p-3" aria-live="polite">
        {loading ? (
          <div className="flex justify-center pt-10"><Loader2 size={22} className="animate-spin text-blue-600" aria-label="Đang tải comment" /></div>
        ) : loadError ? (
          <p className="pt-8 text-center text-xs text-rose-600" role="alert">{loadError}</p>
        ) : commentThreads.length === 0 ? (
          <div className="px-4 pt-10 text-center">
            <MessageCircle size={26} className="mx-auto mb-2 text-slate-300" aria-hidden="true" />
            <p className="text-xs font-medium text-slate-600">Chưa có trao đổi trong mục này.</p>
            <p className="mt-1 text-[11px] text-slate-400">Viết comment đầu tiên hoặc dùng @ để tag đồng nghiệp.</p>
          </div>
        ) : commentThreads.map((comment) => renderComment(comment))}
      </div>

      <footer className="border-t border-slate-100 bg-white p-3">
        {actionError && <p className="mb-2 text-xs text-rose-600" role="alert">{actionError}</p>}
        {!replyTarget && renderComposer()}
      </footer>
    </div>
  );
};

export default CommentSection;
