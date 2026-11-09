import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AmazonTextForm from './AmazonTextForm';
import EtsyTextForm from './EtsyTextForm';
import ListingMediaForm from './ListingMediaForm';

const saveTaskText = vi.fn();
const fetchCurrentPreview = vi.fn();
const get = vi.fn();
const post = vi.fn();
vi.mock('../../stores/appStore', () => ({
  useAppStore: { getState: () => ({ saveTaskText, fetchCurrentPreview }) },
}));
vi.mock('../../api/axiosConfig', () => ({
  default: { get: (...args) => get(...args), post: (...args) => post(...args) },
}));

beforeEach(() => {
  saveTaskText.mockReset();
  fetchCurrentPreview.mockReset();
  post.mockReset();
  get.mockReset();
  get.mockResolvedValue({ data: ['SHIRT', 'MUG'] });
  saveTaskText.mockImplementation(async (_, content) => ({
    id: 'preview-1',
    productData: JSON.stringify(content),
    updatedAt: '2026-11-09T08:32:00',
  }));
});

describe('listing text autosave', () => {
  it('loads Amazon product types from backend and restores saved text after remount', async () => {
    const onSaved = vi.fn();
    const props = { taskId: 'task-1', role: 'SELLER', title: 'Task title', productData: {},
      updatedAt: null, onSaved, onDirtyChange: vi.fn() };
    const view = render(<AmazonTextForm {...props} />);
    await waitFor(() => expect(screen.getByRole('option', { name: 'MUG' })).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Title ·/), { target: { value: 'New listing' } });
    fireEvent.change(screen.getByLabelText(/Search terms ·/), { target: { value: 'á' } });
    expect(screen.getByText('Search terms · 2 byte')).toBeInTheDocument();
    await waitFor(() => expect(saveTaskText).toHaveBeenCalled(), { timeout: 2500 });
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    const saved = onSaved.mock.lastCall[0];
    view.unmount();
    render(<AmazonTextForm {...props} productData={JSON.parse(saved.productData)} updatedAt={saved.updatedAt} />);
    expect(screen.getByLabelText(/Title ·/)).toHaveValue('New listing');
    expect(screen.getByLabelText(/Search terms ·/)).toHaveValue('á');
  });

  it('keeps Etsy tags in the Text payload and blocks editing for Product Design', async () => {
    const { rerender } = render(<EtsyTextForm taskId="task-2" role="SELLER" title="Etsy task"
      productData={{}} updatedAt={null} onSaved={vi.fn()} onDirtyChange={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Description ·/), { target: { value: 'Made to order' } });
    const tagInput = screen.getByLabelText(/Tags ·/);
    fireEvent.change(tagInput, { target: { value: 'gift' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    await waitFor(() => expect(saveTaskText).toHaveBeenCalled(), { timeout: 2500 });
    expect(saveTaskText.mock.lastCall[1].tags).toEqual(['gift']);
    rerender(<EtsyTextForm taskId="task-2" role="PRODUCT_DESIGN" title="Etsy task"
      productData={{}} updatedAt={null} onSaved={vi.fn()} onDirtyChange={vi.fn()} />);
    expect(screen.getByLabelText(/Description ·/)).toHaveAttribute('readonly');
  });

  it('sends the loaded preview version when saving Amazon text', async () => {
    render(<AmazonTextForm taskId="task-1" role="SELLER" title="Task title" productData={{}}
      updatedAt={null} version={3} onSaved={vi.fn()} onDirtyChange={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Title ·/), { target: { value: 'Versioned' } });
    await waitFor(() => expect(saveTaskText).toHaveBeenCalled(), { timeout: 2500 });
    expect(saveTaskText.mock.lastCall[1].version).toBe(3);
  });

  it('reloads the current preview on 409 and saves the typed text again with the fresh version', async () => {
    const onSaved = vi.fn();
    const fresh = {
      id: 'preview-1', version: 4, productData: '{"images":["/uploads/a.jpg"]}', updatedAt: '2026-11-09T08:40:00',
    };
    saveTaskText.mockRejectedValueOnce({
      response: { status: 409, data: { message: 'Nội dung vừa được cập nhật ở nơi khác.' } },
    });
    fetchCurrentPreview.mockResolvedValue(fresh);
    render(<AmazonTextForm taskId="task-1" role="SELLER" title="Task title" productData={{}}
      updatedAt={null} version={3} onSaved={onSaved} onDirtyChange={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Title ·/), { target: { value: 'Typed during conflict' } });
    await waitFor(() => expect(saveTaskText).toHaveBeenCalledTimes(2), { timeout: 4000 });
    expect(saveTaskText.mock.calls[0][1].version).toBe(3);
    expect(saveTaskText.mock.calls[1][1].version).toBe(4);
    expect(saveTaskText.mock.calls[1][1].title).toBe('Typed during conflict');
    expect(fetchCurrentPreview).toHaveBeenCalledWith('task-1');
    expect(onSaved).toHaveBeenCalledWith(fresh);
    expect(screen.getByLabelText(/Title ·/)).toHaveValue('Typed during conflict');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps the chosen files and retries the upload once with the fresh version on 409', async () => {
    const onSaved = vi.fn();
    fetchCurrentPreview.mockResolvedValue({ id: 'preview-1', version: 4, productData: '{}' });
    post.mockRejectedValueOnce({ response: { status: 409 } })
      .mockResolvedValueOnce({ data: { id: 'preview-1', version: 5, productData: '{}' } });
    const { container } = render(<ListingMediaForm taskId="task-1" platform="AMAZON" category={1}
      role="PRODUCT_DESIGN" title="Task title" productData={{}} version={3} onSaved={onSaved}
      onDirtyChange={vi.fn()} />);
    const file = new File(['img'], 'a.png', { type: 'image/png' });
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } });
    fireEvent.click(await screen.findByRole('button', { name: /Lưu media/ }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    expect(post.mock.calls[0][1].get('version')).toBe('3');
    expect(post.mock.calls[1][1].get('version')).toBe('4');
    await waitFor(() => expect(onSaved).toHaveBeenLastCalledWith(expect.objectContaining({ version: 5 })));
  });
});
