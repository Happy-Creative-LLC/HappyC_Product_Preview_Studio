import React, { useState, useEffect } from 'react';
import Header from '../components/amazon/Header';
import { useProductStore } from '../stores/productStore';
import axios from 'axios';

const AmazonSearchPage = () => {
  const store = useProductStore();
  const [injectIndex, setInjectIndex] = useState(1);
  const [keyword, setKeyword] = useState('shirt');
  const [searchInput, setSearchInput] = useState('shirt');
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
        <div className="w-64 flex-shrink-0 hidden md:block pr-6 border-r">
          <div className="mb-4">
            <h3 className="font-bold mb-1">Eligible for Free Shipping</h3>
            <label className="flex items-center text-sm cursor-pointer hover:text-orange-600">
              <input type="checkbox" className="mr-2" /> Free Shipping by Amazon
            </label>
          </div>
          
          <div className="mb-4">
            <h3 className="font-bold mb-1">Department</h3>
            <ul className="text-sm space-y-1">
              <li className="font-bold">Men's Fashion</li>
              <li className="pl-2 hover:text-orange-600 cursor-pointer">Men's Shirts</li>
              <li className="pl-4 hover:text-orange-600 cursor-pointer">Men's T-Shirts</li>
            </ul>
          </div>
          
          <div className="mb-4">
            <h3 className="font-bold mb-1">Customer Reviews</h3>
            <div className="text-orange-500 text-sm cursor-pointer hover:text-orange-600">★★★★☆ & Up</div>
            <div className="text-orange-500 text-sm cursor-pointer hover:text-orange-600">★★★☆☆ & Up</div>
          </div>

          <div className="mb-4">
            <h3 className="font-bold mb-1">Price</h3>
            <ul className="text-sm space-y-1 text-gray-700">
              <li className="hover:text-orange-600 cursor-pointer">Under $25</li>
              <li className="hover:text-orange-600 cursor-pointer">$25 to $50</li>
              <li className="hover:text-orange-600 cursor-pointer">$50 to $100</li>
            </ul>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {renderResults().map((item, idx) => (
                <div 
                  key={item.id || idx} 
                  className={`border rounded-lg overflow-hidden flex flex-col hover:shadow-lg transition-shadow bg-white ${item.isInjected ? 'ring-2 ring-blue-500 shadow-md relative' : 'border-gray-200'}`}
                >
                  {item.isInjected && (
                    <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs font-bold px-2 py-1 z-10 rounded-br-lg">
                      YOUR PRODUCT
                    </div>
                  )}
                  
                  {/* Image */}
                  <div className="h-64 bg-gray-50 flex items-center justify-center p-4 relative">
                    {item.badge && (
                      <span className="absolute top-0 left-0 bg-orange-600 text-white text-xs px-2 py-1">
                        {item.badge}
                      </span>
                    )}
                    <img src={item.image} alt={item.title} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                  </div>
                  
                  {/* Info */}
                  <div className="p-4 flex flex-col flex-grow">
                    {item.isSponsored && (
                      <span className="text-xs text-gray-500 mb-1">Sponsored</span>
                    )}
                    <h2 className="text-base font-medium text-gray-900 leading-tight mb-1 hover:text-orange-600 cursor-pointer line-clamp-2">
                      {item.title}
                    </h2>
                    
                    <div className="flex items-center space-x-1 mb-2">
                      <span className="text-orange-500 text-sm">★★★★☆</span>
                      <span className="text-sm text-blue-600">{item.reviews}</span>
                    </div>
                    
                    <div className="flex items-baseline space-x-1 mt-auto">
                      <span className="text-sm align-top mt-1">$</span>
                      <span className="text-2xl font-medium">{Math.floor(item.price || 0)}</span>
                      <span className="text-sm align-top mt-1">{((item.price || 0) % 1).toFixed(2).substring(2)}</span>
                    </div>
                    
                    <div className="text-sm text-gray-500 mt-1">
                      Delivery <span className="font-bold text-gray-900">Tomorrow</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Ships to Vietnam</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AmazonSearchPage;
