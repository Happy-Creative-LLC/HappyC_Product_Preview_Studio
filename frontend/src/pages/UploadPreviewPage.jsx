import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';

const UploadPreviewPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    projectName: '',
    platform: 'AMAZON',
    title: '',
    price: '',
  });

  const [files, setFiles] = useState({
    mainImage: null,
    galleryImages: [],
    video: null,
  });

  const [isUploading, setIsUploading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (name === 'galleryImages') {
      setFiles({ ...files, galleryImages: Array.from(selectedFiles) });
    } else {
      setFiles({ ...files, [name]: selectedFiles[0] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    const data = new FormData();
    data.append('projectName', formData.projectName);
    data.append('platform', formData.platform);
    data.append('title', formData.title);
    if (formData.price) {
      data.append('price', parseFloat(formData.price));
    }
    
    if (files.mainImage) {
      data.append('mainImage', files.mainImage);
    }
    
    if (files.galleryImages && files.galleryImages.length > 0) {
      files.galleryImages.forEach((file) => {
        data.append('galleryImages', file);
      });
    }
    
    if (files.video) {
      data.append('video', files.video);
    }

    try {
      const response = await axios.post('/api/previews/upload', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // Redirect to Amazon demo with previewId
      if (formData.platform === 'AMAZON') {
         navigate(`/amazon?previewId=${response.data.id}`);
      } else {
         navigate(`/etsy?previewId=${response.data.id}`);
      }
    } catch (error) {
      console.error('Upload failed', error);
      alert('Upload failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black font-sans flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full bg-white p-8 rounded-xl shadow-lg">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Tạo Bản Xem Trước</h2>
          <p className="mt-2 text-sm text-gray-600">
            Design / Media Upload
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tên Dự Án</label>
              <input
                type="text"
                name="projectName"
                required
                value={formData.projectName}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nền Tảng</label>
              <select
                name="platform"
                value={formData.platform}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="AMAZON">Amazon</option>
                <option value="ETSY">Etsy</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tiêu đề sản phẩm</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Giá ($)</label>
            <input
              type="number"
              name="price"
              step="0.01"
              value={formData.price}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Files</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Ảnh Chính (Main Image)</label>
                <input
                  type="file"
                  name="mainImage"
                  accept="image/*"
                  required
                  onChange={handleFileChange}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Ảnh Phụ (Gallery Images)</label>
                <input
                  type="file"
                  name="galleryImages"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Video (Tùy chọn)</label>
                <input
                  type="file"
                  name="video"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isUploading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isUploading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
            >
              {isUploading ? 'Đang tải lên...' : 'Tạo Bản Xem Trước'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadPreviewPage;
