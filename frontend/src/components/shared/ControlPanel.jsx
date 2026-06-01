import React, { useState } from 'react';
import { useProductStore } from '../../stores/productStore';
import { Settings, X, Upload, Plus, Trash2, Video } from 'lucide-react';
import { useCommentStore } from '../../stores/useCommentStore';
import CommentSection from './CommentSection';

const ControlPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('DESIGN'); 
  const { currentRole, setRole } = useCommentStore();
  
  const store = useProductStore();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      store.addImage(url);
    }
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      store.addVideo(url);
    }
  };

  const handleAPlusUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      store.addAPlusImage(url);
    }
  };

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    store.setTextInfo({ [name]: value });
  };

  const handleAddColor = () => {
    store.addColor({ name: 'New Color', image: 'https://via.placeholder.com/100', price: store.price });
  };

  const handleAddSize = () => {
    store.addSize('New Size');
  };

  const handleBulletChange = (idx, value) => {
    const newBullets = [...store.bulletPoints];
    newBullets[idx] = value;
    store.setTextInfo({ bulletPoints: newBullets });
  };

  return (
    <>
      {/* Floating Toggle Button - Hidden as per request (will be replaced by login system later) */}
      {/*
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gray-900 text-white p-4 rounded-full shadow-2xl z-50 hover:bg-gray-800 transition-colors"
      >
        <Settings size={24} />
      </button>
      */}

      {/* Side Panel */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col border-l border-gray-200`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <h2 className="text-lg font-bold">Workspace Control Panel</h2>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-200 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Role Switcher */}
        <div className="bg-orange-100 p-2 border-b border-orange-200 flex justify-between items-center">
          <span className="text-xs font-bold text-orange-800">Simulate Role:</span>
          <select 
            value={currentRole} 
            onChange={(e) => setRole(e.target.value)}
            className="text-xs p-1 border border-orange-300 rounded outline-none bg-white"
          >
            <option value="SELLER">SELLER (All Access)</option>
            <option value="DESIGN">DESIGN TEAM (Images Only)</option>
            <option value="MEDIA">MEDIA TEAM (Videos Only)</option>
          </select>
        </div>

        {/* Tabs */}
        <div className="flex border-b text-sm font-semibold">
          <button onClick={() => setActiveTab('DESIGN')} className={`flex-1 py-3 text-center ${activeTab === 'DESIGN' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>Design/Media</button>
          <button onClick={() => setActiveTab('SELLER')} className={`flex-1 py-3 text-center ${activeTab === 'SELLER' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>Seller (Text)</button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          
          {/* DESIGN / MEDIA TAB */}
          {activeTab === 'DESIGN' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Image Management</h3>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {store.images.map((img, idx) => (
                    <div key={idx} className="relative group rounded border overflow-hidden aspect-square">
                      <img src={img} alt="upload" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => store.removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <label className="border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 aspect-square text-gray-500">
                    <Plus size={20} />
                    <span className="text-xs mt-1">Add Image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-bold text-gray-800 mb-2">A+ Content (Banners)</h3>
                <div className="space-y-2 mb-2">
                  {store.aPlusImages?.map((img, idx) => (
                    <div key={idx} className="relative group rounded border overflow-hidden w-full h-24">
                      <img src={img} alt="A+ Content" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => store.removeAPlusImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                  <label className="border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 w-full h-12 text-gray-500">
                    <span className="text-xs font-semibold flex items-center"><Plus size={14} className="mr-1" /> Add A+ Banner</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAPlusUpload} />
                  </label>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-bold text-gray-800 mb-2">Video Management</h3>
                <div className="space-y-2">
                  {store.videos.map((vid, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 border rounded bg-gray-50">
                      <span className="text-sm truncate mr-2">Video {idx + 1}</span>
                      <button onClick={() => store.removeVideo(idx)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <label className="flex items-center justify-center w-full p-2 border-2 border-dashed border-gray-300 rounded text-gray-600 hover:bg-gray-50 cursor-pointer">
                    <Upload size={16} className="mr-2" /> Upload Video (MP4)
                    <input type="file" accept="video/mp4" className="hidden" onChange={handleVideoUpload} />
                  </label>
                </div>
              </div>

              <CommentSection targetComponent="DESIGN_MEDIA" />
            </div>
          )}

          {/* SELLER TAB */}
          {activeTab === 'SELLER' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Product Title</label>
                <textarea name="title" value={store.title} onChange={handleTextChange} className="w-full p-2 border rounded focus:border-blue-500 outline-none h-20" />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-bold mb-1">Price ($)</label>
                  <input type="number" name="price" value={store.price} onChange={handleTextChange} className="w-full p-2 border rounded focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">List Price ($)</label>
                  <input type="number" name="oldPrice" value={store.oldPrice} onChange={handleTextChange} className="w-full p-2 border rounded focus:border-blue-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Discount %</label>
                <input type="number" name="discountPercent" value={store.discountPercent} onChange={handleTextChange} className="w-full p-2 border rounded focus:border-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Sales Stats (e.g. 3K+ bought)</label>
                <input type="text" name="salesStat" value={store.salesStat} onChange={handleTextChange} className="w-full p-2 border rounded focus:border-blue-500 outline-none" />
              </div>

              {/* Variations */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-gray-800">Colors</h3>
                  <button onClick={handleAddColor} className="text-blue-500 text-sm flex items-center hover:underline"><Plus size={14}/> Add</button>
                </div>
                {store.colors?.map((color, idx) => (
                  <div key={idx} className="flex space-x-2 mb-2 items-center">
                    <img src={color.image} className="w-8 h-8 object-cover rounded" />
                    <span className="text-sm truncate w-24">{color.name}</span>
                    <button onClick={() => store.removeColor(idx)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-gray-800">Sizes</h3>
                  <button onClick={handleAddSize} className="text-blue-500 text-sm flex items-center hover:underline"><Plus size={14}/> Add</button>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {store.sizes?.map((size, idx) => (
                    <div key={idx} className="bg-gray-100 text-xs px-2 py-1 rounded flex items-center">
                      {size} 
                      <button onClick={() => store.removeSize(idx)} className="ml-1 text-red-500"><X size={10} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Brand Name</label>
                <input type="text" name="brand" value={store.brand} onChange={handleTextChange} className="w-full p-2 border rounded focus:border-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Product Description</label>
                <textarea 
                  name="description" 
                  value={store.description} 
                  onChange={handleTextChange} 
                  className="w-full p-2 border rounded focus:border-blue-500 outline-none h-32" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Bullet Points</label>
                {store.bulletPoints.map((point, idx) => (
                  <div key={idx} className="flex mb-2">
                    <textarea 
                      value={point} 
                      onChange={(e) => handleBulletChange(idx, e.target.value)} 
                      className="flex-1 p-2 border rounded text-sm focus:border-blue-500 outline-none h-16"
                    />
                  </div>
                ))}
                <button 
                  onClick={() => store.setTextInfo({ bulletPoints: [...store.bulletPoints, 'New bullet point...'] })}
                  className="text-sm text-blue-600 font-semibold flex items-center hover:underline"
                >
                  <Plus size={14} className="mr-1" /> Add Bullet Point
                </button>
              </div>
              <CommentSection targetComponent="TEXT" />
            </div>
          )}

        </div>
        
        {/* Footer Actions */}
        <div className="p-4 border-t bg-gray-50 flex justify-end space-x-2">
          <button onClick={store.resetData} className="px-4 py-2 border rounded font-semibold text-gray-700 hover:bg-gray-100">Reset</button>
          <button onClick={() => setIsOpen(false)} className="px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700">Save & Apply</button>
        </div>
      </div>
    </>
  );
};

export default ControlPanel;
