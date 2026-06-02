import React, { useState, useEffect } from 'react';
import Header from '../components/amazon/Header';
import { useProductStore } from '../stores/productStore';
import axios from 'axios';

const AmazonSearchPage = () => {
  const store = useProductStore();
  const [injectIndex, setInjectIndex] = useState(1);
  const [keyword, setKeyword] = useState(store.title ? store.title.split(' ').slice(0, 2).join(' ') : 'shirt');
  const [searchInput, setSearchInput] = useState(store.title ? store.title.split(' ').slice(0, 2).join(' ') : 'shirt');
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchResults();
  }, [keyword]);

  const fetchResults = async (forceRefresh = false) => {
    setLoading(true);
    try {
      // Call backend scraper API
      const response = await axios.get(`http://localhost:8081/api/amazon/search?keyword=${encodeURIComponent(keyword)}${forceRefresh ? '&forceRefresh=true' : ''}`);
      if (response.data && response.data.length > 0) {
        setCompetitors(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch search results:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setKeyword(searchInput.trim());
    }
  };

  // Combine competitors with our injected product
  const renderResults = () => {
    let results = [...competitors];
    
    // Create injected item from store
    const injectedProduct = {
      id: 'injected',
      title: store.title,
      image: store.images[0] || 'https://via.placeholder.com/500?text=No+Image',
      price: Number(store.price) || 0,
      rating: store.rating || '0.0',
      reviews: store.reviewsCount || '0',
      isSponsored: true, // often injected as sponsored to see how it looks
      isInjected: true // flag to highlight it
    };

    // Insert at chosen index
    results.splice(injectIndex, 0, injectedProduct);
    return results;
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Header />
      
      {/* Dev Toolbar for Injection Selection */}
      <div className="bg-gray-100 p-2 border-b border-gray-300 flex items-center justify-center text-sm sticky top-0 z-40 shadow-sm">
        <span className="font-bold mr-4 text-orange-600">Search Preview Mode</span>
        <span className="mr-2">Inject my product at position:</span>
        <select 
          value={injectIndex} 
          onChange={(e) => setInjectIndex(Number(e.target.value))}
          className="p-1 border border-gray-300 rounded outline-none"
        >
          <option value={0}>Position 1 (Top)</option>
          <option value={1}>Position 2</option>
          <option value={2}>Position 3</option>
          <option value={3}>Position 4</option>
          <option value={5}>Position 6</option>
        </select>
        
        <form onSubmit={handleSearchSubmit} className="ml-8 flex items-center">
          <input 
            type="text" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="p-1 border border-gray-300 rounded-l outline-none w-48 px-2"
            placeholder="Search Amazon..."
          />
          <button type="submit" className="bg-amazon-yellow text-black px-3 py-1 rounded-r border border-amazon-yellow font-bold">
            Search
          </button>
        </form>
      </div>

      {/* Results Header */}
      <div className="px-4 py-2 text-sm shadow-sm border-b flex justify-between items-center">
        <div>
          <span>1-48 of over 60,000 results for </span><span className="text-orange-600 font-bold">"{keyword}"</span>
        </div>
        <button 
          onClick={() => fetchResults(true)} 
          className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded shadow-sm border border-gray-300 flex items-center transition-colors"
        >
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          Update from Amazon
        </button>
      </div>

      <div className="flex max-w-[1600px] mx-auto mt-4 px-4">
        {/* Left Sidebar Filters */}
        <div className="w-64 flex-shrink-0 hidden md:block pr-6 border-r text-sm text-gray-900">
          <div className="mb-4">
            <h3 className="font-bold mb-1">Delivery Day</h3>
            <label className="flex items-center text-sm cursor-pointer hover:text-orange-600 mb-1">
              <input type="checkbox" className="mr-2" /> Get It Today
            </label>
            <label className="flex items-center text-sm cursor-pointer hover:text-orange-600">
              <input type="checkbox" className="mr-2" /> Get It by Tomorrow
            </label>
          </div>

          <div className="mb-4">
            <h3 className="font-bold mb-1">Gender</h3>
            <ul className="space-y-1">
              <li><label className="flex items-center cursor-pointer hover:text-orange-600"><input type="checkbox" className="mr-2" /> Men</label></li>
              <li><label className="flex items-center cursor-pointer hover:text-orange-600"><input type="checkbox" className="mr-2" /> Women</label></li>
              <li><label className="flex items-center cursor-pointer hover:text-orange-600"><input type="checkbox" className="mr-2" /> Boys</label></li>
              <li><label className="flex items-center cursor-pointer hover:text-orange-600"><input type="checkbox" className="mr-2" /> Girls</label></li>
              <li><label className="flex items-center cursor-pointer hover:text-orange-600"><input type="checkbox" className="mr-2" /> Babies</label></li>
              <li><label className="flex items-center cursor-pointer hover:text-orange-600"><input type="checkbox" className="mr-2" /> Unisex</label></li>
            </ul>
          </div>
          
          <div className="mb-4">
            <h3 className="font-bold mb-2">Color</h3>
            <div className="flex flex-wrap gap-2">
              <div className="w-6 h-6 rounded-full border border-gray-300 bg-white cursor-pointer hover:ring-2 hover:ring-orange-500"></div>
              <div className="w-6 h-6 rounded-full border border-gray-300 bg-black cursor-pointer hover:ring-2 hover:ring-orange-500"></div>
              <div className="w-6 h-6 rounded-full border border-gray-300 bg-gray-400 cursor-pointer hover:ring-2 hover:ring-orange-500"></div>
              <div className="w-6 h-6 rounded-full border border-gray-300 bg-[#8b4513] cursor-pointer hover:ring-2 hover:ring-orange-500"></div>
              <div className="w-6 h-6 rounded-full border border-gray-300 bg-red-600 cursor-pointer hover:ring-2 hover:ring-orange-500"></div>
              <div className="w-6 h-6 rounded-full border border-gray-300 bg-pink-400 cursor-pointer hover:ring-2 hover:ring-orange-500"></div>
              <div className="w-6 h-6 rounded-full border border-gray-300 bg-orange-500 cursor-pointer hover:ring-2 hover:ring-orange-500"></div>
              <div className="w-6 h-6 rounded-full border border-gray-300 bg-yellow-400 cursor-pointer hover:ring-2 hover:ring-orange-500"></div>
              <div className="w-6 h-6 rounded-full border border-gray-300 bg-green-500 cursor-pointer hover:ring-2 hover:ring-orange-500"></div>
              <div className="w-6 h-6 rounded-full border border-gray-300 bg-blue-500 cursor-pointer hover:ring-2 hover:ring-orange-500"></div>
              <div className="w-6 h-6 rounded-full border border-gray-300 bg-purple-500 cursor-pointer hover:ring-2 hover:ring-orange-500"></div>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-bold mb-2">Men's General Size</h3>
            <div className="flex flex-wrap gap-1">
              {['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL'].map(size => (
                <div key={size} className="border border-gray-300 rounded px-2 py-1 text-xs cursor-pointer hover:bg-gray-100">{size}</div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-bold mb-2">Women's General Size</h3>
            <div className="flex flex-wrap gap-1">
              {['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '6XL'].map(size => (
                <div key={size} className="border border-gray-300 rounded px-2 py-1 text-xs cursor-pointer hover:bg-gray-100">{size}</div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-bold mb-2">Men's Big & Tall Size</h3>
            <div className="flex flex-wrap gap-1">
              {['ST', 'MT', 'LT', 'XLT', '2XBT', '3XBT', '4XBT', '5XBT', 'XLB', '2XLB', '3XLB', '4XLB', '5XLB'].map(size => (
                <div key={size} className="border border-gray-300 rounded px-2 py-1 text-xs cursor-pointer hover:bg-gray-100">{size}</div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-bold mb-2">Women's Regular Numeric Size</h3>
            <div className="flex flex-wrap gap-1">
              {['1-2', '3-4', '5-6', '7-8', '9-10', '11-12'].map(size => (
                <div key={size} className="border border-gray-300 rounded px-2 py-1 text-xs cursor-pointer hover:bg-gray-100">{size}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Search Results */}
        <div className="flex-grow pl-0 md:pl-6 pb-20">
          <h2 className="text-xl font-bold mb-4">Results</h2>
          
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
              <span className="ml-3 text-lg text-gray-600">Fetching real-time data from Amazon...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {renderResults().map((item, idx) => {
                const colorsCount = item.isInjected ? 3 : Math.floor(Math.random() * 40) + 1;
                const brand = item.isInjected ? store.brand || 'Your Brand' : (item.brand || item.title.split(' ')[0] + ' ' + (item.title.split(' ')[1] || ''));
                const boughtCount = item.isInjected ? '1K+ bought in past month' : (item.salesVolume || (Math.floor(Math.random() * 9) + 1) * 100 + '+ bought in past month');
                const isOverallPick = idx === 4;
                const isLimitedTimeDeal = idx === 3;
                const originalPrice = item.originalPrice || Math.floor((item.price || 19) * 1.3) + 0.99;

                return (
                  <div 
                    key={item.id || idx} 
                    className={`border rounded-lg overflow-hidden flex flex-col hover:shadow-lg transition-shadow bg-white ${item.isInjected ? 'ring-2 ring-blue-500 shadow-md relative' : 'border-gray-200'}`}
                  >
                    {item.isInjected && (
                      <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs font-bold px-2 py-1 z-10 rounded-br-lg">
                        YOUR PRODUCT
                      </div>
                    )}
                    
                    {/* Image Area */}
                    <div className="h-64 bg-gray-50 flex items-center justify-center p-2 relative group cursor-pointer">
                      {isOverallPick && (
                        <span className="absolute top-0 left-0 bg-[#232F3E] text-white text-[10px] font-bold px-2 py-1 z-10">
                          Overall Pick
                        </span>
                      )}
                      <img src={item.image} alt={item.title} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                    </div>
                    
                    {/* Info Area */}
                    <div className="p-3 flex flex-col flex-grow text-sm">
                      <div className="mb-1 text-[13px] text-blue-600 hover:text-orange-500 hover:underline cursor-pointer">
                        +{colorsCount} other colors/patterns
                      </div>
                      
                      {item.isSponsored && (
                        <div className="text-[11px] text-gray-500 mb-1 flex items-center">
                          Sponsored <span className="ml-1 text-[10px] border border-gray-400 rounded-full w-3 h-3 flex items-center justify-center text-gray-400">i</span>
                        </div>
                      )}
                      
                      <div className="font-bold text-[14px] text-gray-900 leading-tight mb-1 truncate">
                        {brand}
                      </div>
                      
                      <h2 className="text-[13px] text-gray-900 leading-tight mb-1 hover:text-orange-600 cursor-pointer line-clamp-2 h-[34px]">
                        {item.title}
                      </h2>
                      
                      <div className="flex items-center space-x-1 mb-1 text-[13px]">
                        <span className="text-orange-500">★★★★☆</span>
                        <span className="text-blue-600 hover:underline cursor-pointer">({item.reviews || Math.floor(Math.random() * 2000) + 100})</span>
                      </div>
                      
                      <div className="text-[12px] text-gray-500 mb-2">
                        {boughtCount}
                      </div>
                      
                      {isLimitedTimeDeal && (
                        <div className="bg-[#cc0c39] text-white text-[11px] font-bold px-2 py-0.5 inline-block rounded-sm mb-1 w-fit">
                          Limited time deal
                        </div>
                      )}

                      <div className="flex items-baseline space-x-1 mt-auto">
                        <span className="text-[12px] align-top mt-1">$</span>
                        <span className="text-[28px] font-medium leading-none">{Math.floor(item.price || 19)}</span>
                        <span className="text-[12px] align-top mt-1">{((item.price || 19.99) % 1).toFixed(2).substring(2)}</span>
                      </div>
                      
                      {isLimitedTimeDeal && (
                        <div className="text-[11px] text-gray-500 mb-1">
                          List: <span className="line-through">${originalPrice}</span>
                        </div>
                      )}

                      <div className="text-[12px] text-gray-900 mt-2 leading-tight">
                        <span className="text-blue-500 font-bold">Join Prime</span> to get <span className="font-bold">FREE delivery</span> <span className="font-bold">Tomorrow, May 31</span>
                      </div>
                      
                      <div className="text-[11px] text-gray-500 mt-1 leading-tight">
                        Or Non-members get FREE delivery Thu, Jun 4 on $35 of items shipped by Amazon
                      </div>

                      <div className="mt-3 w-full">
                        <button className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-sm text-black py-1.5 px-3 rounded-full border border-[#FCD200] shadow-sm hover:shadow transition-all">
                          {idx % 2 === 0 ? 'See options' : 'Add to cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AmazonSearchPage;
