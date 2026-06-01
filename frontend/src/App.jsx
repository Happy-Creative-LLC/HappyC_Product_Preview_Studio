import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AmazonPreviewPage from './pages/AmazonPreviewPage';
import EtsyPreviewPage from './pages/EtsyPreviewPage';
import AmazonSearchPage from './pages/AmazonSearchPage';
import ControlPanel from './components/shared/ControlPanel';

const Landing = () => (
  <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden">
    {/* Background Image with Blur */}
    <div 
      className="absolute inset-0 z-0 scale-105"
      style={{ backgroundImage: "url('/background.jpg')", backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(8px)' }}
    ></div>
    
    {/* Content */}
    <div className="relative z-10 bg-white/60 p-10 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col items-center border border-white/40">
      <h1 className="text-4xl font-bold mb-8 text-gray-900 drop-shadow-sm">Happy Creative Preview Product</h1>
      <div className="flex space-x-6">
      <Link to="/amazon" className="px-6 py-3 bg-amazon-yellow text-black font-bold rounded shadow hover:bg-yellow-500">
        Amazon Preview
      </Link>
      <Link to="/search" className="px-6 py-3 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700">
        Amazon Search Simulator
      </Link>
      <Link to="/etsy" className="px-6 py-3 bg-orange-500 text-white font-bold rounded shadow hover:bg-orange-600">
        Etsy Preview
      </Link>
    </div>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/amazon" element={<AmazonPreviewPage />} />
        <Route path="/search" element={<AmazonSearchPage />} />
        <Route path="/etsy" element={<EtsyPreviewPage />} />
      </Routes>
      <ControlPanel />
    </Router>
  );
}

export default App;
