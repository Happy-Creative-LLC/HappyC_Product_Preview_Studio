import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../stores/appStore';

// Số lần liên tiếp tự tải lại và lưu lại khi gặp 409 trước khi báo lỗi cho người dùng.
const MAX_CONFLICT_RETRIES = 3;

const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Tự lưu vùng Text. `version` là phiên bản preview mà trang đã tải; mỗi lần lưu gửi kèm để backend phát hiện
 * nội dung đã đổi ở nơi khác (ví dụ vừa upload ảnh). Gặp 409 thì tải lại nội dung hiện hành rồi lưu lại đúng phần
 * Text đang có trong form, nên chữ đang gõ không bị mất.
 */
export default function useAutosaveText({
  taskId, initialForm, initialUpdatedAt, editable, version, onSaved, onDirtyChange, toRequest,
}) {
  const [form, setForm] = useState(() => initialForm);
  const [savedSignature, setSavedSignature] = useState(() => JSON.stringify(initialForm));
  const [savedAt, setSavedAt] = useState(initialUpdatedAt || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const inFlight = useRef(false);
  const latest = useRef(form);
  const versionRef = useRef(version ?? null);
  const conflicts = useRef(0);
  useEffect(() => { latest.current = form; }, [form]);
  useEffect(() => {
    if (version != null && (versionRef.current == null || version > versionRef.current)) {
      versionRef.current = version;
    }
  }, [version]);
  const signature = JSON.stringify(form);
  const dirty = signature !== savedSignature;

  useEffect(() => {
    if (!editable || !dirty || inFlight.current) return undefined;
    const timer = setTimeout(async () => {
      if (inFlight.current) return;
      inFlight.current = true;
      setSaving(true);
      setError('');
      const submitted = signature;
      try {
        const response = await useAppStore.getState().saveTaskText(
          taskId, { ...toRequest(form), version: versionRef.current },
        );
        conflicts.current = 0;
        if (response?.version != null) versionRef.current = response.version;
        setSavedSignature(submitted);
        setSavedAt(response?.updatedAt || new Date().toISOString());
        if (JSON.stringify(latest.current) === submitted) onDirtyChange?.(false);
        onSaved?.(response);
      } catch (requestError) {
        if (requestError.response?.status === 409 && conflicts.current < MAX_CONFLICT_RETRIES) {
          conflicts.current += 1;
          try {
            const fresh = await useAppStore.getState().fetchCurrentPreview(taskId);
            versionRef.current = fresh?.version ?? null;
            if (fresh) onSaved?.(fresh);
            setRetry((value) => value + 1);
            return;
          } catch {
            // Không tải lại được nội dung hiện hành: báo lỗi như các lỗi lưu khác.
          }
        }
        setError(requestError.response?.data?.message
          || 'Không lưu được nội dung. Vui lòng thử lại.');
      } finally {
        inFlight.current = false;
        setSaving(false);
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [taskId, form, signature, savedSignature, dirty, editable, onSaved, onDirtyChange, toRequest, retry]);

  const change = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    onDirtyChange?.(true);
  };

  return {
    form,
    change,
    saving,
    dirty,
    error,
    retry: () => {
      conflicts.current = 0;
      setRetry((value) => value + 1);
    },
    saveLabel: saving ? 'Đang lưu…' : (dirty ? 'Có thay đổi chưa lưu' : (savedAt ? `Đã lưu ${formatTime(savedAt)}` : 'Chưa lưu')),
  };
}
