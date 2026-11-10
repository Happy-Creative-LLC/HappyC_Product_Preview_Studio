import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AmazonSearchPage from './AmazonSearchPage';
import axiosInstance from '../api/axiosConfig';

vi.mock('../api/axiosConfig', () => ({ default: { get: vi.fn() } }));

vi.mock('../components/amazon/Header', () => ({
  default: ({ searchValue, onSearchChange, onSearchSubmit, searchLoading }) => (
    <form onSubmit={(event) => { event.preventDefault(); onSearchSubmit(); }}>
      <label htmlFor="search-keyword">Từ khoá</label>
      <input id="search-keyword" value={searchValue} onChange={onSearchChange} />
      <button type="submit" disabled={searchLoading}>Tìm kiếm</button>
    </form>
  ),
}));

const product = {
  id: 'B01', title: 'Cotton competitor shirt', image: 'https://example.com/shirt.jpg',
  price: 29.99, promotion: 'Save 10%', deliveryTime: 'FREE delivery Friday',
};
const resultsResponse = {
  data: [product],
  headers: { 'x-search-fetched-at': '2026-11-10T03:00:00Z', 'x-search-stale': 'false' },
};

const renderPage = (url = '/search') => render(
  <MemoryRouter initialEntries={[url]}><AmazonSearchPage /></MemoryRouter>,
);

describe('Amazon Search với quota miễn phí', () => {
  beforeEach(() => vi.resetAllMocks());

  it('gợi ý từ khoá từ Preview nhưng không tự tiêu lượt tìm kiếm', async () => {
    axiosInstance.get.mockResolvedValueOnce({ data: { productData: { title: 'Cotton family shirt', images: [] } } });
    renderPage('/search?taskId=task-1');

    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Từ khoá' })).toHaveValue('Cotton family shirt'));

    expect(axiosInstance.get).toHaveBeenCalledTimes(1);
    expect(axiosInstance.get.mock.calls[0][0]).toBe('/api/tasks/task-1/preview');
  });

  it('Enter gửi đúng một tìm kiếm và hiển thị dữ liệu thật cùng thời điểm cập nhật', async () => {
    axiosInstance.get.mockResolvedValueOnce(resultsResponse);
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByRole('textbox', { name: 'Từ khoá' }), 'cotton shirt{Enter}');

    expect(await screen.findByText(product.title)).toBeInTheDocument();
    expect(screen.getByText('Save 10%')).toBeInTheDocument();
    expect(screen.getByText('FREE delivery Friday')).toBeInTheDocument();
    expect(screen.getByText(/Cập nhật.*10\/11\/26/)).toBeInTheDocument();
    expect(axiosInstance.get).toHaveBeenCalledTimes(1);
    expect(axiosInstance.get).toHaveBeenCalledWith('/api/amazon/search', expect.objectContaining({
      params: { keyword: 'cotton shirt', forceRefresh: false },
    }));
  });

  it('khóa nút và không gửi hai lần khi tìm kiếm đang chạy', async () => {
    let finish;
    axiosInstance.get.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByRole('textbox', { name: 'Từ khoá' }), 'shirt{Enter}{Enter}');

    expect(screen.getByRole('button', { name: 'Tìm kiếm' })).toBeDisabled();
    expect(axiosInstance.get).toHaveBeenCalledTimes(1);
    finish(resultsResponse);
    expect(await screen.findByText(product.title)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tìm kiếm' })).toBeEnabled();
  });

  it('lỗi quota không làm mất kết quả đang so sánh', async () => {
    axiosInstance.get.mockResolvedValueOnce(resultsResponse).mockRejectedValueOnce({
      response: { status: 429, data: { message: 'Đã hết lượt tìm kiếm SerpApi miễn phí.' } },
    });
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByRole('textbox', { name: 'Từ khoá' }), 'shirt{Enter}');
    await screen.findByText(product.title);

    await user.click(screen.getByRole('button', { name: 'Cập nhật từ Amazon' }));

    expect(await screen.findByText('Đã hết lượt tìm kiếm SerpApi miễn phí.')).toBeInTheDocument();
    expect(screen.getByText(product.title)).toBeInTheDocument();
    expect(axiosInstance.get).toHaveBeenCalledTimes(2);
  });

  it('gắn nhãn dữ liệu mẫu rõ ràng khi API không khả dụng', async () => {
    axiosInstance.get.mockResolvedValueOnce({
      data: [{ ...product, id: 'demo-1', demo: true }],
      headers: { 'x-search-source': 'demo', 'x-search-notice': 'DEMO_QUOTA_LIMIT' },
    });
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByRole('textbox', { name: 'Từ khoá' }), 'shirt{Enter}');

    expect(await screen.findByRole('status')).toHaveTextContent('đây không phải kết quả Amazon');
    expect(screen.getByText('Dữ liệu mẫu')).toBeInTheDocument();
    expect(screen.getByText(/1 sản phẩm mẫu/)).toBeInTheDocument();
  });

  it('nêu rõ đang dùng cache khi provider đạt giới hạn', async () => {
    axiosInstance.get.mockResolvedValueOnce({
      ...resultsResponse,
      headers: { ...resultsResponse.headers, 'x-search-notice': 'QUOTA_LIMIT' },
    });
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByRole('textbox', { name: 'Từ khoá' }), 'shirt{Enter}');

    expect(await screen.findByRole('status')).toHaveTextContent('Đang hiển thị kết quả đã lưu.');
    expect(screen.getByText(product.title)).toBeInTheDocument();
  });
});
