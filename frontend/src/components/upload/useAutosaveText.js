import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../stores/appStore';

const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

export default function useAutosaveText(taskId, initialForm, initialUpdatedAt, editable, onSaved, onDirtyChange, toRequest) {
  const [form, setForm] = useState(() => initialForm);
  const [savedSignature, setSavedSignature] = useState(() => JSON.stringify(initialForm));
  const [savedAt, setSavedAt] = useState(initialUpdatedAt || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const inFlight = useRef(false);
  const latest = useRef(form);
  useEffect(() => { latest.current = form; }, [form]);
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
        const response = await useAppStore.getState().saveTaskText(taskId, toRequest(form));
        setSavedSignature(submitted);
        setSavedAt(response?.updatedAt || new Date().toISOString());
        if (JSON.stringify(latest.current) === submitted) onDirtyChange?.(false);
        onSaved?.(response);
      } catch (requestError) {
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
    retry: () => setRetry((value) => value + 1),
    saveLabel: saving ? 'Đang lưu…' : (dirty ? 'Có thay đổi chưa lưu' : (savedAt ? `Đã lưu ${formatTime(savedAt)}` : 'Chưa lưu')),
  };
}
