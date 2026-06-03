import React, { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Upload, X, Save } from 'lucide-react';

const AmazonUploadForm = ({ projectId, taskId, initialData }) => {
  const updateTaskProductData = useAppStore(state => state.updateTaskProductData);
  const [images, setImages] = useState(initialData?.images || []);
  const [aPlusImages, setAPlusImages] = useState(initialData?.aPlusImages || []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImages([...images, url]);
    }
  };

  const handleAPlusUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAPlusImages([...aPlusImages, url]);
    }
  };

  const removeImage = (idx) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const removeAPlusImage = (idx) => {
    setAPlusImages(aPlusImages.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    updateTaskProductData(projectId, taskId, { images, aPlusImages });
    alert("Saved successfully!");
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-xl font-bold text-gray-800">Upload Media Assets</h2>
        <button 
          onClick={handleSave}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Save size={18} />
          <span>Save Changes</span>
        </button>
      </div>

      {/* Main Images (1:1 Ratio) */}
      <div className="mb-10">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Main Product Images (1:1 Ratio)</h3>
        <p className="text-sm text-gray-500 mb-4">Minimum 1000x1000 pixels recommended for zoom.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {images.map((img, idx) => (
            <div key={idx} className="relative aspect-square border-2 border-gray-200 rounded-lg overflow-hidden group">
              <img src={img} alt={`Product ${idx}`} className="w-full h-full object-cover" />
              <button 
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:bg-red-50"
              >
                <X size={16} />
              </button>
              <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                Slot {idx + 1}
              </div>
            </div>
          ))}
          
          {images.length < 7 && (
            <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors">
              <Upload size={24} className="text-gray-400 mb-2" />
              <span className="text-xs text-gray-500 font-medium text-center px-2">Upload Image</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          )}
        </div>
      </div>

      {/* A+ Content (970:600 Ratio -> roughly 1.6:1) */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">A+ Content (970x600 Ratio)</h3>
        <p className="text-sm text-gray-500 mb-4">Upload rich content images for the description area.</p>
        
        <div className="flex flex-col space-y-6">
          {aPlusImages.map((img, idx) => (
            <div key={idx} className="relative w-full max-w-3xl border-2 border-gray-200 rounded-lg overflow-hidden group" style={{ aspectRatio: '970/600' }}>
              <img src={img} alt={`A+ Content ${idx}`} className="w-full h-full object-cover" />
              <button 
                onClick={() => removeAPlusImage(idx)}
                className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:bg-red-50"
              >
                <X size={20} />
              </button>
            </div>
          ))}
          
          <label className="w-full max-w-3xl border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors py-12">
            <Upload size={32} className="text-gray-400 mb-3" />
            <span className="text-sm text-gray-500 font-medium">Upload A+ Module Image</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleAPlusUpload} />
          </label>
        </div>
      </div>
    </div>
  );
};

export default AmazonUploadForm;
